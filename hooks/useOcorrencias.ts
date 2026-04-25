import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useUIStore } from "@/stores/useUIStore";

export interface Ocorrencia {
  id: string;
  nome: string;
  valor: number;
  valor_editado?: number | null;
  data_vencimento: string;
  status?: 'PENDENTE' | 'BAIXADA';
  status_pago?: boolean;
  natureza: 'ENTRADA' | 'SAIDA';
  cancelada?: boolean;
  categoria?: {
    id: string;
    nome: string;
    cor: string;
    icone?: string;
  };
  contato?: {
    id: string;
    nome: string;
  } | null;
  numero_parcela?: number;
  total_parcelas?: number;
  regra_id?: string;
}

export function useOcorrencias(customFilters?: any) {
  const { mesAtivo, filtrosAtivos } = useUIStore();

  const finalFilters = customFilters || { 
    mes: mesAtivo,
    ...filtrosAtivos 
  };

  return useQuery({
    queryKey: ['ocorrencias', finalFilters],
    queryFn: () => api.get<Ocorrencia[]>('/ocorrencias', finalFilters),
    staleTime: 1000 * 60, // 1 minuto
  });
}

export function calcularStatusReal(ocorrencia: Ocorrencia) {
  if (ocorrencia.status === 'BAIXADA' || ocorrencia.status_pago) return 'BAIXADA';
  const hoje = new Date().toISOString().split('T')[0];
  if (ocorrencia.data_vencimento < hoje) return 'ATRASADA';
  return 'PENDENTE';
}
