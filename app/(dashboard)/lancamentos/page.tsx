"use client";

import { useState, useMemo, useRef } from "react";
import { useOcorrencias, calcularStatusReal } from "@/hooks/useOcorrencias";
import { formatarMoeda } from "@/lib/utils";
import { 
  Download,
  Search,
  Filter,
  Calendar,
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
  Trash2,
  AlertCircle,
  Plus,
  SlidersHorizontal,
  ArrowUpRight,
  ArrowDownLeft,
  Tag
} from "lucide-react";
import { useUIStore } from "@/stores/useUIStore";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

export default function LancamentosPage() {
  const queryClient = useQueryClient();
  const { abrirModal, mesAtivo, setMesAtivo, contextoAtivo } = useUIStore();
  const { data: ocorrencias, isLoading } = useOcorrencias({
    mes: mesAtivo,
    contexto: contextoAtivo
  });
  
  const [abaNatureza, setAbaNatureza] = useState<'TODAS' | 'SAIDA' | 'ENTRADA'>('TODAS');
  const [busca, setBusca] = useState("");
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [mostrarFiltrosColunas, setMostrarFiltrosColunas] = useState(false);
  const [filtroStatusRapido, setFiltroStatusRapido] = useState<'TODOS' | 'ATRASADO' | 'PENDENTE' | 'BAIXADA'>('TODOS');

  const [colWidths, setColWidths] = useState<Record<string, number>>({});
  const tableRef = useRef<HTMLTableElement>(null);

  const handleAutoResizeColumn = (index: number, columnKey: string) => {
    if (!tableRef.current) return;
    
    const rows = tableRef.current.querySelectorAll('tbody tr:not(.animate-pulse)');
    let maxWidth = 0;
    
    rows.forEach(row => {
      const td = row.children[index] as HTMLElement;
      if (!td || (td as HTMLTableCellElement).colSpan > 1) return;
      
      const clone = td.cloneNode(true) as HTMLElement;
      clone.style.display = 'inline-block';
      clone.style.width = 'fit-content';
      clone.style.position = 'absolute';
      clone.style.visibility = 'hidden';
      clone.style.whiteSpace = 'nowrap';
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
    status: "",
  });

  const [resumoAtivo, setResumoAtivo] = useState<string | null>(null);

  const getStatusVisual = (oc: any) => {
    const statusReal = calcularStatusReal(oc);
    if (statusReal === 'BAIXADA') return 'BAIXADA';
    const hoje = new Date().toISOString().split('T')[0];
    if (hoje > oc.data_vencimento) return 'ATRASADO';
    return 'PENDENTE';
  };

  // Deduplicação resiliente client-side (garante integridade em caso de cache antigo)
  const ocorrenciasUnicas = useMemo(() => {
    const chavesVistas = new Set<string>();
    return (ocorrencias || []).filter(oc => {
      const mesRef = (oc.data_competencia || oc.data_vencimento || "").slice(0, 7);
      const nomeClean = (oc.nome || "").trim().toLowerCase();
      const regraId = oc.lancamento_id || oc.regra_id || oc.id;
      const chaveRegra = oc.tipo === 'PARCELA' 
        ? `${regraId}_p_${oc.numero_parcela}` 
        : `${regraId}_m_${mesRef}`;
      const chaveAttr = `attr_${nomeClean}_${oc.valor}_${oc.data_vencimento}_${oc.natureza}_${oc.contexto}`;

      if (chavesVistas.has(chaveRegra) || chavesVistas.has(chaveAttr)) {
        return false;
      }
      chavesVistas.add(chaveRegra);
      chavesVistas.add(chaveAttr);
      return true;
    });
  }, [ocorrencias]);

  const filtered = ocorrenciasUnicas.filter(oc => {
    // Filtro por natureza (Todas / Saídas / Entradas)
    if (abaNatureza !== 'TODAS' && oc.natureza !== abaNatureza) {
      return false;
    }

    const statusVisual = getStatusVisual(oc);

    // Filtro rápido de status
    if (filtroStatusRapido !== 'TODOS' && statusVisual !== filtroStatusRapido) {
      return false;
    }

    const matchesBuscaGlobal = 
      oc.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (oc.categoria?.nome || '').toLowerCase().includes(busca.toLowerCase()) ||
      (oc.contato?.nome || '').toLowerCase().includes(busca.toLowerCase()) ||
      (oc.onde_pagar || '').toLowerCase().includes(busca.toLowerCase());

    const matchesColunas = Object.entries(filtrosColunas).every(([key, value]) => {
      if (!value) return true;
      const term = value.toLowerCase();
      
      switch (key) {
        case 'vencimento': return oc.data_vencimento.includes(term);
        case 'competencia': return oc.data_competencia.includes(term);
        case 'nome': return oc.nome.toLowerCase().includes(term);
        case 'categoria': return (oc.categoria?.nome || '').toLowerCase().includes(term);
        case 'contato': return (oc.contato?.nome || 'Particular').toLowerCase().includes(term);
        case 'onde_pagar': return (oc.onde_pagar || '').toLowerCase().includes(term);
        case 'natureza': return oc.natureza.toLowerCase().includes(term);
        case 'valor': return (oc.valor_editado ?? oc.valor).toString().includes(term);
        case 'parcela': return `${oc.numero_parcela}/${oc.total_parcelas}`.includes(term);
        case 'recorrencia': return oc.tipo.toLowerCase().includes(term);
        case 'status': return statusVisual.toLowerCase().includes(term);
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
        case 'contexto': 
          key = oc.contexto === 'EMPRESA' ? '🏢 Empresa (PJ)' : '👤 Pessoal (PF)'; 
          break;
        case 'recorrencia': 
          key = oc.tipo === 'FIXA' ? 'Mensal' : oc.tipo === 'PARCELA' ? 'Parcelado' : 'Único'; 
          break;
        case 'status': key = getStatusVisual(oc); break;
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
      case 'status': valA = getStatusVisual(a); valB = getStatusVisual(b); break;
      default: valA = ''; valB = '';
    }

    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Métricas do Mês (Previsibilidade de Caixa)
  const totais = ocorrenciasUnicas.reduce((acc, o) => {
    const valor = o.valor_editado ?? o.valor;
    const status = getStatusVisual(o);

    if (o.natureza === 'ENTRADA') {
      acc.entradasTotal += valor;
      if (status === 'BAIXADA') acc.entradasRecebidas += valor;
      else acc.entradasPendentes += valor;
    } else {
      acc.saidasTotal += valor;
      if (status === 'BAIXADA') acc.saidasPagas += valor;
      else acc.saidasPendentes += valor;
    }
    return acc;
  }, { 
    entradasTotal: 0, entradasRecebidas: 0, entradasPendentes: 0,
    saidasTotal: 0, saidasPagas: 0, saidasPendentes: 0 
  });

  const saldoProjetado = totais.entradasTotal - totais.saidasTotal;
  const saldoRealizado = totais.entradasRecebidas - totais.saidasPagas;

  const SortIcon = ({ column }: { column: string }) => {
    if (sortConfig.key !== column) return <ArrowUpDown className="w-3 h-3 opacity-20 group-hover:opacity-50" />;
    return sortConfig.direction === 'asc' ? 
      <ArrowUp className="w-3 h-3 text-primary-container" /> : 
      <ArrowDown className="w-3 h-3 text-primary-container" />;
  };

  const FilterInput = ({ column }: { column: string }) => {
    if (!mostrarFiltrosColunas) return null;
    return (
      <input 
        type="text"
        placeholder="..."
        value={filtrosColunas[column] || ""}
        onChange={(e) => setFiltrosColunas(prev => ({ ...prev, [column]: e.target.value }))}
        onClick={(e) => e.stopPropagation()}
        className="mt-2 w-full px-2 py-1 bg-surface-container-highest/60 border border-outline-variant/40 rounded text-[9px] font-medium outline-none focus:border-primary-container transition-all"
      />
    );
  };

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
            : "bg-surface-container-highest text-on-surface-variant opacity-40 group-hover:opacity-100 hover:bg-primary-container/20 hover:text-primary-container"
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
    <div className="space-y-6 pb-44 animate-in fade-in duration-500">

      {/* 1. Header de Previsibilidade Financeira do Mês */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card Entradas */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-md p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary-container" />
              Previsão de Entradas
            </span>
            <span className="text-xs font-bold text-primary-container">
              {totais.entradasRecebidas > 0 ? `${Math.round((totais.entradasRecebidas / (totais.entradasTotal || 1)) * 100)}% recebido` : '0%'}
            </span>
          </div>
          <div className="text-2xl font-black text-on-surface tnum tracking-tight mb-2">
            +{formatarMoeda(totais.entradasTotal)}
          </div>
          <div className="flex items-center justify-between text-[11px] font-bold text-on-surface-variant pt-2 border-t border-outline-variant/30">
            <span className="text-primary-container">Já Recebido: {formatarMoeda(totais.entradasRecebidas)}</span>
            <span className="opacity-70">A Receber: {formatarMoeda(totais.entradasPendentes)}</span>
          </div>
        </div>

        {/* Card Saídas */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-md p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-error" />
              Compromissos a Pagar
            </span>
            <span className="text-xs font-bold text-error">
              {totais.saidasPagas > 0 ? `${Math.round((totais.saidasPagas / (totais.saidasTotal || 1)) * 100)}% pago` : '0%'}
            </span>
          </div>
          <div className="text-2xl font-black text-on-surface tnum tracking-tight mb-2">
            -{formatarMoeda(totais.saidasTotal)}
          </div>
          <div className="flex items-center justify-between text-[11px] font-bold text-on-surface-variant pt-2 border-t border-outline-variant/30">
            <span className="text-on-surface">Já Liquidado: {formatarMoeda(totais.saidasPagas)}</span>
            <span className="text-error">Falta Pagar: {formatarMoeda(totais.saidasPendentes)}</span>
          </div>
        </div>

        {/* Card Saldo Projetado */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-md p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
              Saldo Projetado (Fechamento)
            </span>
            <TrendingUp className={cn("w-4 h-4", saldoProjetado >= 0 ? "text-primary-container" : "text-error rotate-180")} />
          </div>
          <div className={cn(
            "text-2xl font-black tnum tracking-tight mb-2",
            saldoProjetado >= 0 ? "text-primary-container" : "text-error"
          )}>
            {saldoProjetado >= 0 ? '+' : ''}{formatarMoeda(saldoProjetado)}
          </div>
          <div className="flex items-center justify-between text-[11px] font-bold text-on-surface-variant pt-2 border-t border-outline-variant/30">
            <span>Saldo Realizado Hoje:</span>
            <strong className={cn("tnum", saldoRealizado >= 0 ? "text-primary-container" : "text-error")}>
              {formatarMoeda(saldoRealizado)}
            </strong>
          </div>
        </div>
      </section>

      {/* 2. Barra de Controle Rápido (Abas de Natureza + Seletor de Mês + Busca Inteligente) */}
      <section className="bg-surface-container-lowest border border-outline-variant rounded-md p-4 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Abas Rápidas de Natureza */}
          <div className="flex bg-surface-container-low p-1 rounded-md border border-outline-variant/40 shrink-0">
            <button
              onClick={() => setAbaNatureza('TODAS')}
              className={cn(
                "px-3.5 py-1.5 text-xs font-black uppercase tracking-wider rounded-sm transition-all flex items-center gap-2",
                abaNatureza === 'TODAS' 
                  ? "bg-surface-container-lowest text-on-surface shadow-xs border border-outline-variant/60" 
                  : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              <span>🥑</span> Todas as Movimentações
            </button>
            <button
              onClick={() => setAbaNatureza('SAIDA')}
              className={cn(
                "px-3.5 py-1.5 text-xs font-black uppercase tracking-wider rounded-sm transition-all flex items-center gap-2",
                abaNatureza === 'SAIDA' 
                  ? "bg-error text-on-error shadow-xs" 
                  : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              <span>📉</span> Contas a Pagar (Saídas)
            </button>
            <button
              onClick={() => setAbaNatureza('ENTRADA')}
              className={cn(
                "px-3.5 py-1.5 text-xs font-black uppercase tracking-wider rounded-sm transition-all flex items-center gap-2",
                abaNatureza === 'ENTRADA' 
                  ? "bg-primary-container text-on-primary shadow-xs" 
                  : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              <span>📈</span> Recebimentos (Entradas)
            </button>
          </div>

          {/* Navegador de Mês */}
          <div className="flex items-center justify-between sm:justify-start gap-2 bg-surface-container-low px-2 py-1 rounded-md border border-outline-variant/40">
            <button 
              onClick={() => mudarMes(-1)}
              className="p-1 hover:bg-surface-container-highest rounded text-on-surface-variant transition-colors"
              title="Mês Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 px-3">
              <Calendar className="w-4 h-4 text-primary-container" />
              <span className="text-xs font-black uppercase tracking-wider text-on-surface capitalize">{mesFormatado}</span>
            </div>
            <button 
              onClick={() => mudarMes(1)}
              className="p-1 hover:bg-surface-container-highest rounded text-on-surface-variant transition-colors"
              title="Próximo Mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Botão Novo Lançamento */}
          <button 
            onClick={() => abrirModal('CRIAR_LANCAMENTO')}
            className="bg-primary-container text-on-primary px-5 py-2.5 rounded-md font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-sm shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Novo Lançamento
          </button>
        </div>

        {/* Linha 2: Busca Unificada + Chips de Filtro Rápido */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2 border-t border-outline-variant/30">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
            <input 
              type="text" 
              placeholder="Buscar descrição, categoria, contato ou banco..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant/60 rounded-md focus:border-primary-container outline-none transition-all text-xs font-medium"
            />
          </div>

          {/* Chips de Status Rápido */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 hidden sm:inline">Status:</span>
            {[
              { id: 'TODOS', label: 'Todos' },
              { id: 'PENDENTE', label: '⏳ Pendentes' },
              { id: 'ATRASADO', label: '🚨 Atrasadas' },
              { id: 'BAIXADA', label: '✅ Liquidadas' },
            ].map(chip => (
              <button
                key={chip.id}
                onClick={() => setFiltroStatusRapido(chip.id as any)}
                className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap",
                  filtroStatusRapido === chip.id
                    ? "bg-on-surface text-surface-container-lowest shadow-xs"
                    : "bg-surface-container-low text-on-surface-variant hover:text-on-surface border border-outline-variant/40"
                )}
              >
                {chip.label}
              </button>
            ))}

            <div className="h-4 w-px bg-outline-variant/40 mx-1 hidden sm:block" />

            {/* Toggle de Filtros Avançados por Coluna */}
            <button
              onClick={() => setMostrarFiltrosColunas(prev => !prev)}
              className={cn(
                "p-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors border shrink-0",
                mostrarFiltrosColunas 
                  ? "bg-primary-container text-on-primary border-primary-container"
                  : "bg-surface-container-low text-on-surface-variant border-outline-variant/40 hover:text-on-surface"
              )}
              title="Alternar filtros individuais de coluna"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase font-black tracking-wider hidden md:inline">Colunas</span>
            </button>
          </div>
        </div>
      </section>

      {/* 3. Ações de Tabela & Agrupamento por Esfera */}
      <div className="flex items-center justify-between -mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setResumoAtivo(prev => prev === 'contexto' ? null : 'contexto')}
            className={cn(
              "flex items-center gap-1.5 text-[10px] uppercase font-black tracking-widest transition-all py-1.5 px-3 rounded-t-md border border-b-0 translate-y-px shadow-xs",
              resumoAtivo === 'contexto'
                ? "bg-primary-container text-on-primary border-primary-container"
                : "bg-surface-container-lowest text-on-surface-variant hover:text-on-surface border-outline-variant"
            )}
            title="Agrupar totais por Esfera (Pessoal vs Empresa)"
          >
            <span>🏢 / 👤</span>
            <span>{resumoAtivo === 'contexto' ? "Remover Agrupamento" : "Agrupar por Esfera"}</span>
          </button>
        </div>

        {Object.keys(colWidths).length > 0 && (
          <button 
            onClick={() => setColWidths({})}
            className="flex items-center gap-1.5 text-[10px] uppercase font-black tracking-widest text-on-surface-variant hover:text-primary-container transition-colors py-1.5 px-3 bg-surface-container-lowest border border-outline-variant rounded-t-md shadow-xs border-b-0 translate-y-px"
            title="Restaurar larguras padrão"
          >
            <RotateCcw className="w-3 h-3" />
            Restaurar Colunas
          </button>
        )}
      </div>

      {/* 4. Tabela de Lançamentos Desktop (hidden on mobile) */}
      <section className="hidden md:block bg-surface-container-lowest border border-outline-variant rounded-md overflow-hidden shadow-xs relative z-20">
        <div className="overflow-x-auto">
          <table ref={tableRef} className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant text-[10px] font-black text-on-surface-variant uppercase tracking-widest text-nowrap align-bottom">
                <th className="px-4 py-4 w-10 text-center">
                  <input 
                    type="checkbox" 
                    checked={filtered.length > 0 && selecionados.size === filtered.length}
                    onChange={toggleTodos}
                    className="w-4 h-4 rounded border-outline-variant text-primary-container focus:ring-primary-container cursor-pointer"
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

                <th 
                  className="px-4 py-4 cursor-pointer group hover:bg-surface-container transition-colors relative"
                  onClick={() => handleSort('categoria')}
                  style={getColumnStyle('categoria')}
                >
                  <ColumnResizer index={3} columnKey="categoria" />
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
                  <ColumnResizer index={4} columnKey="contato" />
                  <div className="flex flex-col gap-1.5 w-full">
                    <div className="flex items-start">
                      <ResumoButton column="contato" />
                    </div>
                    <div className="flex items-center justify-between gap-2 w-full overflow-hidden">
                      <span className="truncate">Contato / Favorecido</span>
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
                  <ColumnResizer index={5} columnKey="onde_pagar" />
                  <div className="flex flex-col gap-1.5 w-full">
                    <div className="flex items-start">
                      <ResumoButton column="onde_pagar" />
                    </div>
                    <div className="flex items-center justify-between gap-2 w-full overflow-hidden">
                      <span className="truncate">Conta / Local</span>
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
                  <ColumnResizer index={6} columnKey="natureza" />
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
                  <ColumnResizer index={7} columnKey="recorrencia" />
                  <div className="flex flex-col gap-1.5 w-full">
                    <div className="flex items-start">
                      <ResumoButton column="recorrencia" />
                    </div>
                    <div className="flex items-center justify-between gap-2 w-full overflow-hidden">
                      <span className="truncate">Tipo</span>
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
                  <ColumnResizer index={8} columnKey="valor" />
                  <div className="flex items-center justify-end gap-2 overflow-hidden">
                    <span className="truncate">Valor</span>
                    <SortIcon column="valor" />
                  </div>
                  <FilterInput column="valor" />
                </th>

                <th 
                  className="px-4 py-4 cursor-pointer group hover:bg-surface-container transition-colors relative text-center"
                  onClick={() => handleSort('status')}
                  style={getColumnStyle('status')}
                >
                  <ColumnResizer index={9} columnKey="status" />
                  <div className="flex flex-col gap-1.5 w-full items-center">
                    <div className="flex items-start">
                      <ResumoButton column="status" />
                    </div>
                    <div className="flex items-center justify-between gap-2 w-full overflow-hidden">
                      <span className="truncate">Status</span>
                      <SortIcon column="status" />
                    </div>
                  </div>
                  <FilterInput column="status" />
                </th>
                <th className="px-4 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {isLoading ? (
                <tr>
                  <td colSpan={12} className="py-20 text-center animate-pulse font-bold text-on-surface-variant uppercase tracking-widest text-xs">
                    Sincronizando Dados Financeiros...
                  </td>
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
                  <td colSpan={12} className="py-24 text-center">
                    <div className="max-w-sm mx-auto space-y-4">
                      <div className="w-16 h-16 rounded-2xl bg-surface-container-high mx-auto flex items-center justify-center text-outline">
                        <Calendar className="w-8 h-8 opacity-40" />
                      </div>
                      <div>
                        <p className="text-base font-black text-on-surface">Nenhuma movimentação encontrada</p>
                        <p className="text-xs font-medium text-on-surface-variant opacity-70 mt-1">
                          Não há registros para os filtros selecionados neste mês.
                        </p>
                      </div>
                      <button
                        onClick={() => abrirModal('CRIAR_LANCAMENTO')}
                        className="bg-primary-container text-on-primary px-4 py-2 rounded-md font-bold text-xs uppercase tracking-wider inline-flex items-center gap-2 hover:opacity-90 transition-opacity"
                      >
                        <Plus className="w-4 h-4" /> Cadastrar Lançamento
                      </button>
                    </div>
                  </td>
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
                    <td className="px-4 py-4 text-center">
                      <input 
                        type="checkbox" 
                        checked={selecionados.has(oc.id)}
                        onChange={() => toggleSelecao(oc.id)}
                        className="w-4 h-4 rounded border-outline-variant text-primary-container focus:ring-primary-container cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-on-surface tnum">
                      {new Date(oc.data_vencimento + "T12:00:00").toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="font-bold text-on-surface text-sm">{oc.nome}</div>
                        {oc.contexto === 'EMPRESA' ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-primary-fixed/60 text-primary-container border border-primary-container/20 shrink-0" title="Esfera: Empresa (PJ)">
                            🏢 PJ
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-surface-container-high text-on-surface-variant border border-outline-variant/40 shrink-0" title="Esfera: Pessoal (PF)">
                            👤 PF
                          </span>
                        )}
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
                    <td className="px-4 py-4 text-center text-[10px] font-black text-on-surface-variant">
                      {oc.total_parcelas ? `${oc.numero_parcela}/${oc.total_parcelas}` : '—'}
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-sm bg-surface-container-low text-on-surface-variant border border-outline-variant/30">
                        {oc.categoria?.nome || 'Geral'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-medium text-on-surface-variant italic">{oc.contato?.nome || 'Particular'}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-medium text-on-surface-variant">{oc.onde_pagar || '—'}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest",
                        oc.natureza === 'ENTRADA' ? "bg-primary-fixed/50 text-primary-container" : "bg-error-container/40 text-error"
                      )}>
                        {oc.natureza}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm border",
                        oc.tipo === 'FIXA' ? "border-primary-container/30 text-primary-container bg-primary-container/5" :
                        oc.tipo === 'PARCELA' ? "border-amber-500/30 text-amber-600 bg-amber-500/5" :
                        "border-outline-variant text-on-surface-variant opacity-60"
                      )}>
                        {oc.tipo === 'FIXA' ? 'Mensal' : oc.tipo === 'PARCELA' ? 'Parcelado' : 'Único'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right font-black tnum text-base">
                      <span className={oc.natureza === 'ENTRADA' ? "text-primary-container" : "text-error"}>
                        {oc.natureza === 'ENTRADA' ? '+' : '-'} {formatarMoeda(oc.valor_editado ?? oc.valor)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex justify-center">
                        {(() => {
                          const statusVisual = getStatusVisual(oc);
                          const isBaixada = statusVisual === 'BAIXADA';
                          const isVencido = statusVisual === 'ATRASADO';
                          
                          return (
                            <button
                              onClick={() => abrirModal(isBaixada ? 'DESBAIXAR' : 'BAIXAR', oc.id)}
                              className={cn(
                                "p-2 rounded-full transition-all hover:scale-110 cursor-pointer",
                                isBaixada 
                                  ? "text-primary-container bg-primary-container/10 hover:bg-primary-container/20" 
                                  : isVencido
                                    ? "text-error bg-error/10 hover:bg-error/20"
                                    : "text-amber-500 bg-amber-500/10 hover:bg-amber-500/20"
                              )}
                              title={isBaixada ? "Reverter Baixa" : isVencido ? "Atrasado - Baixar Transação" : "Pendente - Baixar Transação"}
                            >
                              {isBaixada ? (
                                <CheckCircle2 className="w-5 h-5" />
                              ) : isVencido ? (
                                <AlertCircle className="w-5 h-5" />
                              ) : (
                                <Clock className="w-5 h-5" />
                              )}
                            </button>
                          );
                        })()}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => abrirModal('EDITAR_LANCAMENTO', `${oc.regra_id}:${oc.id}`)}
                          className="p-1.5 text-outline hover:text-primary transition-colors hover:bg-primary/5 rounded-md cursor-pointer"
                          title="Editar Lançamento"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => abrirModal('DUPLICAR_LANCAMENTO', oc.regra_id)}
                          className="p-1.5 text-outline hover:text-primary transition-colors hover:bg-primary/5 rounded-md cursor-pointer"
                          title="Duplicar Lançamento"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => abrirModal('EXCLUIR_LANCAMENTO', `${oc.regra_id}:${oc.id}`)}
                          className="p-1.5 text-outline hover:text-error transition-colors hover:bg-error/5 rounded-md cursor-pointer"
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
        <div className="p-4 border-t border-outline-variant flex justify-between items-center bg-surface-container-low/30">
          <span className="text-xs font-bold text-on-surface-variant">Mostrando {filtered.length} transações no período</span>
          <div className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">
            {contextoAtivo === 'TODOS' ? 'Visão Consolidada' : contextoAtivo === 'PESSOAL' ? 'Filtro: Vida Pessoal (PF)' : 'Filtro: Empresa (PJ)'}
          </div>
        </div>
      </section>

      {/* 5. Mobile Native Card Feed (md:hidden) */}
      <section className="md:hidden space-y-3">
        {isLoading ? (
          <div className="py-20 text-center font-bold text-xs uppercase tracking-widest animate-pulse text-on-surface-variant">
            Sincronizando Dados...
          </div>
        ) : sortedData.length === 0 ? (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-md p-8 text-center space-y-3">
            <p className="text-sm font-bold text-on-surface">Nenhuma movimentação encontrada</p>
            <p className="text-xs text-on-surface-variant opacity-70">Que tal cadastrar sua primeira transação?</p>
            <button
              onClick={() => abrirModal('CRIAR_LANCAMENTO')}
              className="bg-primary-container text-on-primary px-4 py-2 rounded-md font-bold text-xs uppercase tracking-wider inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Novo Lançamento
            </button>
          </div>
        ) : (
          sortedData.map((oc) => {
            const statusVisual = getStatusVisual(oc);
            const isBaixada = statusVisual === 'BAIXADA';
            const isVencido = statusVisual === 'ATRASADO';

            return (
              <div 
                key={oc.id}
                className={cn(
                  "bg-surface-container-lowest border border-outline-variant rounded-md p-4 shadow-xs space-y-3",
                  isBaixada && "opacity-80 bg-surface-container-low/20"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider",
                        oc.contexto === 'EMPRESA' 
                          ? "bg-primary-fixed/60 text-primary-container border border-primary-container/20"
                          : "bg-surface-container-high text-on-surface-variant"
                      )}>
                        {oc.contexto === 'EMPRESA' ? '🏢 PJ' : '👤 PF'}
                      </span>
                      <span className="text-[10px] font-bold text-on-surface-variant">
                        {new Date(oc.data_vencimento + "T12:00:00").toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                      </span>
                      {oc.total_parcelas && (
                        <span className="text-[10px] font-black text-on-surface-variant opacity-60">
                          {oc.numero_parcela}/{oc.total_parcelas}
                        </span>
                      )}
                    </div>
                    <p className="font-bold text-on-surface text-sm truncate">{oc.nome}</p>
                    <p className="text-xs font-medium text-on-surface-variant opacity-70">
                      {oc.categoria?.nome || 'Geral'} • {oc.contato?.nome || 'Particular'}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className={cn(
                      "font-black text-base tnum",
                      oc.natureza === 'ENTRADA' ? "text-primary-container" : "text-error"
                    )}>
                      {oc.natureza === 'ENTRADA' ? '+' : '-'} {formatarMoeda(oc.valor_editado ?? oc.valor)}
                    </p>
                    <span className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider mt-1",
                      isBaixada ? "bg-primary-container/10 text-primary-container" :
                      isVencido ? "bg-error/10 text-error" : "bg-amber-500/10 text-amber-600"
                    )}>
                      {isBaixada ? "Liquidado" : isVencido ? "Atrasado" : "Pendente"}
                    </span>
                  </div>
                </div>

                {/* Ações Rápidas no Card Mobile */}
                <div className="flex items-center justify-between pt-2 border-t border-outline-variant/30">
                  <button
                    onClick={() => abrirModal(isBaixada ? 'DESBAIXAR' : 'BAIXAR', oc.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors",
                      isBaixada 
                        ? "bg-surface-container-high text-on-surface" 
                        : "bg-primary-container text-on-primary"
                    )}
                  >
                    {isBaixada ? <RotateCcw className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    <span>{isBaixada ? "Reverter" : oc.natureza === 'ENTRADA' ? "Recebido" : "Pagar"}</span>
                  </button>

                  <div className="flex items-center gap-1 text-on-surface-variant">
                    <button 
                      onClick={() => abrirModal('EDITAR_LANCAMENTO', `${oc.regra_id}:${oc.id}`)}
                      className="p-1.5 hover:bg-surface-container rounded"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => abrirModal('DUPLICAR_LANCAMENTO', oc.regra_id)}
                      className="p-1.5 hover:bg-surface-container rounded"
                      title="Duplicar"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => abrirModal('EXCLUIR_LANCAMENTO', `${oc.regra_id}:${oc.id}`)}
                      className="p-1.5 hover:bg-surface-container rounded text-error"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* 6. Barra Flutuante de Seleção em Lote */}
      {selecionados.size > 0 && (
        <div className="fixed bottom-28 md:bottom-20 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-8 duration-300 w-[90%] max-w-2xl">
          <div className="bg-on-surface text-surface-container-lowest px-6 py-4 rounded-xl shadow-2xl border border-outline/20 flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-md bg-opacity-95">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary-container text-on-primary flex items-center justify-center font-black text-sm">
                {selecionados.size}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Selecionados</p>
                <button 
                  onClick={() => setSelecionados(new Set())}
                  className="text-xs font-bold text-primary-container hover:underline cursor-pointer"
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
                return acc;
              }, { entradas: 0, saidas: 0 });

              return (
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-0.5">Saldo Selecionado</p>
                    <p className={cn("font-black text-xl tracking-tight tnum", (calc.entradas - calc.saidas) >= 0 ? "text-primary-container" : "text-error")}>
                      {calc.entradas - calc.saidas >= 0 ? '+' : ''}{formatarMoeda(calc.entradas - calc.saidas)}
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* 7. Sticky Footer com Totais Consolidados */}
      <footer className="fixed bottom-0 right-0 left-0 md:left-64 bg-surface-container-low/95 backdrop-blur-xl border-t border-outline-variant p-4 md:p-6 z-30 shadow-[0_-10px_30px_-5px_rgba(0,0,0,0.03)]">
        <div className="max-w-[1800px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-8">
          <div className="flex items-center gap-8">
            <div className="text-center sm:text-left">
              <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-0.5">Entradas do Mês</p>
              <p className="font-black text-base md:text-lg text-primary-container tnum">+{formatarMoeda(totais.entradasTotal)}</p>
            </div>
            <div className="w-px h-8 bg-outline-variant" />
            <div className="text-center sm:text-left">
              <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-0.5">Saídas do Mês</p>
              <p className="font-black text-base md:text-lg text-error tnum">-{formatarMoeda(totais.saidasTotal)}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-right">
            <div>
              <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-0.5">SALDO PREVISTO</p>
              <p className={cn("text-xl md:text-2xl font-black tracking-tighter tnum", saldoProjetado >= 0 ? "text-primary-container" : "text-error")}>
                {saldoProjetado >= 0 ? '+' : ''}{formatarMoeda(saldoProjetado)}
              </p>
            </div>
            <TrendingUp className={cn("w-6 h-6", saldoProjetado >= 0 ? "text-primary-container" : "text-error rotate-180")} />
          </div>
        </div>
      </footer>
    </div>
  );
}
