import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { startOfMonth, endOfMonth, parseISO, format, differenceInMonths, addMonths } from "date-fns";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mes = searchParams.get("mes"); // Formato: YYYY-MM
  const natureza = searchParams.get("natureza");
  const contato_id = searchParams.get("contato_id");
  const atrasadas = searchParams.get("atrasadas");
  const contexto = searchParams.get("contexto");
  
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // --- Rotina de Deduplicação Global e Auto-Sync por Mês ---
  if (mes && /^\d{4}-\d{2}$/.test(mes)) {
    try {
      const date = parseISO(`${mes}-01`);
      const endOfMonthStr = format(endOfMonth(date), "yyyy-MM-dd");

      // 1. Buscar todas as ocorrências ativas do usuário para identificar duplicatas
      const { data: todasOcs, error: ocsError } = await supabase
        .from("ocorrencias")
        .select(`
          id,
          lancamento_id,
          numero_parcela,
          data_vencimento,
          data_competencia,
          status,
          cancelada,
          criado_em,
          valor,
          lancamento:lancamentos!inner (
            id,
            user_id,
            tipo,
            nome,
            natureza,
            contexto
          )
        `)
        .eq("lancamento.user_id", user.id)
        .is("cancelada", false);

      if (!ocsError && todasOcs) {
        // 2. DEDUPLICAÇÃO ATÔMICA: Agrupar por regra e mês de vencimento/competência
        const grupos = new Map<string, any[]>();

        todasOcs.forEach((oc: any) => {
          const tipo = oc.lancamento?.tipo;
          const mesRef = (oc.data_competencia || oc.data_vencimento || "").slice(0, 7);
          const nomeClean = (oc.lancamento?.nome || "").trim().toLowerCase();
          
          // Chave primária: mesmo lancamento_id no mesmo mês/parcela
          // Chave secundária: mesmo nome, valor, vencimento e natureza (caso haja lançamentos duplicados na origem)
          const chave = tipo === "PARCELA"
            ? `${oc.lancamento_id}_p_${oc.numero_parcela}`
            : `${oc.lancamento_id}_m_${mesRef}`;

          if (!grupos.has(chave)) {
            grupos.set(chave, []);
          }
          grupos.get(chave)!.push(oc);

          // Agrupamento por atributos para capturar regras idênticas criadas em duplicidade
          const chaveAtributos = `attr_${nomeClean}_${oc.valor}_${oc.data_vencimento}_${oc.lancamento?.natureza}`;
          if (!grupos.has(chaveAtributos)) {
            grupos.set(chaveAtributos, []);
          }
          grupos.get(chaveAtributos)!.push(oc);
        });

        const idsParaCancelar = new Set<string>();
        const ocsValidas = new Map<string, any>();

        grupos.forEach((itens) => {
          // Filtrar apenas itens que ainda não foram marcados para cancelamento
          const itensVivos = itens.filter(it => !idsParaCancelar.has(it.id));

          if (itensVivos.length > 1) {
            // Múltiplos registros para o mesmo lançamento no mesmo mês: duplicatas detectadas!
            // Critério de preservação:
            // 1. Status 'BAIXADA' tem prioridade máxima (não apagar comprovantes de pagamento)
            // 2. Mais antiga (menor criado_em ou menor id)
            itensVivos.sort((a, b) => {
              if (a.status === "BAIXADA" && b.status !== "BAIXADA") return -1;
              if (b.status === "BAIXADA" && a.status !== "BAIXADA") return 1;

              const timeA = a.criado_em ? new Date(a.criado_em).getTime() : 0;
              const timeB = b.criado_em ? new Date(b.criado_em).getTime() : 0;
              if (timeA !== timeB) return timeA - timeB;

              return String(a.id).localeCompare(String(b.id));
            });

            // O primeiro elemento é o que fica
            const keeper = itensVivos[0];
            ocsValidas.set(keeper.id, keeper);

            // Todos os seguintes são duplicatas que devem ser canceladas e deletadas
            for (let i = 1; i < itensVivos.length; i++) {
              idsParaCancelar.add(itensVivos[i].id);
            }
          } else if (itensVivos.length === 1) {
            ocsValidas.set(itensVivos[0].id, itensVivos[0]);
          }
        });

        const listaIdsParaCancelar = Array.from(idsParaCancelar);

        // Executar soft delete (cancelada = true) e tentativa de delete físico
        if (listaIdsParaCancelar.length > 0) {
          console.log(`[Deduplicacao] Cancelando ${listaIdsParaCancelar.length} ocorrencias duplicadas do usuario ${user.id}`);
          
          // Soft-delete imediato (compatível com todas as políticas RLS)
          await supabase
            .from("ocorrencias")
            .update({ cancelada: true })
            .in("id", listaIdsParaCancelar);

          // Hard-delete como faxina complementar
          try {
            await supabase.from("ocorrencias").delete().in("id", listaIdsParaCancelar);
          } catch (e) {
            // Se hard-delete for restrito por RLS, soft-delete já garante exclusão de todas as queries
          }
        }

        // 3. AUTO-SYNC: Buscar todas as regras ativas de FIXA e PARCELA do usuário
        const { data: regras } = await supabase
          .from("lancamentos")
          .select("id, valor_base, data_inicio, tipo, total_parcelas, user_id, nome, natureza")
          .eq("user_id", user.id)
          .in("tipo", ["FIXA", "PARCELA"])
          .eq("ativo", true)
          .lte("data_inicio", endOfMonthStr);

        if (regras && regras.length > 0) {
          const listaValidas = Array.from(ocsValidas.values());
          const ocsDoMesAtual = listaValidas.filter((oc: any) => {
            const venc = oc.data_vencimento || "";
            return venc.startsWith(mes);
          });

          const novasOcorrencias: any[] = [];

          regras.forEach((regra: any) => {
            const dataInicio = parseISO(regra.data_inicio);
            const diffMeses = differenceInMonths(date, startOfMonth(dataInicio));

            if (regra.tipo === "FIXA") {
              const jaExiste = ocsDoMesAtual.some((oc: any) => 
                oc.lancamento_id === regra.id || 
                (oc.lancamento?.nome === regra.nome && oc.lancamento?.natureza === regra.natureza)
              );

              if (!jaExiste && diffMeses >= 0) {
                const diaOriginal = parseInt(regra.data_inicio.split("-")[2] || "1", 10);
                const ultimoDia = endOfMonth(date).getDate();
                const diaValido = Math.min(Math.max(diaOriginal, 1), ultimoDia);
                const vencStr = `${mes}-${String(diaValido).padStart(2, "0")}`;

                novasOcorrencias.push({
                  lancamento_id: regra.id,
                  data_vencimento: vencStr,
                  data_competencia: `${mes}-01`,
                  valor: regra.valor_base,
                  status: "PENDENTE",
                });
                ocsDoMesAtual.push({ lancamento_id: regra.id });
              }
            } else if (regra.tipo === "PARCELA") {
              const numeroParcela = diffMeses + 1;
              if (numeroParcela > 0 && numeroParcela <= (regra.total_parcelas || 0)) {
                const jaExiste = ocsDoMesAtual.some(
                  (oc: any) => oc.lancamento_id === regra.id && oc.numero_parcela === numeroParcela
                );
                if (!jaExiste) {
                  const dataVenc = addMonths(dataInicio, diffMeses);
                  const dataStr = format(dataVenc, "yyyy-MM-dd");
                  const compStr = format(startOfMonth(dataVenc), "yyyy-MM-dd");

                  novasOcorrencias.push({
                    lancamento_id: regra.id,
                    numero_parcela: numeroParcela,
                    data_vencimento: dataStr,
                    data_competencia: compStr,
                    valor: regra.valor_base,
                    status: "PENDENTE",
                  });
                  ocsDoMesAtual.push({ lancamento_id: regra.id, numero_parcela: numeroParcela });
                }
              }
            }
          });

          if (novasOcorrencias.length > 0) {
            await supabase.from("ocorrencias").insert(novasOcorrencias);
          }
        }
      }
    } catch (syncErr) {
      console.error("[Auto-Sync/Deduplicacao Error]:", syncErr);
    }
  }

  // --- Consulta Oficial com Filtros Solicitados pelo Frontend ---
  const selectComContexto = `
    *,
    lancamento:lancamentos!inner (
      id,
      nome,
      natureza,
      tipo,
      contexto,
      total_parcelas,
      data_inicio,
      valor_base,
      local_pagamento:locais_pagamento(id, nome),
      regra_id:id,
      categoria:categorias (id, nome, cor),
      contato:contatos (id, nome)
    )
  `;

  const selectSemContexto = `
    *,
    lancamento:lancamentos!inner (
      id,
      nome,
      natureza,
      tipo,
      total_parcelas,
      data_inicio,
      valor_base,
      local_pagamento:locais_pagamento(id, nome),
      regra_id:id,
      categoria:categorias (id, nome, cor),
      contato:contatos (id, nome)
    )
  `;

  function createOcorrenciasQuery(selectFields: string, filterByContexto: boolean) {
    let q = (supabase
      .from("ocorrencias")
      .select(selectFields) as any)
      .eq("lancamento.user_id", user!.id)
      .is("cancelada", false);

    if (atrasadas === "true") {
      const hoje = format(new Date(), "yyyy-MM-dd");
      q = q.lt("data_vencimento", hoje).eq("status", "PENDENTE").eq("lancamento.natureza", "SAIDA");
    } else if (mes) {
      const date = parseISO(`${mes}-01`);
      const start = format(startOfMonth(date), "yyyy-MM-dd");
      const end = format(endOfMonth(date), "yyyy-MM-dd");
      q = q.gte("data_vencimento", start).lte("data_vencimento", end);
    }

    if (natureza && natureza !== "TODAS") {
      q = q.eq("lancamento.natureza", natureza);
    }

    if (contato_id) {
      q = q.eq("lancamento.contato_id", contato_id);
    }

    if (filterByContexto && contexto && contexto !== "TODOS") {
      q = q.eq("lancamento.contexto", contexto);
    }

    return q.order("data_vencimento", { ascending: true });
  }

  let temColunaContexto = true;
  let { data, error } = await createOcorrenciasQuery(selectComContexto, true);

  if (error && (error.code === "42703" || error.message?.includes("contexto"))) {
    temColunaContexto = false;
    const fallbackRes = await createOcorrenciasQuery(selectSemContexto, false);
    data = fallbackRes.data;
    error = fallbackRes.error;
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json([]);
  }

  // --- Estatísticas Financeiras para Parcelados ---
  const lancamentoIds = Array.from(new Set(data.map((oc: any) => oc.lancamento_id)));
  const { data: allRelated } = lancamentoIds.length > 0 
    ? await supabase
        .from("ocorrencias")
        .select("lancamento_id, valor, valor_editado, status")
        .in("lancamento_id", lancamentoIds)
        .is("cancelada", false)
    : { data: [] };

  const statsMap: Record<string, { total: number, pago: number }> = {};
  if (allRelated) {
    allRelated.forEach(oc => {
      if (!statsMap[oc.lancamento_id]) statsMap[oc.lancamento_id] = { total: 0, pago: 0 };
      const val = Number(oc.valor_editado ?? oc.valor);
      statsMap[oc.lancamento_id].total += val;
      if (oc.status === "BAIXADA") {
        statsMap[oc.lancamento_id].pago += val;
      }
    });
  }

  // Formatação uniforme para o frontend
  const flattenedData = data.map((oc: any) => {
    const stats = statsMap[oc.lancamento_id] || { total: 0, pago: 0 };
    return {
      ...oc,
      nome: oc.lancamento.nome,
      natureza: oc.lancamento.natureza,
      tipo: oc.lancamento.tipo,
      contexto: oc.lancamento.contexto || 'PESSOAL',
      total_parcelas: oc.lancamento.total_parcelas,
      valor_base: oc.lancamento.valor_base,
      onde_pagar: oc.lancamento.local_pagamento?.nome,
      categoria: oc.lancamento.categoria,
      contato: oc.lancamento.contato,
      regra_id: oc.lancamento.regra_id,
      financeiro_stats: {
        total: stats.total,
        pago: stats.pago,
        restante: stats.total - stats.pago
      }
    };
  });

  // --- CAMADA DE SEGURANÇA FINAL (In-Memory Deduplication) ---
  // Garante que mesmo sob qualquer condição imprevista no banco,
  // NUNCA serão retornados lançamentos duplicados para a interface.
  const chavesVistas = new Set<string>();
  const dadosDeduplicados = flattenedData.filter((oc: any) => {
    const mesRef = (oc.data_competencia || oc.data_vencimento || "").slice(0, 7);
    const nomeClean = (oc.nome || "").trim().toLowerCase();

    // 1. Chave por regra/lançamento
    const chaveRegra = oc.tipo === "PARCELA"
      ? `${oc.lancamento_id}_p_${oc.numero_parcela}`
      : `${oc.lancamento_id}_m_${mesRef}`;

    // 2. Chave por atributos idênticos (proteção contra múltiplos lançamentos idênticos)
    const chaveAtributos = `attr_${nomeClean}_${oc.valor}_${oc.data_vencimento}_${oc.natureza}_${oc.contexto}`;

    if (chavesVistas.has(chaveRegra) || chavesVistas.has(chaveAtributos)) {
      return false;
    }

    chavesVistas.add(chaveRegra);
    chavesVistas.add(chaveAtributos);
    return true;
  });

  return NextResponse.json(dadosDeduplicados);
}
