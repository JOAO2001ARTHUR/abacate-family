import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. Buscar contatos do usuário
  const { data: contatos, error: cError } = await supabase
    .from("contatos")
    .select("*")
    .eq("user_id", user.id);

  if (cError) return NextResponse.json({ error: cError.message }, { status: 500 });

  // 2. Buscar todas as ocorrências pendentes do usuário
  const { data: ocorrencias } = await supabase
    .from("ocorrencias")
    .select("valor, valor_editado, lancamento:lancamentos!inner(contato_id, user_id)")
    .eq("lancamento.user_id", user.id)
    .eq("status", "PENDENTE")
    .is("cancelada", false);

  // 3. Mapear saldos
  const saldoMap: Record<string, number> = {};
  ocorrencias?.forEach((oc: any) => {
    const contatoId = oc.lancamento?.contato_id;
    if (!contatoId) return;
    const val = Number(oc.valor_editado ?? oc.valor);
    saldoMap[contatoId] = (saldoMap[contatoId] || 0) + val;
  });

  // 4. Mesclar dados e ordenar (Saldo Pendente Decrescente, depois Nome)
  const data = contatos.map(c => ({
    ...c,
    saldo_pendente: saldoMap[c.id] || 0
  })).sort((a, b) => {
    if (b.saldo_pendente !== a.saldo_pendente) {
      return b.saldo_pendente - a.saldo_pendente;
    }
    return a.nome.localeCompare(b.nome);
  });

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const { data, error } = await supabase
    .from("contatos")
    .insert({
      ...body,
      user_id: user.id
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
