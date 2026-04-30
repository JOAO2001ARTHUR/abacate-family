"use client";

import { useState, useMemo, useRef } from "react";
import { useOcorrencias, calcularStatusReal } from "@/hooks/useOcorrencias";
import { formatarMoeda } from "@/lib/utils";
import { 
  Download,
  Search,
  Filter,
  Calendar,
  MoreVertical,
  CheckCircle2,
  Clock,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Edit2,
  RotateCcw,
  Loader2,
  Copy,
  Trash2
} from "lucide-react";
import { useUIStore } from "@/stores/useUIStore";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function LancamentosPage() {
  const queryClient = useQueryClient();
  const { data: ocorrencias, isLoading } = useOcorrencias();
  const { abrirModal, mesAtivo, setMesAtivo, filtrosAtivos, setFiltros } = useUIStore();
  const [busca, setBusca] = useState("");
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());

  const [colWidths, setColWidths] = useState<Record<string, number>>({});
  const tableRef = useRef<HTMLTableElement>(null);

  const handleAutoResizeColumn = (index: number, columnKey: string) => {
    if (!tableRef.current) return;
    
    const rows = tableRef.current.querySelectorAll('tbody tr:not(.animate-pulse)');
    let maxWidth = 0;
    
    rows.forEach(row => {
      const td = row.children[index] as HTMLElement;
      // Ignorar linhas de resumo que usam colSpan
      if (!td || (td as HTMLTableCellElement).colSpan > 1) return;
      
      const clone = td.cloneNode(true) as HTMLElement;
      clone.style.display = 'inline-block';
      clone.style.width = 'fit-content';
      clone.style.position = 'absolute';
      clone.style.visibility = 'hidden';
      clone.style.whiteSpace = 'nowrap';
      // Remover padding no clone para medirmos só o conteúdo, ou manter para medir o total
      document.body.appendChild(clone);
      
      const width = clone.getBoundingClientRect().width;
      if (width > maxWidth) {
        maxWidth = width;
      }
      
      document.body.removeChild(clone);
    });
  };

  const toggleSelecao = (id: string) => {
    setSelecionados(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const toggleTodos = () => {
    if (selecionados.size === filtered.length) {
      setSelecionados(new Set());
    } else {
      setSelecionados(new Set(filtered.map(oc => oc.id)));
    }
  };

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({ 
    key: 'data_vencimento', 
    direction: 'asc' 
  });
  
  const [filtrosColunas, setFiltrosColunas] = useState<Record<string, string>>({
    vencimento: "",
    competencia: "",
    nome: "",
    parcela: "",
    categoria: "",
    contato: "",
    onde_pagar: "",
    natureza: "",
    recorrencia: "",
    valor: "",
  });

  const [resumoAtivo, setResumoAtivo] = useState<string | null>(null);

  const filtered = (ocorrencias || []).filter(oc => {
    const matchesBuscaGlobal = 
      oc.nome.toLowerCase().includes(busca.toLowerCase()) ||
      oc.categoria?.nome.toLowerCase().includes(busca.toLowerCase()) ||
      oc.contato?.nome?.toLowerCase().includes(busca.toLowerCase());

    const matchesColunas = Object.entries(filtrosColunas).every(([key, value]) => {
      if (!value) return true;
      const term = value.toLowerCase();
      
      switch (key) {
        case 'vencimento': return oc.data_vencimento.includes(term);
        case 'competencia': return oc.data_competencia.includes(term);
        case 'nome': return oc.nome.toLowerCase().includes(term);
        case 'categoria': return oc.categoria?.nome.toLowerCase().includes(term);
        case 'contato': return (oc.contato?.nome || 'Particular').toLowerCase().includes(term);
        case 'onde_pagar': return (oc.onde_pagar || '').toLowerCase().includes(term);
        case 'natureza': return oc.natureza.toLowerCase().includes(term);
        case 'valor': return (oc.valor_editado ?? oc.valor).toString().includes(term);
        case 'parcela': return `${oc.numero_parcela}/${oc.total_parcelas}`.includes(term);
        case 'recorrencia': return oc.tipo.toLowerCase().includes(term);
        default: return true;
      }
    });

    return matchesBuscaGlobal && matchesColunas;
  });

  const groupedData = useMemo(() => {
    if (!resumoAtivo) return [];
    const groups = new Map<string, { nome: string, count: number, entradas: number, saidas: number, total: number }>();

    filtered.forEach(oc => {
      let key = '';
      switch (resumoAtivo) {
        case 'vencimento': 
          key = new Date(oc.data_vencimento + "T12:00:00").toLocaleDateString('pt-BR');
          break;
        case 'nome': key = oc.nome; break;
        case 'categoria': key = oc.categoria?.nome || 'Inespecífico'; break;
        case 'contato': key = oc.contato?.nome || 'Particular'; break;
        case 'onde_pagar': key = oc.onde_pagar || 'Não informado'; break;
        case 'natureza': key = oc.natureza; break;
        case 'recorrencia': 
          key = oc.tipo === 'FIXA' ? 'Mensal' : oc.tipo === 'PARCELA' ? 'Parcelado' : 'Único'; 
          break;
        default: key = 'Outros';
      }

      if (!groups.has(key)) {
        groups.set(key, { nome: key, count: 0, entradas: 0, saidas: 0, total: 0 });
      }

      const group = groups.get(key)!;
      group.count++;
      
      const valor = oc.valor_editado ?? oc.valor;
      if (oc.natureza === 'ENTRADA') {
        group.entradas += valor;
        group.total += valor;
      } else {
        group.saidas += valor;
        group.total -= valor;
      }
    });

    return Array.from(groups.values()).sort((a, b) => Math.abs(b.total) - Math.abs(a.total));
  }, [filtered, resumoAtivo]);

  const mudarMes = (direcao: number) => {
    const dataAtual = new Date(mesAtivo + "-01T12:00:00");
    dataAtual.setMonth(dataAtual.getMonth() + direcao);
    setMesAtivo(dataAtual.toISOString().slice(0, 7));
  };

  const mesFormatado = new Date(mesAtivo + "-01T12:00:00").toLocaleDateString('pt-BR', { 
    month: 'long', 
    year: 'numeric' 
  });

  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (current.key === key) {
        if (current.direction === 'asc') return { key, direction: 'desc' };
        if (current.direction === 'desc') return { key: '', direction: null };
      }
      return { key, direction: 'asc' };
    });
  };


  const sortedData = [...filtered].sort((a, b) => {
    if (!sortConfig.key || !sortConfig.direction) return 0;
    
    let valA: any;
    let valB: any;

    switch (sortConfig.key) {
      case 'vencimento': valA = a.data_vencimento; valB = b.data_vencimento; break;
      case 'competencia': valA = a.data_competencia; valB = b.data_competencia; break;
      case 'nome': valA = a.nome; valB = b.nome; break;
      case 'categoria': valA = a.categoria?.nome || ''; valB = b.categoria?.nome || ''; break;
      case 'contato': valA = a.contato?.nome || ''; valB = b.contato?.nome || ''; break;
      case 'onde_pagar': valA = a.onde_pagar || ''; valB = b.onde_pagar || ''; break;
      case 'natureza': valA = a.natureza; valB = b.natureza; break;
      case 'valor': valA = a.valor_editado ?? a.valor; valB = b.valor_editado ?? b.valor; break;
      case 'parcela': valA = a.numero_parcela || 0; valB = b.numero_parcela || 0; break;
      case 'recorrencia': valA = a.tipo; valB = b.tipo; break;
      default: valA = ''; valB = '';
    }

    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const totais = filtered.reduce((acc, o) => {
    const valor = o.valor_editado ?? o.valor;
    if (o.natureza === 'ENTRADA') acc.entradas += valor;
    else acc.saidas += valor;
    return acc;
  }, { entradas: 0, saidas: 0 });

  const SortIcon = ({ column }: { column: string }) => {
    if (sortConfig.key !== column) return <ArrowUpDown className="w-3 h-3 opacity-20 group-hover:opacity-50" />;
    return sortConfig.direction === 'asc' ? 
      <ArrowUp className="w-3 h-3 text-primary-container" /> : 
      <ArrowDown className="w-3 h-3 text-primary-container" />;
  };

  const FilterInput = ({ column }: { column: string }) => (
    <input 
      type="text"
      placeholder="..."
      value={filtrosColunas[column] || ""}
      onChange={(e) => setFiltrosColunas(prev => ({ ...prev, [column]: e.target.value }))}
      onClick={(e) => e.stopPropagation()}
      className="mt-2 w-full px-2 py-1 bg-surface-container-highest/50 border border-outline-variant/30 rounded text-[9px] font-medium outline-none focus:border-primary-container transition-all"
    />
  );

  const ResumoButton = ({ column }: { column: string }) => {
    const isAtivo = resumoAtivo === column;
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          setResumoAtivo(prev => prev === column ? null : column);
        }}
        className={cn(
          "text-[8px] px-1.5 py-0.5 rounded uppercase font-black transition-all shrink-0",
          isAtivo 
            ? "bg-primary-container text-on-primary shadow-sm" 
            : "bg-surface-container-highest text-on-surface-variant opacity-50 group-hover:opacity-100 hover:bg-primary-container/20 hover:text-primary-container"
        )}
        title={`Resumir por ${column}`}
      >
        {isAtivo ? "Resumindo" : "Resumo"}
      </button>
    );
  };

  const getColumnStyle = (columnKey: string) => {
    const width = colWidths[columnKey];
    return width ? { width, minWidth: width, maxWidth: width } : undefined;
  };

  const ColumnResizer = ({ index, columnKey }: { index: number, columnKey: string }) => (
    <div 
      className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize z-20 hover:bg-primary-container/30 transition-colors touch-none"
      onDoubleClick={(e) => {
        e.stopPropagation();
        handleAutoResizeColumn(index, columnKey);
      }}
      onClick={(e) => e.stopPropagation()}
      title="Duplo clique para autoajustar largura"
    />
  );

  return (
    <div className="space-y-8 pb-40 animate-in fade-in duration-700">
      {/* Page Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-on-surface tracking-tighter">Registro de Transações</h1>
          <p className="text-on-surface-variant text-sm font-medium mt-1">Gerencie suas entradas e saídas financeiras.</p>
        </div>
        <button className="bg-primary-container text-on-primary px-8 py-3 rounded-md font-bold text-sm flex items-center gap-2 hover:opacity-90 transition-all shadow-sm">
          <Download className="w-4 h-4" />
          Exportar Relatório
        </button>
      </div>

      {/* Filter Card - Official Style */}
      <section className="bg-surface-container-lowest border border-outline-variant rounded-md p-6 shadow-sm grid grid-cols-12 gap-4 items-end">
        <div className="col-span-12 md:col-span-5 space-y-2">
          <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Buscar</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
            <input 
              type="text" 
              placeholder="Descrição, categoria..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-surface-container-low border border-outline-variant rounded-md focus:border-primary-container focus:ring-0 outline-none transition-all text-sm font-medium"
            />
          </div>
        </div>
        
        <div className="col-span-12 md:col-span-3 space-y-2">
          <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Mês de Referência</label>
          <div className="flex items-center justify-between px-2 py-1.5 bg-surface-container-low border border-outline-variant rounded-md">
            <button 
              onClick={() => mudarMes(-1)}
              className="p-1.5 hover:bg-surface-container-highest rounded-md transition-colors text-on-surface-variant"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 px-2">
              <Calendar className="w-4 h-4 text-primary-container" />
              <span className="text-sm font-bold text-on-surface capitalize">{mesFormatado}</span>
            </div>
            <button 
              onClick={() => mudarMes(1)}
              className="p-1.5 hover:bg-surface-container-highest rounded-md transition-colors text-on-surface-variant"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="col-span-12 md:col-span-2 space-y-2">
          <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Natureza</label>
          <select 
            value={filtrosAtivos.natureza}
            onChange={(e) => setFiltros({ natureza: e.target.value as any })}
            className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-md text-sm font-medium outline-none"
          >
            <option value="TODAS">Todas</option>
            <option value="ENTRADA">Entrada</option>
            <option value="SAIDA">Saída</option>
          </select>
        </div>

        <div className="col-span-12 md:col-span-2">
          <button className="w-full bg-primary-container text-on-primary px-4 py-3 rounded-md font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-sm">
            <Filter className="w-4 h-4" />
            Filtrar
          </button>
        </div>
      </section>

      {/* Table Actions / Feedback */}
      {Object.keys(colWidths).length > 0 && (
        <div className="flex justify-end -mb-4 relative z-10 animate-in fade-in slide-in-from-top-2 duration-300">
          <button 
            onClick={() => setColWidths({})}
            className="flex items-center gap-1.5 text-[10px] uppercase font-black tracking-widest text-on-surface-variant hover:text-primary-container transition-colors py-1.5 px-3 bg-surface-container-lowest border border-outline-variant rounded-t-md shadow-sm border-b-0 translate-y-px"
            title="Restaurar larguras de coluna padrão"
          >
            <RotateCcw className="w-3 h-3" />
            Restaurar Colunas
          </button>
        </div>
      )}

      {/* Data Table Container */}
      <section className="bg-surface-container-lowest border border-outline-variant rounded-md overflow-hidden shadow-sm relative z-20">
        <div className="overflow-x-auto">
          <table ref={tableRef} className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant text-[10px] font-black text-on-surface-variant uppercase tracking-widest text-nowrap align-bottom">
                <th className="px-4 py-4 w-10 text-center">
                  <input 
                    type="checkbox" 
                    checked={filtered.length > 0 && selecionados.size === filtered.length}
                    onChange={toggleTodos}
                    className="w-4 h-4 rounded border-outline-variant text-primary-container focus:ring-primary-container"
                  />
                </th>
                <th 
                  className="px-4 py-4 cursor-pointer group hover:bg-surface-container transition-colors relative"
                  onClick={() => handleSort('vencimento')}
                  style={getColumnStyle('vencimento')}
                >
                  <ColumnResizer index={0} columnKey="vencimento" />
                  <div className="flex flex-col gap-1.5 w-full">
                    <div className="flex items-start">
                      <ResumoButton column="vencimento" />
                    </div>
                    <div className="flex items-center justify-between gap-2 w-full overflow-hidden">
                      <span className="truncate">Vencimento</span>
                      <SortIcon column="vencimento" />
                    </div>
                  </div>
                  <FilterInput column="vencimento" />
                </th>

                <th 
                  className="px-4 py-4 cursor-pointer group hover:bg-surface-container transition-colors relative"
                  onClick={() => handleSort('nome')}
                  style={getColumnStyle('nome')}
                >
                  <ColumnResizer index={1} columnKey="nome" />
                  <div className="flex flex-col gap-1.5 w-full">
                    <div className="flex items-start">
                      <ResumoButton column="nome" />
                    </div>
                    <div className="flex items-center justify-between gap-2 w-full overflow-hidden">
                      <span className="truncate">Descrição</span>
                      <SortIcon column="nome" />
                    </div>
                  </div>
                  <FilterInput column="nome" />
                </th>
                <th 
                  className="px-4 py-4 cursor-pointer group hover:bg-surface-container transition-colors relative"
                  onClick={() => handleSort('parcela')}
                  style={getColumnStyle('parcela')}
                >
                  <ColumnResizer index={2} columnKey="parcela" />
                  <div className="flex items-center justify-between gap-2 overflow-hidden">
                    <span className="truncate">Parcela</span>
                    <SortIcon column="parcela" />
                  </div>
                  <FilterInput column="parcela" />
                </th>
                <th className="px-4 py-4 text-center relative" style={getColumnStyle('resumo_divida')}>
                  <ColumnResizer index={3} columnKey="resumo_divida" />
                  <span className="opacity-60 truncate block">Resumo da Dívida</span>
                  <div className="mt-2 h-[22px]" />
                </th>
                <th 
                  className="px-4 py-4 cursor-pointer group hover:bg-surface-container transition-colors relative"
                  onClick={() => handleSort('categoria')}
                  style={getColumnStyle('categoria')}
                >
                  <ColumnResizer index={4} columnKey="categoria" />
                  <div className="flex flex-col gap-1.5 w-full">
                    <div className="flex items-start">
                      <ResumoButton column="categoria" />
                    </div>
                    <div className="flex items-center justify-between gap-2 w-full overflow-hidden">
                      <span className="truncate">Categoria</span>
                      <SortIcon column="categoria" />
                    </div>
                  </div>
                  <FilterInput column="categoria" />
                </th>
                <th 
                  className="px-4 py-4 cursor-pointer group hover:bg-surface-container transition-colors relative"
                  onClick={() => handleSort('contato')}
                  style={getColumnStyle('contato')}
                >
                  <ColumnResizer index={5} columnKey="contato" />
                  <div className="flex flex-col gap-1.5 w-full">
                    <div className="flex items-start">
                      <ResumoButton column="contato" />
                    </div>
                    <div className="flex items-center justify-between gap-2 w-full overflow-hidden">
                      <span className="truncate">Contato</span>
                      <SortIcon column="contato" />
                    </div>
                  </div>
                  <FilterInput column="contato" />
                </th>
                <th 
                  className="px-4 py-4 cursor-pointer group hover:bg-surface-container transition-colors relative"
                  onClick={() => handleSort('onde_pagar')}
                  style={getColumnStyle('onde_pagar')}
                >
                  <ColumnResizer index={6} columnKey="onde_pagar" />
                  <div className="flex flex-col gap-1.5 w-full">
                    <div className="flex items-start">
                      <ResumoButton column="onde_pagar" />
                    </div>
                    <div className="flex items-center justify-between gap-2 w-full overflow-hidden">
                      <span className="truncate">Onde Pagar</span>
                      <SortIcon column="onde_pagar" />
                    </div>
                  </div>
                  <FilterInput column="onde_pagar" />
                </th>
                <th 
                  className="px-4 py-4 cursor-pointer group hover:bg-surface-container transition-colors relative"
                  onClick={() => handleSort('natureza')}
                  style={getColumnStyle('natureza')}
                >
                  <ColumnResizer index={7} columnKey="natureza" />
                  <div className="flex flex-col gap-1.5 w-full">
                    <div className="flex items-start">
                      <ResumoButton column="natureza" />
                    </div>
                    <div className="flex items-center justify-between gap-2 w-full overflow-hidden">
                      <span className="truncate">Natureza</span>
                      <SortIcon column="natureza" />
                    </div>
                  </div>
                  <FilterInput column="natureza" />
                </th>
                <th 
                  className="px-4 py-4 cursor-pointer group hover:bg-surface-container transition-colors relative"
                  onClick={() => handleSort('recorrencia')}
                  style={getColumnStyle('recorrencia')}
                >
                  <ColumnResizer index={8} columnKey="recorrencia" />
                  <div className="flex flex-col gap-1.5 w-full">
                    <div className="flex items-start">
                      <ResumoButton column="recorrencia" />
                    </div>
                    <div className="flex items-center justify-between gap-2 w-full overflow-hidden">
                      <span className="truncate">Recorrência</span>
                      <SortIcon column="recorrencia" />
                    </div>
                  </div>
                  <FilterInput column="recorrencia" />
                </th>
                <th 
                  className="px-6 py-4 cursor-pointer group hover:bg-surface-container transition-colors text-right relative"
                  onClick={() => handleSort('valor')}
                  style={getColumnStyle('valor')}
                >
                  <ColumnResizer index={9} columnKey="valor" />
                  <div className="flex items-center justify-end gap-2 overflow-hidden">
                    <span className="truncate">Valor</span>
                    <SortIcon column="valor" />
                  </div>
                  <FilterInput column="valor" />
                </th>
                <th className="px-4 py-4 text-center">Status</th>
                <th className="px-4 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {isLoading ? (
                <tr>
                  <td colSpan={12} className="py-20 text-center animate-pulse font-bold text-on-surface-variant uppercase tracking-widest text-xs">Sincronizando Dados...</td>
                </tr>
              ) : resumoAtivo ? (
                groupedData.map((group) => (
                  <tr key={group.nome} className="hover:bg-surface-container-low transition-colors group">
                    <td colSpan={12} className="px-6 py-6 border-b border-outline-variant/50">
                      <div className="flex justify-between items-center w-full">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center border border-outline-variant shadow-sm">
                            <span className="font-black text-on-surface text-lg">{group.count}</span>
                          </div>
                          <div>
                            <p className="font-black text-on-surface text-lg tracking-tight">{group.nome}</p>
                            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{group.count} transação(ões)</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-12 text-right">
                          {group.entradas > 0 && (
                            <div>
                              <p className="text-[10px] uppercase font-black text-on-surface-variant tracking-widest mb-1">Entradas</p>
                              <p className="font-bold text-primary-container text-base">+{formatarMoeda(group.entradas)}</p>
                            </div>
                          )}
                          {group.saidas > 0 && (
                            <div>
                              <p className="text-[10px] uppercase font-black text-on-surface-variant tracking-widest mb-1">Saídas</p>
                              <p className="font-bold text-error text-base">-{formatarMoeda(group.saidas)}</p>
                            </div>
                          )}
                          <div className="border-l border-outline-variant pl-12 min-w-[180px]">
                            <p className="text-[10px] uppercase font-black text-on-surface-variant tracking-widest mb-1">Saldo do Grupo</p>
                            <p className={cn("font-black text-2xl tracking-tighter", group.total >= 0 ? "text-primary-container" : "text-error")}>
                              {group.total >= 0 ? '+' : ''}{formatarMoeda(group.total)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : sortedData.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-20 text-center text-on-surface-variant font-medium opacity-40">Nenhuma transação encontrada.</td>
                </tr>
              ) : (
                sortedData.map((oc) => (
                  <tr 
                    key={oc.id} 
                    className={cn(
                      "hover:bg-surface-container-low transition-colors group text-nowrap",
                      selecionados.has(oc.id) && "bg-primary-container/5 hover:bg-primary-container/10"
                    )}
                  >
                    <td className="px-4 py-5 text-center">
                      <input 
                        type="checkbox" 
                        checked={selecionados.has(oc.id)}
                        onChange={() => toggleSelecao(oc.id)}
                        className="w-4 h-4 rounded border-outline-variant text-primary-container focus:ring-primary-container"
                      />
                    </td>
                    <td className="px-4 py-5 text-sm font-medium text-on-surface tnum">
                      {new Date(oc.data_vencimento + "T12:00:00").toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    </td>
                    <td className="px-4 py-5">
                      <div className="flex items-center gap-2">
                        <div className="font-bold text-on-surface text-sm">{oc.nome}</div>
                        {(() => {
                          const vDate = new Date(oc.data_vencimento + "T12:00:00");
                          const cDate = new Date(oc.data_competencia + "T12:00:00");
                          if (vDate.getMonth() !== cDate.getMonth() || vDate.getFullYear() !== cDate.getFullYear()) {
                            return (
                              <div 
                                className="w-2 h-2 rounded-full bg-error cursor-help shrink-0"
                                title={`Competência: ${cDate.toLocaleDateString('pt-BR', { month: 'long' })}`}
                              />
                            );
                          }
                          return null;
                        })()}
                      </div>
                      <div className="text-[9px] text-on-surface-variant font-medium opacity-60 uppercase tracking-tighter mt-0.5">Ref: {oc.id.substring(0,8)}</div>
                    </td>
                    <td className="px-4 py-5 text-center text-[10px] font-black text-on-surface-variant">
                      {oc.total_parcelas ? `${oc.numero_parcela}/${oc.total_parcelas}` : '—'}
                    </td>
                    <td className="px-4 py-5">
                      {oc.tipo === 'PARCELA' && oc.financeiro_stats ? (
                        <div className="flex flex-col gap-0.5 min-w-[120px]">
                          <p className="text-[10px] font-black text-on-surface tracking-tight tnum">
                            Total: {formatarMoeda(oc.financeiro_stats.total)}
                          </p>
                          <p className="text-[9px] font-bold text-primary-container/80 tnum">
                            Pago: {formatarMoeda(oc.financeiro_stats.pago)}
                          </p>
                          <p className="text-[9px] font-bold text-error/80 tnum">
                            Falta: {formatarMoeda(oc.financeiro_stats.restante)}
                          </p>
                        </div>
                      ) : (
                        <span className="text-[10px] font-medium text-on-surface-variant opacity-20">—</span>
                      )}
                    </td>
                    <td className="px-4 py-5">
                      <span className="text-sm font-medium text-on-surface-variant">{oc.categoria?.nome || 'Inespecífico'}</span>
                    </td>
                    <td className="px-4 py-5">
                      <span className="text-sm font-medium text-on-surface-variant italic">{oc.contato?.nome || 'Particular'}</span>
                    </td>
                    <td className="px-4 py-5">
                      <span className="text-sm font-medium text-on-surface-variant">{oc.onde_pagar || '—'}</span>
                    </td>
                    <td className="px-4 py-5">
                      <span className={cn(
                        "inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                        oc.natureza === 'ENTRADA' ? "bg-primary-fixed/40 text-primary-container" : "bg-error-container/40 text-error"
                      )}>
                        {oc.natureza}
                      </span>
                    </td>
                    <td className="px-4 py-5">
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-sm border",
                        oc.tipo === 'FIXA' ? "border-primary-container/30 text-primary-container bg-primary-container/5" :
                        oc.tipo === 'PARCELA' ? "border-amber-500/30 text-amber-600 bg-amber-500/5" :
                        "border-outline-variant text-on-surface-variant opacity-60"
                      )}>
                        {oc.tipo === 'FIXA' ? 'Mensal' : oc.tipo === 'PARCELA' ? 'Parcelado' : 'Único'}
                      </span>
                    </td>
                    <td className="px-4 py-5 text-right font-black tnum text-base">
                      <span className={oc.natureza === 'ENTRADA' ? "text-primary-container" : "text-error"}>
                        {oc.natureza === 'ENTRADA' ? '+' : '-'} {formatarMoeda(oc.valor_editado ?? oc.valor)}
                      </span>
                    </td>
                    <td className="px-4 py-5 text-center">
                      <div className="flex justify-center">
                        <button
                          onClick={() => abrirModal(calcularStatusReal(oc) === 'BAIXADA' ? 'DESBAIXAR' : 'BAIXAR', oc.id)}
                          className={cn(
                            "p-2 rounded-full transition-all hover:scale-110",
                            calcularStatusReal(oc) === 'BAIXADA' 
                              ? "text-primary-container bg-primary-container/10 hover:bg-primary-container/20" 
                              : "text-outline hover:text-primary-container hover:bg-primary-container/10"
                          )}
                          title={calcularStatusReal(oc) === 'BAIXADA' ? "Reverter Baixa" : "Baixar Transação"}
                        >
                          {calcularStatusReal(oc) === 'BAIXADA' ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <Clock className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-100 transition-opacity">
                        <button 
                          onClick={() => abrirModal('EDITAR_LANCAMENTO', `${oc.regra_id}:${oc.id}`)}
                          className="p-2 text-outline hover:text-primary transition-colors hover:bg-primary/5 rounded-md"
                          title="Editar Lançamento"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => abrirModal('DUPLICAR_LANCAMENTO', oc.regra_id)}
                          className="p-2 text-outline hover:text-primary transition-colors hover:bg-primary/5 rounded-md"
                          title="Duplicar Lançamento"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => abrirModal('EXCLUIR_LANCAMENTO', `${oc.regra_id}:${oc.id}`)}
                          className="p-2 text-outline hover:text-error transition-colors hover:bg-error/5 rounded-md"
                          title="Excluir Lançamento"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="p-6 border-t border-outline-variant flex justify-between items-center bg-surface-container-low/30">
          <span className="text-xs font-bold text-on-surface-variant">Mostrando 1-{filtered.length} de {filtered.length} transações</span>
          <div className="flex gap-2">
            <button className="px-4 py-2 border border-outline-variant rounded-md text-xs font-bold text-on-surface-variant hover:bg-surface-container transition-all disabled:opacity-30" disabled>Anterior</button>
            <button className="px-4 py-2 border border-outline-variant rounded-md text-xs font-bold text-on-surface-variant hover:bg-surface-container transition-all disabled:opacity-30" disabled>Próxima</button>
          </div>
        </div>
      </section>

      {/* Dynamic Selection Summary Bar */}
      {selecionados.size > 0 && (
        <div className="fixed bottom-44 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-8 duration-500">
          <div className="bg-on-surface text-surface-container-lowest px-8 py-4 rounded-2xl shadow-2xl border border-outline/20 flex items-center gap-8 backdrop-blur-md bg-opacity-95">
            <div className="flex items-center gap-3 pr-8 border-r border-outline-variant/30">
              <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-black">
                {selecionados.size}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Selecionados</p>
                <button 
                  onClick={() => setSelecionados(new Set())}
                  className="text-xs font-bold text-primary-container hover:underline"
                >
                  Limpar Seleção
                </button>
              </div>
            </div>

            {(() => {
              const selecionadosData = filtered.filter(oc => selecionados.has(oc.id));
              const calc = selecionadosData.reduce((acc, oc) => {
                const val = oc.valor_editado ?? oc.valor;
                if (oc.natureza === 'ENTRADA') acc.entradas += val;
                else acc.saidas += val;
                
                // Impacto mensal (valor base da regra)
                acc.impacto += Number(oc.valor_base || 0);
                
                // Total em aberto (stats de parcela)
                if (oc.financeiro_stats) {
                   acc.pendente += oc.financeiro_stats.restante;
                } else if (oc.status === 'PENDENTE') {
                   acc.pendente += val;
                }

                return acc;
              }, { entradas: 0, saidas: 0, impacto: 0, pendente: 0 });

              return (
                <div className="flex items-center gap-10">
                  <div className="text-center">
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Impacto Mensal</p>
                    <p className="font-black text-lg text-primary-container tnum">{formatarMoeda(calc.impacto)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Total Pendente</p>
                    <p className="font-black text-lg text-error tnum">{formatarMoeda(calc.pendente)}</p>
                  </div>
                  <div className="w-px h-8 bg-outline-variant/30" />
                  <div className="text-right">
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Saldo Selecionado</p>
                    <p className={cn("font-black text-2xl tracking-tighter tnum", (calc.entradas - calc.saidas) >= 0 ? "text-primary-container" : "text-error")}>
                      {calc.entradas - calc.saidas >= 0 ? '+' : ''}{formatarMoeda(calc.entradas - calc.saidas)}
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Official Sticky Footer */}
      <footer className="fixed bottom-0 right-0 left-64 bg-surface-container-low/90 backdrop-blur-xl border-t border-outline-variant p-10 z-30 shadow-[0_-10px_30px_-5px_rgba(0,0,0,0.03)]">
        <div className="max-w-[1800px] mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex items-center gap-16">
            <div className="text-center">
              <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-2">Total Entradas (Período)</p>
              <p className="font-black text-xl text-primary-container tnum">+{formatarMoeda(totais.entradas)}</p>
            </div>
            <div className="w-px h-12 bg-outline-variant" />
            <div className="text-center">
              <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-2">Total Saídas (Período)</p>
              <p className="font-black text-xl text-error tnum">-{formatarMoeda(totais.saidas)}</p>
            </div>
          </div>
          <div className="text-right border-l border-outline-variant pl-16">
            <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-2">SALDO DO PERÍODO</p>
            <div className="flex items-center gap-5">
              <span className="text-4xl font-black text-primary-container tracking-tighter tnum">
                {formatarMoeda(totais.entradas - totais.saidas)}
              </span>
              <TrendingUp className={cn("w-8 h-8", (totais.entradas - totais.saidas) >= 0 ? "text-primary-container" : "text-error rotate-180")} />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
