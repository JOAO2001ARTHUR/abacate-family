"use client";

import { useOcorrencias, calcularStatusReal } from "@/hooks/useOcorrencias";
import { formatarMoeda } from "@/lib/utils";
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  AlertCircle,
  ArrowRight,
  LayoutGrid,
  ChevronRight,
  ExternalLink,
  ArrowDown,
  ArrowUp
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { data: ocorrencias, isLoading } = useOcorrencias();

  // Filtrar em atraso (Urgency Zone)
  const emAtraso = ocorrencias?.filter(oc => calcularStatusReal(oc) === 'ATRASADA') || [];
  
  // Próximos 7 dias (Horizon Zone)
  const hoje = new Date();
  const emSeteDias = new Date();
  emSeteDias.setDate(hoje.getDate() + 7);
  
  const proximos = ocorrencias?.filter(oc => {
    const dataVenc = new Date(oc.data_vencimento);
    return dataVenc >= hoje && dataVenc <= emSeteDias && oc.status !== 'BAIXADA';
  }).slice(0, 4) || [];

  // Cálculos de Totais
  const totais = ocorrencias?.reduce((acc, o) => {
    const valor = o.valor_editado ?? o.valor;
    if (o.natureza === 'ENTRADA') acc.entradas += valor;
    else acc.saidas += valor;
    return acc;
  }, { entradas: 0, saidas: 0 }) || { entradas: 0, saidas: 0 };

  const saldo = totais.entradas - totais.saidas;

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Page Header */}
      <div>
        <h1 className="text-4xl font-black text-on-surface tracking-tighter">Dashboard</h1>
        <p className="text-on-surface-variant text-sm font-medium mt-1">Visão geral financeira e ações pendentes.</p>
      </div>

      {/* ZONA 1: Urgency Zone - Apenas se houver dados reais */}
      {emAtraso.length > 0 && (
        <section className="bg-error-container border-l-[6px] border-error rounded-md p-8 flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-error pulse-ring-error"></div>
            <h2 className="text-lg font-bold text-on-error-container flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {emAtraso.length} {emAtraso.length === 1 ? 'conta em atraso' : 'contas em atraso'}
            </h2>
          </div>

          <div className="flex flex-col gap-3">
            {emAtraso.slice(0, 3).map((oc) => (
              <div key={oc.id} className="flex items-center justify-between bg-surface-container-lowest p-5 rounded-md shadow-sm border border-error/10">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-md bg-error-container/40 flex items-center justify-center text-error">
                    <span className="material-symbols-outlined text-2xl">{oc.categoria?.icone || 'priority_high'}</span>
                  </div>
                  <div>
                    <div className="font-bold text-on-surface text-base">{oc.nome}</div>
                    <div className="text-xs text-error font-medium">Venceu há {Math.floor((new Date().getTime() - new Date(oc.data_vencimento).getTime()) / (1000 * 3600 * 24))} dias</div>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <span className="font-black text-on-surface tnum text-lg">{formatarMoeda(oc.valor_editado ?? oc.valor)}</span>
                  <button className="bg-error text-on-error px-6 py-2 rounded-md font-bold text-sm hover:opacity-90 transition-opacity">
                    Baixar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ZONA 2: Situação Atual */}
      <section className="space-y-6">
        <h2 className="text-lg font-bold text-on-surface">Situação Atual</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-stack-lg">
          {/* Card Saldo */}
          <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-md shadow-sm hover:border-primary transition-all relative overflow-hidden group">
            <div className="flex items-center justify-between mb-6">
              <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Saldo do Mês</span>
              <span className="material-symbols-outlined text-primary-container text-2xl group-hover:scale-110 transition-transform">account_balance_wallet</span>
            </div>
            <div className="text-4xl font-black text-on-surface mb-3 tracking-tighter tnum">
              {formatarMoeda(saldo)}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-primary-container">
              <TrendingUp className="w-4 h-4" />
              <span>Conexão em tempo real</span>
            </div>
          </div>

          {/* Card Entradas */}
          <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-md shadow-sm hover:border-primary transition-all relative overflow-hidden group">
            <div className="flex items-center justify-between mb-6">
              <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Entradas</span>
              <span className="material-symbols-outlined text-primary-container text-2xl group-hover:scale-110 transition-transform">arrow_downward</span>
            </div>
            <div className="text-4xl font-black text-on-surface mb-3 tracking-tighter tnum">
              {formatarMoeda(totais.entradas)}
            </div>
            <div className="text-xs font-bold text-on-surface-variant">
              Total recebido no período
            </div>
          </div>

          {/* Card Saídas */}
          <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-md shadow-sm hover:border-error transition-all relative overflow-hidden group">
            <div className="flex items-center justify-between mb-6">
              <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Saídas</span>
              <span className="material-symbols-outlined text-error text-2xl group-hover:scale-110 transition-transform">arrow_upward</span>
            </div>
            <div className="text-4xl font-black text-on-surface mb-3 tracking-tighter tnum">
              {formatarMoeda(totais.saidas)}
            </div>
            <div className="text-xs font-bold text-on-surface-variant">
              Comprometimento mensal
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-stack-lg">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-md p-8 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between mb-10 border-b border-outline-variant pb-6">
              <h3 className="font-bold text-on-surface">Fluxo de Caixa (Últimos 6 meses)</h3>
              <button className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2 hover:underline">
                Ver Relatório <ExternalLink className="w-3 h-3" />
              </button>
            </div>
            <div className="h-64 flex items-end justify-between px-8 gap-8">
              {ocorrencias && ocorrencias.length > 0 ? (
                // Lógica de agrupamento por mês viria aqui, por enquanto placeholder de zeros
                [0, 0, 0, 0, 0, 0].map((val, i) => (
                  <div key={i} className="flex flex-col items-center gap-4 flex-1 h-full">
                    <div className="w-full flex gap-1 items-end justify-center h-full">
                      <div className="w-4 bg-primary-container/20 rounded-sm" style={{ height: `10%` }} />
                      <div className="w-4 bg-error/20 rounded-sm" style={{ height: `10%` }} />
                    </div>
                    <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-tighter">...</span>
                  </div>
                ))
              ) : (
                <div className="w-full flex items-center justify-center text-on-surface-variant font-medium opacity-40">
                  Aguardando movimentações para gerar gráfico
                </div>
              )}
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant rounded-md p-8 shadow-sm flex flex-col items-center justify-center">
            {ocorrencias && ocorrencias.length > 0 ? (
              <>
                <div className="w-full flex items-center justify-between mb-8 border-b border-outline-variant pb-6">
                  <h3 className="font-bold text-on-surface">Top Categorias</h3>
                </div>
                <div className="relative w-48 h-48 flex items-center justify-center">
                  <div className="absolute inset-0 border-[16px] border-surface-container-low rounded-lg rotate-45"></div>
                  <div className="text-center z-10">
                    <div className="text-3xl font-black text-on-surface">0%</div>
                    <div className="text-[10px] font-bold text-on-surface-variant uppercase">Dados Reais</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center space-y-4">
                <LayoutGrid className="w-12 h-12 text-outline mx-auto opacity-20" />
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest opacity-40">Sem dados de categoria</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ZONA 3: Horizonte */}
      <section className="space-y-6 pb-20">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-on-surface">Próximos Vencimentos (7 dias)</h2>
          <button className="text-[10px] font-black text-primary-container uppercase tracking-widest hover:underline">Ver Todos</button>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-md overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant text-[10px] font-black text-on-surface-variant uppercase tracking-widest">
                <th className="px-8 py-4">Descrição</th>
                <th className="px-8 py-4">Categoria</th>
                <th className="px-8 py-4">Data</th>
                <th className="px-8 py-4 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {proximos.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-on-surface-variant font-medium opacity-40 italic">
                    Nenhum vencimento programado para os próximos 7 dias.
                  </td>
                </tr>
              ) : (
                proximos.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-container-low transition-colors group">
                    <td className="px-8 py-4 font-bold text-on-surface text-sm">{item.nome}</td>
                    <td className="px-8 py-4">
                      <span className="bg-primary-fixed/50 text-on-primary-fixed-variant px-3 py-1 rounded-sm text-[10px] font-bold border border-primary-fixed">
                        {item.categoria?.nome || 'Geral'}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-xs font-bold text-on-surface-variant">{new Date(item.data_vencimento).toLocaleDateString()}</td>
                    <td className="px-8 py-4 text-right font-black text-on-surface tnum">{formatarMoeda(item.valor_editado ?? item.valor)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
