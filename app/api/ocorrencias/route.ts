import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { startOfMonth, endOfMonth, parseISO, format } from "date-fns";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mes = searchParams.get("mes"); // Format: YYYY-MM
  const natureza = searchParams.get("natureza");
  const contato_id = searchParams.get("contato_id");
  
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
        regra_id:id,
        categoria:categorias (id, nome, cor),
        contato:contatos (id, nome)
      )
    `)
    .eq("lancamento.user_id", user.id)
    .is("cancelada", false);

  if (mes) {
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

  // Flatten the data for the frontend (to match the expected interface)
  const flattenedData = data.map((oc: any) => ({
    ...oc,
    nome: oc.lancamento.nome,
    natureza: oc.lancamento.natureza,
    categoria: oc.lancamento.categoria,
    contato: oc.lancamento.contato,
    regra_id: oc.lancamento.regra_id
  }));

  return NextResponse.json(flattenedData);
}
