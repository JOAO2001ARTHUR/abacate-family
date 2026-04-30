import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface FluxoCaixaData {
  label: string;
  inicio: string;
  fim: string;
  mes_referencia: string;
  entradas: number;
  saidas: number;
  is_atual: boolean;
}

export function useFluxoCaixa() {
  return useQuery({
    queryKey: ['stats', 'fluxo-caixa'],
    queryFn: () => api.get<FluxoCaixaData[]>('/stats/fluxo-caixa'),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}
