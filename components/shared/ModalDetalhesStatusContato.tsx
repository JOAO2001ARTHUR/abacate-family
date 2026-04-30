
"use client";

import { useState, useMemo } from "react";
import { useUIStore } from "@/stores/useUIStore";
import { useVariavelResumo, DimensaoType } from "@/hooks/useVariaveis";
import { formatarMoeda, cn } from "@/lib/utils";
import { 
  X, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Receipt, 
  History, 
  Info, 
  Search,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Calculator,
  RotateCcw
} from "lucide-react";

export function ModalDetalhesStatusContato({ id, dimensao }: { id: string | null, dimensao: DimensaoType }) {
  const { modalAberto, fecharModal } = useUIStore();
  const { data: resumo } = useVariavelResumo(dimensao, id);

  const isPagos = modalAberto === 'DETALHES_PAGOS_CONTATO';
  const isPendentes = modalAberto === 'DETALHES_PENDENTES_CONTATO';
  
  const [busca, setBusca] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ 
    key: 'total', 
    direction: 'desc' 
  });
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());

  // Agrupar por lançamento para ter a visão consolidada da "Dívida"
  const dividasMap = useMemo(() => {
    const map = new Map();
    if (!resumo) return map;

    resumo.historico.forEach(oc => {
      const lid = oc.lancamento.id;
      if (!map.has(lid)) {
        map.set(lid, {
          lancamento: oc.lancamento,
          ocorrencias: [],
          total: 0,
          pago: 0,
          pendente: 0,
          qtd_paga: 0,
          qtd_pendente: 0
        });
      }
      const d = map.get(lid);
      d.ocorrencias.push(oc);
      const val = Number(oc.valor_editado ?? oc.valor);
      d.total += val;
      if (oc.status === 'BAIXADA') {
        d.pago += val;
        d.qtd_paga++;
      } else if (oc.status === 'PENDENTE' && !oc.cancelada) {
        d.pendente += val;
        d.qtd_pendente++;
      }
    });
    return map;
  }, [resumo]);

  // Processar dívidas com filtro e ordenação
  const dividas = useMemo(() => {
    let result = Array.from(dividasMap.values())
      .filter(d => {
        const matchesSearch = d.lancamento.nome.toLowerCase().includes(busca.toLowerCase());
        if (!matchesSearch) return false;
        
        if (isPagos) return d.qtd_paga > 0;
        if (isPendentes) return d.qtd_pendente > 0;
        return true;
      });

    if (sortConfig.key) {
      result.sort((a, b) => {
        let valA: any, valB: any;
        
        switch (sortConfig.key) {
          case 'nome': valA = a.lancamento.nome; valB = b.lancamento.nome; break;
          case 'tipo': valA = a.lancamento.tipo; valB = b.lancamento.tipo; break;
          case 'valor_base': valA = a.lancamento.valor_base; valB = b.lancamento.valor_base; break;
          case 'progresso': valA = a.qtd_paga / a.ocorrencias.length; valB = b.qtd_paga / b.ocorrencias.length; break;
          case 'pago': valA = a.pago; valB = b.pago; break;
          case 'pendente': valA = a.pendente; valB = b.pendente; break;
          case 'total': valA = a.total; valB = b.total; break;
          default: valA = 0; valB = 0;
        }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [dividasMap, busca, isPagos, isPendentes, sortConfig]);

  // Cálculo da seleção dinâmica
  const calculosSelecao = useMemo(() => {
    const selecionadosList = dividas.filter(d => selecionados.has(d.lancamento.id));
    return {
      total: selecionadosList.reduce((acc, d) => acc + (isPagos ? d.pago : d.pendente), 0),
      impacto: selecionadosList.reduce((acc, d) => acc + Number(d.lancamento.valor_base), 0)
    };
  }, [dividas, selecionados, isPagos]);

  if ((!isPagos && !isPendentes) || !resumo) return null;

  const totalConsolidado = dividas.reduce((acc, d) => acc + (isPagos ? d.pago : d.pendente), 0);
  const totalImpactoMensal = dividas.reduce((acc, d) => acc + Number(d.lancamento.valor_base), 0);

  const toggleTodos = () => {
    if (selecionados.size === dividas.length) {
      setSelecionados(new Set());
    } else {
      setSelecionados(new Set(dividas.map(d => d.lancamento.id)));
    }
  };

  const toggleUm = (id: string) => {
    const novo = new Set(selecionados);
    if (novo.has(id)) novo.delete(id);
    else novo.add(id);
    setSelecionados(novo);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={fecharModal} />
      
      <div className="relative bg-surface-container-lowest border border-outline-variant rounded-md shadow-2xl w-full max-w-[1400px] max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Header */}
        <div className={cn(
          "p-8 border-b border-outline-variant flex justify-between items-center bg-surface-container-low/30",
          isPendentes && "border-l-[6px] border-l-error"
        )}>
          <div>
            <h2 className="text-2xl font-black text-on-surface tracking-tighter uppercase">
              {isPagos ? "Resumo de Pagamentos Realizados" : "Resumo de Compromissos Pendentes"}
            </h2>
            <p className="text-on-surface-variant font-bold text-sm flex items-center gap-2 mt-1">
              {isPagos ? <History className="w-4 h-4 text-primary-container" /> : <Clock className="w-4 h-4 text-error" />}
              Situação detalhada de {dividas.length} dívidas/contratos
            </p>
          </div>
          <button 
            onClick={fecharModal}
            className="p-2 hover:bg-surface-container rounded-md transition-colors text-outline hover:text-on-surface"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 bg-surface-container-low/20 border-b border-outline-variant flex items-center gap-4">
          <div className="relative flex-1 max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline w-4 h-4 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Buscar lançamento..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant rounded-md py-2.5 pl-11 pr-4 text-sm font-medium focus:border-primary outline-none transition-all"
            />
          </div>
          <div className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-40">
            {dividas.length} resultados encontrados
          </div>
        </div>

        {/* Content - Table Style */}
        <div className="flex-1 overflow-auto p-0">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead className="sticky top-0 bg-surface-container-low z-10 border-b border-outline-variant">
              <tr className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">
                <th className="px-6 py-4 w-12">
                  <input 
                    type="checkbox" 
                    checked={selecionados.size === dividas.length && dividas.length > 0}
                    onChange={toggleTodos}
                    className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary bg-surface-container-low cursor-pointer"
                  />
                </th>
                <SortableHeader label="Dívida / Lançamento" sortKey="nome" currentSort={sortConfig} onSort={setSortConfig} />
                <SortableHeader label="Tipo / Recorrência" sortKey="tipo" currentSort={sortConfig} onSort={setSortConfig} />
                <SortableHeader label="Valor da parcela (mês)" sortKey="valor_base" currentSort={sortConfig} onSort={setSortConfig} />
                <SortableHeader label="Progresso (Parcelas)" sortKey="progresso" currentSort={sortConfig} onSort={setSortConfig} className="text-center" />
                <SortableHeader label="Já Pago" sortKey="pago" currentSort={sortConfig} onSort={setSortConfig} className="text-right" />
                <SortableHeader label="Pendente" sortKey="pendente" currentSort={sortConfig} onSort={setSortConfig} className="text-right" />
                <SortableHeader label="Valor Total" sortKey="total" currentSort={sortConfig} onSort={setSortConfig} className="text-right" />
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {dividas.map((d) => (
                <tr 
                  key={d.lancamento.id} 
                  className={cn(
                    "hover:bg-surface-container-low transition-colors group cursor-pointer",
                    selecionados.has(d.lancamento.id) && "bg-primary-container/5"
                  )}
                  onClick={() => toggleUm(d.lancamento.id)}
                >
                  <td className="px-6 py-6" onClick={(e) => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      checked={selecionados.has(d.lancamento.id)}
                      onChange={() => toggleUm(d.lancamento.id)}
                      className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary bg-surface-container-low cursor-pointer"
                    />
                  </td>
                  <td className="px-8 py-6">
                    <div className="font-black text-on-surface text-base uppercase tracking-tight">{d.lancamento.nome}</div>
                    <div className="text-[10px] text-on-surface-variant font-bold opacity-50 uppercase tracking-widest mt-1">
                      Ref: {d.lancamento.id.substring(0,8)} • {d.lancamento.natureza}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-sm border",
                      d.lancamento.tipo === 'FIXA' ? "border-primary-container/30 text-primary-container bg-primary-container/5" :
                      d.lancamento.tipo === 'PARCELA' ? "border-amber-500/30 text-amber-600 bg-amber-500/5" :
                      "border-outline-variant text-on-surface-variant opacity-60"
                    )}>
                      {d.lancamento.tipo === 'FIXA' ? 'Mensal' : d.lancamento.tipo === 'PARCELA' ? 'Parcelado' : 'Único'}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-black text-on-surface tnum">{formatarMoeda(d.lancamento.valor_base)}</p>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="text-[11px] font-black text-on-surface-variant tnum">
                        {d.qtd_paga} / {d.ocorrencias.length} pagas
                      </div>
                      <div className="w-24 bg-surface-container-highest h-1 rounded-full overflow-hidden">
                        <div 
                          className="bg-primary-container h-full transition-all duration-500" 
                          style={{ width: `${(d.qtd_paga / d.ocorrencias.length) * 100}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <p className="text-sm font-bold text-primary-container tnum">{formatarMoeda(d.pago)}</p>
                    <p className="text-[9px] font-black text-on-surface-variant opacity-40 uppercase">{d.qtd_paga} lançamentos</p>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <p className="text-sm font-bold text-error tnum">{formatarMoeda(d.pendente)}</p>
                    <p className="text-[9px] font-black text-on-surface-variant opacity-40 uppercase">{d.qtd_pendente} lançamentos</p>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <p className="text-lg font-black text-on-surface tnum">{formatarMoeda(d.total)}</p>
                  </td>
                </tr>
              ))}

              {dividas.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <div className="space-y-4 opacity-40">
                      <Receipt className="w-16 h-16 mx-auto stroke-1" />
                      <p className="font-bold text-lg uppercase tracking-tight">Nenhuma dívida encontrada nesta categoria</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Refatorado */}
        <div className="p-8 border-t border-outline-variant bg-surface-container-low/50 flex justify-between items-center shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center border border-outline-variant">
                <Info className="w-5 h-5 text-on-surface-variant opacity-60" />
              </div>
              <div>
                <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-60">Base de Dados</p>
                <p className="text-sm font-bold text-on-surface uppercase tracking-tight">Análise Consolidada</p>
              </div>
            </div>

            <div className="h-10 w-px bg-outline-variant/30 hidden lg:block" />

            <div className="hidden lg:block">
              <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-0.5">Impacto Mensal Consolidado</p>
              <p className="text-2xl font-black text-on-surface tnum tracking-tight">{formatarMoeda(totalImpactoMensal)}</p>
            </div>

            {selecionados.size > 0 && (
              <>
                <div className="h-10 w-px bg-outline-variant/30 hidden xl:block" />
                <div className="bg-primary-container/10 border border-primary-container/20 rounded-md px-6 py-2 flex items-center gap-8 animate-in slide-in-from-left duration-300">
                  <div className="flex flex-col">
                    <p className="text-[9px] font-black text-primary-container uppercase tracking-widest mb-0.5 flex items-center gap-1">
                      <Calculator className="w-3 h-3" /> Seleção ({selecionados.size})
                    </p>
                    <div className="flex items-baseline gap-6">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-bold text-primary-container/60 uppercase tracking-tighter">Total Selecionado</span>
                        <p className="text-xl font-black text-primary-container tnum">{formatarMoeda(calculosSelecao.total)}</p>
                      </div>
                      <div className="w-px h-6 bg-primary-container/20 self-center" />
                      <div className="flex flex-col">
                        <span className="text-[8px] font-bold text-primary-container/60 uppercase tracking-tighter">Impacto Mensal</span>
                        <p className="text-xl font-black text-primary-container tnum">{formatarMoeda(calculosSelecao.impacto)}</p>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelecionados(new Set())}
                    className="p-2 hover:bg-primary-container/20 rounded-md transition-colors text-primary-container"
                    title="Limpar seleção"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="text-right">
            <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-1">
              {isPagos ? "Soma de Pagamentos Efetuados" : "Soma de Compromissos em Aberto"}
            </p>
            <p className={cn(
              "text-4xl font-black tnum tracking-tighter",
              isPagos ? "text-primary-container" : "text-error"
            )}>{formatarMoeda(totalConsolidado)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SortableHeader({ label, sortKey, currentSort, onSort, className }: { 
  label: string, 
  sortKey: string, 
  currentSort: { key: string, direction: 'asc' | 'desc' }, 
  onSort: (config: { key: string, direction: 'asc' | 'desc' }) => void,
  className?: string
}) {
  const isActive = currentSort.key === sortKey;
  
  const handleClick = () => {
    if (isActive) {
      onSort({ key: sortKey, direction: currentSort.direction === 'asc' ? 'desc' : 'asc' });
    } else {
      onSort({ key: sortKey, direction: 'desc' });
    }
  };

  return (
    <th 
      className={cn("px-8 py-4 cursor-pointer hover:bg-surface-container transition-colors group", className)}
      onClick={handleClick}
    >
      <div className={cn("flex items-center gap-2", className?.includes('text-right') ? 'justify-end' : className?.includes('text-center') ? 'justify-center' : 'justify-start')}>
        {label}
        {isActive ? (
          currentSort.direction === 'asc' ? <ChevronUp className="w-3 h-3 text-primary" /> : <ChevronDown className="w-3 h-3 text-primary" />
        ) : (
          <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-40 transition-opacity" />
        )}
      </div>
    </th>
  );
}
