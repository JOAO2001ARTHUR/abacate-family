import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Contato {
  id: string;
  nome: string;
  email?: string;
  tipo_predominante?: 'ENTRADA' | 'SAIDA';
  saldo_pendente?: number;
}

export function useContatos() {
  return useQuery({
    queryKey: ['contatos'],
    queryFn: () => api.get<Contato[]>('/contatos'),
  });
}
