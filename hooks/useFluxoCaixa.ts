import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useUIStore } from "@/stores/useUIStore";

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
  const { contextoAtivo } = useUIStore();

  return useQuery({
    queryKey: ['stats', 'fluxo-caixa', contextoAtivo],
    queryFn: () => api.get<FluxoCaixaData[]>('/stats/fluxo-caixa', { contexto: contextoAtivo }),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}
