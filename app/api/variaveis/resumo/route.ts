import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dimensao = searchParams.get("dimensao");
  const id = searchParams.get("id");

  if (!dimensao || !id) {
    return NextResponse.json({ error: "Missing dimensao or id parameters" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let query = supabase
    .from("ocorrencias")
    .select(`
      id,
      valor,
      valor_editado,
      status,
      cancelada,
      data_vencimento,
      numero_parcela,
      lancamento:lancamentos!inner (
        id,
        nome,
        tipo,
        total_parcelas,
        natureza,
        contato_id,
        categoria_id,
        local_pagamento_id,
        user_id,
        valor_base
      )
    `)
    .eq("lancamento.user_id", user.id)
    .order("data_vencimento", { ascending: false });

  // Aplicar filtro baseado na dimensão
  if (dimensao === 'contato') {
    query = query.eq("lancamento.contato_id", id);
  } else if (dimensao === 'categoria') {
    query = query.eq("lancamento.categoria_id", id);
  } else if (dimensao === 'onde_pagar') {
    query = query.eq("lancamento.local_pagamento_id", id);
  } else if (dimensao === 'recorrencia') {
    query = query.eq("lancamento.tipo", id);
  } else {
    return NextResponse.json({ error: "Invalid dimensao" }, { status: 400 });
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Agregação dos valores e classificação
  const totais_por_mes: Record<string, { pago: number, pendente: number }> = {};
  const por_tipo: any = { FIXA: {}, PARCELA: {}, ESPORADICA: [] };
  let volume_total = 0; // Tudo o que já foi pago
  let compromissos_pendentes = 0; // Tudo o que falta pagar

  data.forEach((oc: any) => {
    const valorEfetivo = Number(oc.valor_editado ?? oc.valor);
    const mes = oc.data_vencimento.substring(0, 7); // YYYY-MM
    const tipo = oc.lancamento.tipo;

    if (!totais_por_mes[mes]) totais_por_mes[mes] = { pago: 0, pendente: 0 };

    if (oc.status === "BAIXADA") {
      volume_total += valorEfetivo;
      totais_por_mes[mes].pago += valorEfetivo;
    } else if (oc.status === "PENDENTE" && !oc.cancelada) {
      compromissos_pendentes += valorEfetivo;
      totais_por_mes[mes].pendente += valorEfetivo;
    }

    if (tipo === "FIXA") {
      if (!por_tipo.FIXA[oc.lancamento.id]) {
        por_tipo.FIXA[oc.lancamento.id] = {
          nome: oc.lancamento.nome,
          natureza: oc.lancamento.natureza,
          ocorrencias: []
        };
      }
      por_tipo.FIXA[oc.lancamento.id].ocorrencias.push(oc);
    } else if (tipo === "PARCELA") {
      if (!por_tipo.PARCELA[oc.lancamento.id]) {
        por_tipo.PARCELA[oc.lancamento.id] = {
          nome: oc.lancamento.nome,
          natureza: oc.lancamento.natureza,
          total_parcelas: oc.lancamento.total_parcelas,
          parcelas_pagas: 0,
          valor_total: 0,
          valor_pago: 0,
          ocorrencias: []
        };
      }
      const p = por_tipo.PARCELA[oc.lancamento.id];
      p.ocorrencias.push(oc);
      p.valor_total += valorEfetivo;
      if (oc.status === "BAIXADA") {
        p.parcelas_pagas += 1;
        p.valor_pago += valorEfetivo;
      }
    } else {
      por_tipo.ESPORADICA.push(oc);
    }
  });

  // Converter objetos em arrays para facilitar no frontend
  const response = {
    resumo: {
      volume_total, // Já pago
      compromissos_pendentes, // A pagar
    },
    totais_por_mes: Object.entries(totais_por_mes)
      .map(([mes, valores]) => ({ 
        mes, 
        valor: valores.pago + valores.pendente,
        pago: valores.pago,
        pendente: valores.pendente,
        progresso: Math.round((valores.pago / (valores.pago + valores.pendente || 1)) * 100)
      }))
      .sort((a, b) => a.mes.localeCompare(b.mes)),
    por_tipo: {
      FIXA: Object.values(por_tipo.FIXA),
      PARCELA: Object.values(por_tipo.PARCELA),
      ESPORADICA: por_tipo.ESPORADICA
    },
    historico: data // Todas as movimentações
  };

  return NextResponse.json(response);
}
