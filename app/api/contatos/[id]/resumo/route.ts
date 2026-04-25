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

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Buscar todas as ocorrências vinculadas aos lançamentos deste contato
  const { data, error } = await supabase
    .from("ocorrencias")
    .select(`
      valor,
      valor_editado,
      status,
      cancelada,
      lancamento:lancamentos!inner (
        contato_id,
        user_id
      )
    `)
    .eq("lancamento.contato_id", id)
    .eq("lancamento.user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Agregação dos valores
  const resumo = data.reduce(
    (acc, oc) => {
      const valorEfetivo = Number(oc.valor_editado ?? oc.valor);
      
      if (oc.status === "BAIXADA") {
        acc.volume_total += valorEfetivo;
      } else if (oc.status === "PENDENTE" && !oc.cancelada) {
        acc.compromissos_pendentes += valorEfetivo;
      }
      
      return acc;
    },
    { volume_total: 0, compromissos_pendentes: 0 }
  );

  return NextResponse.json(resumo);
}
