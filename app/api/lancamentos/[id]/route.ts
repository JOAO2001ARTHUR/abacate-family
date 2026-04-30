import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { addMonths, parseISO, format } from "date-fns";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("lancamentos")
    .select("*, categoria:categorias(id, nome), contato:contatos(id, nome)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { escopo, idOcorrenciaRef, ...dadosLancamento } = body;

  // 1. Atualizar o lançamento principal (a regra) - Exceto se for edição de ocorrência única
  if (escopo !== "APENAS_ESTE") {
    const { error: lError } = await supabase
      .from("lancamentos")
      .update({
        nome: dadosLancamento.nome,
        categoria_id: dadosLancamento.categoria_id,
        contato_id: dadosLancamento.contato_id,
        local_pagamento_id: dadosLancamento.local_pagamento_id,
        valor_base: dadosLancamento.valor_base,
        natureza: dadosLancamento.natureza,
        tipo: dadosLancamento.tipo,
        total_parcelas: dadosLancamento.total_parcelas,
      })
      .eq("id", id)
      .eq("user_id", user.id);

    if (lError) return NextResponse.json({ error: lError.message }, { status: 500 });

    // --- Lógica para criar parcelas adicionais se o total aumentou ---
    if (dadosLancamento.tipo === "PARCELA" && dadosLancamento.total_parcelas) {
      // Buscar a última parcela existente
      const { data: ocorrenciasAtuais } = await supabase
        .from("ocorrencias")
        .select("numero_parcela, data_vencimento")
        .eq("lancamento_id", id)
        .order("numero_parcela", { ascending: false })
        .limit(1);

      const ultimaParc = ocorrenciasAtuais?.[0];
      const ultimaNum = ultimaParc?.numero_parcela || 0;

      if (dadosLancamento.total_parcelas > ultimaNum) {
        const novasOcorrencias = [];
        for (let i = ultimaNum + 1; i <= dadosLancamento.total_parcelas; i++) {
          const dataReferencia = ultimaParc?.data_vencimento 
            ? parseISO(ultimaParc.data_vencimento) 
            : new Date(); // Fallback improvável mas seguro
          
          const novaDataVenc = addMonths(dataReferencia, i - ultimaNum);
          const dataStr = format(novaDataVenc, "yyyy-MM-dd");

          novasOcorrencias.push({
            lancamento_id: id,
            numero_parcela: i,
            data_vencimento: dataStr,
            data_competencia: dataStr,
            valor: dadosLancamento.valor_base,
            status: "PENDENTE",
          });
        }

        if (novasOcorrencias.length > 0) {
          const { error: insError } = await supabase.from("ocorrencias").insert(novasOcorrencias);
          if (insError) console.error("Erro ao criar parcelas adicionais:", insError);
        }
      }
    }
  }

  // 2. Atualizar as ocorrências vinculadas conforme o escopo
  if (escopo && idOcorrenciaRef) {
    // Buscar a ocorrência de referência para saber a data/parcela
    const { data: ocRef } = await supabase
      .from("ocorrencias")
      .select("data_vencimento")
      .eq("id", idOcorrenciaRef)
      .single();

    if (ocRef) {
      let query = supabase
        .from("ocorrencias")
        .update({
          valor: dadosLancamento.valor_base,
          valor_editado: null, // Resetar edições manuais para seguir a nova regra do formulário
        })
        .eq("lancamento_id", id);

      if (escopo === "APENAS_ESTE") {
        query = query.eq("id", idOcorrenciaRef);
      } else if (escopo === "ESTE_E_PROXIMOS") {
        query = query.gte("data_vencimento", ocRef.data_vencimento);
      } else if (escopo === "ESTE_E_ANTERIORES") {
        query = query.lte("data_vencimento", ocRef.data_vencimento);
      }
      // "TODOS" não precisa de filtro extra além do lancamento_id

      const { error: oError } = await query;
      if (oError) return NextResponse.json({ error: oError.message }, { status: 500 });
    }
  } else if (escopo === "TODOS") {
    // Caso especial: se não temos idOcorrenciaRef mas o escopo é TODOS (raro via UI atual)
    const { error: oError } = await supabase
      .from("ocorrencias")
      .update({ 
        valor: dadosLancamento.valor_base,
        valor_editado: null 
      })
      .eq("lancamento_id", id);
    if (oError) return NextResponse.json({ error: oError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const escopo = searchParams.get("escopo") || "APENAS_ESTE";
  const idOcorrenciaRef = searchParams.get("idOcorrenciaRef");

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 1. Lógica por escopo
  if (escopo === "TODOS") {
    // Desativar a regra
    await supabase.from("lancamentos").update({ ativo: false }).eq("id", id);
    // Cancelar todas as ocorrências
    await supabase.from("ocorrencias").update({ cancelada: true }).eq("lancamento_id", id);
  } 
  else if (idOcorrenciaRef) {
    if (escopo === "APENAS_ESTE") {
      await supabase.from("ocorrencias").update({ cancelada: true }).eq("id", idOcorrenciaRef);
    } 
    else {
      // Buscar data de referência
      const { data: ocRef } = await supabase
        .from("ocorrencias")
        .select("data_vencimento")
        .eq("id", idOcorrenciaRef)
        .single();

      if (ocRef) {
        let query = supabase.from("ocorrencias").update({ cancelada: true }).eq("lancamento_id", id);
        
        if (escopo === "ESTE_E_PROXIMOS") {
          query = query.gte("data_vencimento", ocRef.data_vencimento);
          // Se estamos excluindo do atual para frente, a regra também deve ser desativada
          await supabase.from("lancamentos").update({ ativo: false }).eq("id", id);
        } else if (escopo === "ESTE_E_ANTERIORES") {
          query = query.lte("data_vencimento", ocRef.data_vencimento);
        }

        await query;
      }
    }
  }

  return NextResponse.json({ success: true });
}
