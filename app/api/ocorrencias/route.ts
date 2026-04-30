import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { startOfMonth, endOfMonth, parseISO, format, differenceInMonths, addMonths } from "date-fns";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mes = searchParams.get("mes"); // Format: YYYY-MM
  const natureza = searchParams.get("natureza");
  const contato_id = searchParams.get("contato_id");
  const atrasadas = searchParams.get("atrasadas");
  
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let query = supabase
    .from("ocorrencias")
    .select(`
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
    `)
    .eq("lancamento.user_id", user.id)
    .eq("lancamento.ativo", true)
    .is("cancelada", false);

  if (atrasadas === "true") {
    const hoje = format(new Date(), "yyyy-MM-dd");
    query = query.lt("data_vencimento", hoje).eq("status", "PENDENTE");
  } else if (mes) {
    const date = parseISO(`${mes}-01`);
    const start = format(startOfMonth(date), "yyyy-MM-dd");
    const end = format(endOfMonth(date), "yyyy-MM-dd");
    
    query = query.gte("data_vencimento", start).lte("data_vencimento", end);
  }

  if (natureza && natureza !== "TODAS") {
    query = query.eq("lancamento.natureza", natureza);
  }

  if (contato_id) {
    query = query.eq("lancamento.contato_id", contato_id);
  }

  const { data, error } = await query.order("data_vencimento", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // --- Auto-Sync Logic (FIXA e PARCELA) ---
  if (mes && data.length > 0) {
    const date = parseISO(`${mes}-01`);
    const endOfMonthStr = format(endOfMonth(date), "yyyy-MM-dd");
    
    // 1. Buscar todas as regras ativas que começaram antes do fim deste mês
    const { data: regras } = await supabase
      .from("lancamentos")
      .select("id, valor_base, data_inicio, tipo, total_parcelas")
      .eq("user_id", user.id)
      .in("tipo", ["FIXA", "PARCELA"])
      .eq("ativo", true)
      .lte("data_inicio", endOfMonthStr);

    if (regras && regras.length > 0) {
      const idsPresentes = new Set(data.map((oc: any) => oc.lancamento_id));
      const novasOcorrencias: any[] = [];

      regras.forEach(regra => {
        if (idsPresentes.has(regra.id)) return;

        const dataInicio = parseISO(regra.data_inicio);
        const diffMeses = differenceInMonths(date, startOfMonth(dataInicio));

        if (regra.tipo === "FIXA") {
          const diaOriginal = regra.data_inicio.split('-')[2];
          novasOcorrencias.push({
            lancamento_id: regra.id,
            data_vencimento: `${mes}-${diaOriginal}`, 
            data_competencia: `${mes}-01`,
            valor: regra.valor_base,
            status: "PENDENTE",
          });
        } else if (regra.tipo === "PARCELA") {
          const numeroParcela = diffMeses + 1;
          if (numeroParcela > 0 && numeroParcela <= (regra.total_parcelas || 0)) {
            const dataVenc = addMonths(dataInicio, diffMeses);
            const dataStr = format(dataVenc, "yyyy-MM-dd");
            
            novasOcorrencias.push({
              lancamento_id: regra.id,
              numero_parcela: numeroParcela,
              data_vencimento: dataStr,
              data_competencia: dataStr,
              valor: regra.valor_base,
              status: "PENDENTE",
            });
          }
        }
      });

      if (novasOcorrencias.length > 0) {
        const { error: syncError } = await supabase.from("ocorrencias").insert(novasOcorrencias);
        
        if (!syncError) {
          // Recarrega os dados para incluir as novas ocorrências
          const { data: updatedData } = await query.order("data_vencimento", { ascending: true });
          if (updatedData) {
            // Re-mapeia e retorna os dados atualizados
            const syncLancamentoIds = [...new Set(updatedData.map((oc: any) => oc.lancamento_id))];
            const { data: syncRelated } = await supabase
              .from("ocorrencias")
              .select("lancamento_id, valor, valor_editado, status")
              .in("lancamento_id", syncLancamentoIds);

            const syncStatsMap: Record<string, { total: number, pago: number }> = {};
            if (syncRelated) {
              syncRelated.forEach(oc => {
                if (!syncStatsMap[oc.lancamento_id]) syncStatsMap[oc.lancamento_id] = { total: 0, pago: 0 };
                const val = Number(oc.valor_editado ?? oc.valor);
                syncStatsMap[oc.lancamento_id].total += val;
                if (oc.status === "BAIXADA") {
                  syncStatsMap[oc.lancamento_id].pago += val;
                }
              });
            }

            const flattened = updatedData.map((oc: any) => {
              const stats = syncStatsMap[oc.lancamento_id] || { total: 0, pago: 0 };
              return {
                ...oc,
                nome: oc.lancamento.nome,
                natureza: oc.lancamento.natureza,
                tipo: oc.lancamento.tipo,
                total_parcelas: oc.lancamento.total_parcelas,
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
            return NextResponse.json(flattened);
          }
        }
      }
    }
  }

  // --- Add Financial Stats for Parcelados ---
  const lancamentoIds = [...new Set(data.map((oc: any) => oc.lancamento_id))];
  const { data: allRelated } = await supabase
    .from("ocorrencias")
    .select("lancamento_id, valor, valor_editado, status")
    .in("lancamento_id", lancamentoIds);

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

  // Flatten the data for the frontend
  const flattenedData = data.map((oc: any) => {
    const stats = statsMap[oc.lancamento_id] || { total: 0, pago: 0 };
    return {
      ...oc,
      nome: oc.lancamento.nome,
      natureza: oc.lancamento.natureza,
      tipo: oc.lancamento.tipo,
      total_parcelas: oc.lancamento.total_parcelas,
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

  return NextResponse.json(flattenedData);
}
