import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Moeda
export const formatarMoeda = (valor: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

// Data
export const formatarData = (data: string) => {
  if (!data) return "-";
  return new Date(data + 'T00:00:00').toLocaleDateString('pt-BR');
}

// Parcela
export const formatarParcela = (atual: number, total: number | null) =>
  total ? `${atual}/${total}` : null;

// Cálculo de Status de exibição
export type StatusExibicao = 'PENDENTE' | 'ATRASADA' | 'BAIXADA' | 'CANCELADA';

export function calcularStatus(ocorrencia: { 
  status: string; 
  data_vencimento: string; 
  cancelada?: boolean 
}): StatusExibicao {
  if (ocorrencia.cancelada) return 'CANCELADA';
  if (ocorrencia.status === 'BAIXADA') return 'BAIXADA';
  
  const hoje = new Date().toISOString().split('T')[0];
  if (ocorrencia.data_vencimento < hoje) return 'ATRASADA';
  
  return 'PENDENTE';
}
