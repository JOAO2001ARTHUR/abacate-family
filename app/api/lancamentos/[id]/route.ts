import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

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

  // 1. Atualizar o lançamento principal (a regra)
  const { error: lError } = await supabase
    .from("lancamentos")
    .update({
      nome: dadosLancamento.nome,
      categoria_id: dadosLancamento.categoria_id,
      contato_id: dadosLancamento.contato_id,
      valor_base: dadosLancamento.valor_base,
      natureza: dadosLancamento.natureza,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (lError) return NextResponse.json({ error: lError.message }, { status: 500 });

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
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("lancamentos")
    .update({ ativo: false })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
