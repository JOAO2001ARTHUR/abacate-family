import { z } from "zod";

export const schemaLancamento = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  natureza: z.enum(['ENTRADA', 'SAIDA']),
  tipo: z.enum(['FIXA', 'ESPORADICA', 'PARCELA']),
  total_parcelas: z.number().int().positive().optional(),
  valor_base: z.number().positive("Valor deve ser positivo"),
  data_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  data_fim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida").optional(),
  categoria_id: z.string().uuid("Categoria inválida"),
  contato_id: z.string().uuid("Contato inválido").optional(),
}).refine(data => {
  // PARCELA exige total_parcelas, não usa data_fim
  if (data.tipo === 'PARCELA') return !!data.total_parcelas && !data.data_fim;
  // FIXA pode ter data_fim, nunca total_parcelas
  if (data.tipo === 'FIXA') return !data.total_parcelas;
  // ESPORADICA não usa nenhum dos dois
  if (data.tipo === 'ESPORADICA') return !data.total_parcelas && !data.data_fim;
  return true;
}, { message: "Combinação de tipo e campos inválida" });

export const schemaCategoria = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  cor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida — use formato #RRGGBB"),
  icone: z.string().optional(),
  ordem: z.number().int().default(0),
  ativo: z.boolean().default(true),
});

export type LancamentoInput = z.infer<typeof schemaLancamento>;
export type CategoriaInput = z.infer<typeof schemaCategoria>;
