import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Contato {
  id: string;
  nome: string;
  email?: string;
  tipo_predominante?: 'ENTRADA' | 'SAIDA';
}

export interface ContatoResumo {
  volume_total: number;
  compromissos_pendentes: number;
}

export function useContatos() {
  return useQuery({
    queryKey: ['contatos'],
    queryFn: () => api.get<Contato[]>('/contatos'),
  });
}

export function useContatoResumo(id: string | null) {
  return useQuery({
    queryKey: ['contatos', id, 'resumo'],
    queryFn: () => id ? api.get<ContatoResumo>(`/contatos/${id}/resumo`) : null,
    enabled: !!id,
  });
}
