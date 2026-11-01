"use client";

import { useOcorrencias, useContasAtrasadas, calcularStatusReal } from "@/hooks/useOcorrencias";
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
import { useUIStore } from "@/stores/useUIStore";
import { cn } from "@/lib/utils";
import { useFluxoCaixa } from "@/hooks/useFluxoCaixa";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const renderLabelEntradas = (props: any) => {
  const { x, y, value } = props;
  if (!value && value !== 0) return null;
  return (
    <text x={x} y={y - 12} fill="var(--color-primary-container)" fontSize={10} fontWeight="900" textAnchor="middle" className="tnum">
      {formatarMoeda(value)}
    </text>
  );
};

const renderLabelSaidas = (props: any) => {
  const { x, y, value } = props;
  if (!value && value !== 0) return null;
  return (
    <text x={x} y={y + 20} fill="var(--color-error)" fontSize={10} fontWeight="900" textAnchor="middle" className="tnum">
      {formatarMoeda(value)}
    </text>
  );
};

export default function DashboardPage() {
  const { contextoAtivo, abrirModal } = useUIStore();
  const { data: ocorrencias, isLoading } = useOcorrencias();
  const { data: contasAtrasadas } = useContasAtrasadas();
  const { data: fluxoData, isLoading: isLoadingFluxo } = useFluxoCaixa();

  // Filtrar em atraso (Urgency Zone) - Apenas Saídas
  const emAtraso = contasAtrasadas || [];
  const totalEmAtraso = emAtraso.reduce((acc, oc) => acc + (oc.valor_editado ?? oc.valor), 0);
  
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

  // Breakdown PF vs PJ para quando a visualização for Consolidada (TODOS)
  const breakdown = ocorrencias?.reduce((acc, o) => {
    const valor = o.valor_editado ?? o.valor;
    const isEmpresa = o.contexto === 'EMPRESA';
    if (o.natureza === 'ENTRADA') {
      if (isEmpresa) acc.empresaEntradas += valor;
      else acc.pessoalEntradas += valor;
    } else {
      if (isEmpresa) acc.empresaSaidas += valor;
      else acc.pessoalSaidas += valor;
    }
    return acc;
  }, { pessoalEntradas: 0, pessoalSaidas: 0, empresaEntradas: 0, empresaSaidas: 0 }) || {
    pessoalEntradas: 0, pessoalSaidas: 0, empresaEntradas: 0, empresaSaidas: 0
  };

  // Identificar transferências de Pró-labore para neutralizar dupla contagem
  const isProlabore = (o: any) => {
    const nomeLower = (o.nome || '').toLowerCase();
    const catLower = (o.categoria?.nome || '').toLowerCase();
    const descLower = (o.descricao || '').toLowerCase();
    return nomeLower.includes('pró-labore') || nomeLower.includes('pro-labore') || nomeLower.includes('prolabore') ||
           catLower.includes('pró-labore') || catLower.includes('pro-labore') || catLower.includes('prolabore') ||
           descLower.includes('prolabore_link');
  };

  let prolaboreTransferido = 0;
  ocorrencias?.forEach(o => {
    if (isProlabore(o) && o.contexto === 'PESSOAL' && o.natureza === 'ENTRADA') {
      prolaboreTransferido += (o.valor_editado ?? o.valor);
    }
  });

  const entradasExibidas = contextoAtivo === 'TODOS' ? Math.max(0, totais.entradas - prolaboreTransferido) : totais.entradas;
  const saidasExibidas = contextoAtivo === 'TODOS' ? Math.max(0, totais.saidas - prolaboreTransferido) : totais.saidas;

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pt-2">

      {/* ZONA 1: Urgency Zone - Apenas se houver dados reais */}
      {emAtraso.length > 0 && (
        <section className="bg-error-container border-l-[6px] border-error rounded-md p-4 md:p-8 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-error pulse-ring-error"></div>
              <h2 className="text-lg font-bold text-on-error-container flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                {emAtraso.length} {emAtraso.length === 1 ? 'conta em atraso' : 'contas em atraso'}
              </h2>
            </div>
            <div className="bg-surface-container-lowest/50 px-6 py-3 rounded-md border border-error/20 flex items-center gap-3 self-start md:self-auto">
              <span className="text-[10px] font-black text-on-error-container uppercase tracking-widest opacity-60">Impacto Total:</span>
              <span className="text-2xl font-black text-error tnum">{formatarMoeda(totalEmAtraso)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 max-h-[320px] overflow-y-auto pr-2">
            {emAtraso.map((oc) => (
              <div key={oc.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-surface-container-lowest p-4 md:p-5 rounded-md shadow-sm border border-error/10 gap-4">
                <div className="flex items-center gap-3 md:gap-5 w-full sm:w-auto">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-md bg-error-container/40 flex items-center justify-center text-error shrink-0">
                    <span className="material-symbols-outlined text-xl md:text-2xl">{oc.categoria?.icone || 'priority_high'}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-on-surface text-sm md:text-base truncate">{oc.nome}</div>
                    <div className="text-[10px] md:text-xs text-error font-medium">Venceu há {Math.floor((new Date().getTime() - new Date(oc.data_vencimento).getTime()) / (1000 * 3600 * 24))} dias</div>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-4 md:gap-8 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-error/5">
                  <span className="font-black text-on-surface tnum text-base md:text-lg">{formatarMoeda(oc.valor_editado ?? oc.valor)}</span>
                  <button 
                    onClick={() => abrirModal('BAIXAR', oc.id)}
                    className="bg-error text-on-error px-4 md:px-6 py-2 rounded-md font-bold text-xs md:text-sm hover:opacity-90 transition-opacity shrink-0 cursor-pointer"
                  >
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-on-surface">Situação Atual</h2>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-surface-container-high text-primary border border-outline-variant/60">
              {contextoAtivo === 'TODOS' && <><span>🥑</span> Consolidado (PF + PJ)</>}
              {contextoAtivo === 'PESSOAL' && <><span>👤</span> Apenas Vida Pessoal (PF)</>}
              {contextoAtivo === 'EMPRESA' && <><span>🏢</span> Apenas Empresa (PJ)</>}
            </span>
          </div>

          {contextoAtivo === 'TODOS' && (
            <div className="flex items-center gap-4 text-xs font-bold text-on-surface-variant bg-surface-container-low px-3 py-1.5 rounded-md border border-outline-variant/40">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-outline" />
                PF: <strong className="text-on-surface tnum">{formatarMoeda(breakdown.pessoalEntradas - breakdown.pessoalSaidas)}</strong>
              </span>
              <span className="h-3 w-px bg-outline-variant" />
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary-container" />
                PJ: <strong className="text-primary-container tnum">{formatarMoeda(breakdown.empresaEntradas - breakdown.empresaSaidas)}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Banner de Pró-labore Neutralizado no Consolidado */}
        {prolaboreTransferido > 0 && contextoAtivo === 'TODOS' && (
          <div className="bg-primary-fixed/20 border border-primary/20 rounded-md px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold text-on-surface animate-in fade-in duration-300">
            <div className="flex items-center gap-2">
              <span className="text-base">🔄</span>
              <span>Pró-labore / Retirada detectada: <strong className="text-primary-container tnum">{formatarMoeda(prolaboreTransferido)}</strong></span>
            </div>
            <span className="text-[10px] uppercase font-black tracking-widest text-primary-container opacity-90 bg-surface-container-lowest px-2 py-1 rounded border border-primary/20">
              Neutralizado no Consolidado (Sem Contagem Dupla)
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-stack-lg">
          {/* Card Saldo */}
          <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-md shadow-sm hover:border-primary transition-all relative overflow-hidden group">
            <div className="flex items-center justify-between mb-6">
              <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">
                {contextoAtivo === 'EMPRESA' ? 'Caixa da Empresa (PJ)' : contextoAtivo === 'PESSOAL' ? 'Sobra Pessoal (PF)' : 'Saldo Consolidado'}
              </span>
              <span className="material-symbols-outlined text-primary-container text-2xl group-hover:scale-110 transition-transform">account_balance_wallet</span>
            </div>
            <div className="text-2xl md:text-4xl font-black text-on-surface mb-3 tracking-tighter tnum">
              {formatarMoeda(saldo)}
            </div>
            {contextoAtivo === 'TODOS' ? (
              <div className="flex items-center justify-between text-[11px] font-bold text-on-surface-variant pt-1 border-t border-outline-variant/40">
                <span>PF: {formatarMoeda(breakdown.pessoalEntradas - breakdown.pessoalSaidas)}</span>
                <span>PJ: {formatarMoeda(breakdown.empresaEntradas - breakdown.empresaSaidas)}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-[11px] font-bold text-primary-container">
                <TrendingUp className="w-4 h-4" />
                <span>{contextoAtivo === 'PESSOAL' ? 'Disponibilidade Familiar' : 'Lucro Retido na Operação'}</span>
              </div>
            )}
          </div>

          {/* Card Entradas */}
          <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-md shadow-sm hover:border-primary transition-all relative overflow-hidden group">
            <div className="flex items-center justify-between mb-6">
              <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">
                {contextoAtivo === 'EMPRESA' ? 'Faturamento da Empresa' : contextoAtivo === 'PESSOAL' ? 'Entradas Pessoais' : 'Faturamento Real do Grupo'}
              </span>
              <span className="material-symbols-outlined text-primary-container text-2xl group-hover:scale-110 transition-transform">arrow_downward</span>
            </div>
            <div className="text-2xl md:text-4xl font-black text-on-surface mb-3 tracking-tighter tnum">
              {formatarMoeda(entradasExibidas)}
            </div>
            {contextoAtivo === 'TODOS' ? (
              <div className="flex items-center justify-between text-[11px] font-bold text-on-surface-variant pt-1 border-t border-outline-variant/40">
                <span>PF: {formatarMoeda(breakdown.pessoalEntradas)}</span>
                <span>PJ: {formatarMoeda(breakdown.empresaEntradas)}</span>
              </div>
            ) : (
              <div className="text-xs font-bold text-on-surface-variant">
                {contextoAtivo === 'PESSOAL' ? 'Renda & Pró-labore recebido' : 'Receita bruta de vendas e clientes'}
              </div>
            )}
          </div>

          {/* Card Saídas */}
          <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-md shadow-sm hover:border-error transition-all relative overflow-hidden group">
            <div className="flex items-center justify-between mb-6">
              <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">
                {contextoAtivo === 'EMPRESA' ? 'Custos & Pró-labore PJ' : contextoAtivo === 'PESSOAL' ? 'Gastos Pessoais & Casa' : 'Despesas Globais'}
              </span>
              <span className="material-symbols-outlined text-error text-2xl group-hover:scale-110 transition-transform">arrow_upward</span>
            </div>
            <div className="text-2xl md:text-4xl font-black text-on-surface mb-3 tracking-tighter tnum">
              {formatarMoeda(saidasExibidas)}
            </div>
            {contextoAtivo === 'TODOS' ? (
              <div className="flex items-center justify-between text-[11px] font-bold text-on-surface-variant pt-1 border-t border-outline-variant/40">
                <span>PF: {formatarMoeda(breakdown.pessoalSaidas)}</span>
                <span>PJ: {formatarMoeda(breakdown.empresaSaidas)}</span>
              </div>
            ) : (
              <div className="text-xs font-bold text-on-surface-variant">
                {contextoAtivo === 'PESSOAL' ? 'Comprometimento familiar' : 'Despesas operacionais e retiradas'}
              </div>
            )}
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-stack-lg">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-md p-8 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between mb-10 border-b border-outline-variant pb-6">
              <h3 className="font-bold text-on-surface">Fluxo de Caixa (Projeção 7 Meses)</h3>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary-container" />
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Entradas</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-error" />
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Saídas</span>
                </div>
                <button className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2 hover:underline ml-4">
                  Ver Relatório <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
            <div className="h-48 md:h-64 w-full">
              {isLoadingFluxo ? (
                <div className="w-full h-full flex items-center justify-center animate-pulse">
                  <div className="text-[10px] font-black text-outline uppercase tracking-widest">Calculando Fluxo...</div>
                </div>
              ) : fluxoData && fluxoData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={fluxoData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-outline-variant)" opacity={0.2} />
                    <XAxis 
                      dataKey="label" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 10, fontWeight: 800 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 10, fontWeight: 500 }}
                    />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-surface-container-highest border border-outline-variant p-4 rounded-lg shadow-2xl backdrop-blur-md">
                              <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-3 border-b border-outline-variant pb-2">{label}</p>
                              <div className="space-y-2">
                                <div className="flex justify-between gap-8 items-center">
                                  <span className="text-[10px] font-bold text-primary-container uppercase tracking-tight">Entradas</span>
                                  <span className="text-sm font-black text-on-surface tnum">{formatarMoeda(payload[0].value as number)}</span>
                                </div>
                                <div className="flex justify-between gap-8 items-center">
                                  <span className="text-[10px] font-bold text-error uppercase tracking-tight">Saídas</span>
                                  <span className="text-sm font-black text-on-surface tnum">{formatarMoeda(payload[1].value as number)}</span>
                                </div>
                                <div className="flex justify-between gap-8 items-center pt-2 border-t border-outline-variant">
                                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tight">Saldo</span>
                                  <span className={cn(
                                    "text-sm font-black tnum",
                                    ((payload[0].value as number) - (payload[1].value as number)) >= 0 ? "text-primary-container" : "text-error"
                                  )}>
                                    {formatarMoeda((payload[0].value as number) - (payload[1].value as number))}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="entradas" 
                      stroke="var(--color-primary-container)" 
                      strokeWidth={4} 
                      dot={{ r: 4, fill: 'var(--color-primary-container)', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                      animationDuration={1500}
                      connectNulls={true}
                      label={renderLabelEntradas}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="saidas" 
                      stroke="var(--color-error)" 
                      strokeWidth={4} 
                      dot={{ r: 4, fill: 'var(--color-error)', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                      animationDuration={1500}
                      connectNulls={true}
                      label={renderLabelSaidas}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-on-surface-variant font-medium opacity-40">
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
          {/* Desktop Table View */}
          <div className="hidden md:block">
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

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-outline-variant">
            {proximos.length === 0 ? (
              <div className="p-12 text-center text-on-surface-variant font-medium opacity-40 italic text-sm">
                Nenhum vencimento programado.
              </div>
            ) : (
              proximos.map((item) => (
                <div key={item.id} className="p-5 flex flex-col gap-3 active:bg-surface-container-low transition-colors">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-on-surface text-sm">{item.nome}</span>
                    <span className="font-black text-on-surface tnum text-base">{formatarMoeda(item.valor_editado ?? item.valor)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="bg-primary-fixed/50 text-on-primary-fixed-variant px-2 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-tighter border border-primary-fixed">
                      {item.categoria?.nome || 'Geral'}
                    </span>
                    <span className="text-[10px] font-bold text-on-surface-variant">
                      Vence em {new Date(item.data_vencimento).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
