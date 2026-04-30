import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { 
  addMonths, 
  startOfMonth, 
  endOfMonth, 
  format
} from "date-fns";
import { ptBR } from "date-fns/locale";

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hoje = new Date();
  const meses = [];

  // Gerar intervalo de 7 meses (3 atrás, atual, 3 frente)
  for (let i = -3; i <= 3; i++) {
    const data = addMonths(hoje, i);
    meses.push({
      label: format(data, "MMM", { locale: ptBR }).replace('.', ''),
      inicio: format(startOfMonth(data), "yyyy-MM-dd"),
      fim: format(endOfMonth(data), "yyyy-MM-dd"),
      mes_referencia: format(data, "yyyy-MM"),
      entradas: 0,
      saidas: 0,
      is_atual: i === 0
    });
  }

  const dataInicioRange = meses[0].inicio;
  const dataFimRange = meses[6].fim;

  // 1. Buscar ocorrências reais no intervalo
  const { data: ocorrencias } = await supabase
    .from("ocorrencias")
    .select(`
      lancamento_id,
      valor,
      valor_editado,
      data_vencimento,
      lancamento:lancamentos!inner (natureza, user_id)
    `)
    .eq("lancamento.user_id", user.id)
    .gte("data_vencimento", dataInicioRange)
    .lte("data_vencimento", dataFimRange)
    .is("cancelada", false);

  // 2. Buscar regras FIXA para projeção futura
  const { data: regrasFixas } = await supabase
    .from("lancamentos")
    .select("id, natureza, valor_base, data_inicio")
    .eq("user_id", user.id)
    .eq("tipo", "FIXA")
    .eq("ativo", true);

  // Processar dados
  meses.forEach(m => {
    const mStart = new Date(m.inicio + "T12:00:00");
    const mEnd = new Date(m.fim + "T12:00:00");

    // Somar ocorrências reais
    ocorrencias?.forEach(oc => {
      const v = new Date(oc.data_vencimento + "T12:00:00");
      if (v >= mStart && v <= mEnd) {
        const valor = Number(oc.valor_editado ?? oc.valor);
        if (oc.lancamento.natureza === "ENTRADA") m.entradas += valor;
        else m.saidas += valor;
      }
    });

    // Projetar FIXAS para meses futuros onde não há ocorrência criada ainda
    const mesEhFuturo = mStart > startOfMonth(hoje);
    if (mesEhFuturo) {
      regrasFixas?.forEach(r => {
        const dataInicioRegra = new Date(r.data_inicio + "T12:00:00");
        if (dataInicioRegra <= mEnd) {
          // Verificar se já existe ocorrência para este lançamento neste mês específico
          const jaTemOcorrencia = ocorrencias?.some(oc => 
            oc.lancamento_id === r.id && 
            oc.data_vencimento.startsWith(m.mes_referencia)
          );
          
          if (!jaTemOcorrencia) {
            const valor = Number(r.valor_base);
            if (r.natureza === "ENTRADA") m.entradas += valor;
            else m.saidas += valor;
          }
        }
      });
    }
  });

  return NextResponse.json(meses);
}
