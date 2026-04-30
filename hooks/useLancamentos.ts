import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Lancamento {
  id: string;
  nome: string;
  natureza: 'ENTRADA' | 'SAIDA';
  tipo: 'FIXA' | 'ESPORADICA' | 'PARCELA';
  total_parcelas?: number;
  valor_base: number;
  data_inicio: string;
  categoria_id: string;
  contato_id?: string;
  onde_pagar?: string;
  categoria?: { id: string, nome: string };
  contato?: { id: string, nome: string };
}

export function useLancamento(id: string | null) {
  return useQuery({
    queryKey: ['lancamentos', id],
    queryFn: () => id ? api.get<Lancamento>(`/lancamentos/${id}`) : null,
    enabled: !!id,
  });
}

export function useUpdateLancamento() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => 
      api.put(`/lancamentos/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ocorrencias'] });
      queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
      queryClient.invalidateQueries({ queryKey: ['contatos'] });
    },
  });
}
