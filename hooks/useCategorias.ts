import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Categoria {
  id: string;
  nome: string;
  cor: string;
  icone?: string;
  ativo: boolean;
}

export function useCategorias() {
  return useQuery({
    queryKey: ['categorias'],
    queryFn: () => api.get<Categoria[]>('/categorias'),
  });
}
