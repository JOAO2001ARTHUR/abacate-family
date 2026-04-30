import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface LocalPagamento {
  id: string;
  nome: string;
  icone?: string;
  ativo: boolean;
}

export function useLocaisPagamento() {
  return useQuery({
    queryKey: ['locais_pagamento'],
    queryFn: () => api.get<LocalPagamento[]>('/locais_pagamento'),
  });
}
