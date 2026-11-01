import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useUIStore } from "@/stores/useUIStore";

export interface VariavelResumo {
  resumo: {
    volume_total: number;
    compromissos_pendentes: number;
  };
  totais_por_mes: Array<{ mes: string; valor: number; pago: number; pendente: number; progresso: number }>;
  por_tipo: {
    FIXA: any[];
    PARCELA: any[];
    ESPORADICA: any[];
  };
  historico: any[];
}

export type DimensaoType = 'contato' | 'categoria' | 'onde_pagar' | 'recorrencia';

export function useVariavelResumo(dimensao: DimensaoType, id: string | null) {
  const { contextoAtivo } = useUIStore();

  return useQuery({
    queryKey: ['variaveis', dimensao, id, 'resumo', contextoAtivo],
    queryFn: () => id ? api.get<VariavelResumo>(`/variaveis/resumo?dimensao=${dimensao}&id=${id}&contexto=${contextoAtivo}`) : null,
    enabled: !!id && !!dimensao,
  });
}
