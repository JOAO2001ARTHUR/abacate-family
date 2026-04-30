"use client";

import { useState } from "react";
import { useContatos } from "@/hooks/useContatos";
import { useCategorias } from "@/hooks/useCategorias";
import { useLocaisPagamento } from "@/hooks/useLocaisPagamento";
import { useVariavelResumo, DimensaoType } from "@/hooks/useVariaveis";
import { useUIStore } from "@/stores/useUIStore";
import { 
  Plus, 
  Search, 
  User, 
  ChevronRight,
  MapPin,
  CheckCircle2,
  Calendar,
  LayoutGrid,
  Edit2,
  Tag,
  Palette
} from "lucide-react";
import { useOcorrencias } from "@/hooks/useOcorrencias";
import { cn, formatarMoeda } from "@/lib/utils";
import { ModalDetalhesMesContato } from "@/components/shared/ModalDetalhesMesContato";
import { ModalDetalhesStatusContato } from "@/components/shared/ModalDetalhesStatusContato";

export default function VariaveisPage() {
  const [dimensaoAtiva, setDimensaoAtiva] = useState<DimensaoType>('contato');
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [tabAtiva, setTabAtiva] = useState<'FIXA' | 'PARCELA' | 'ESPORADICA'>('FIXA');

  const { abrirModal } = useUIStore();

  const { data: contatos, isLoading: isLoadingContatos } = useContatos();
  const { data: categorias, isLoading: isLoadingCategorias } = useCategorias();
  const { data: locais, isLoading: isLoadingLocais } = useLocaisPagamento();

  // Obter lista ativa
  const getListaAtiva = () => {
    if (dimensaoAtiva === 'contato') return contatos || [];
    if (dimensaoAtiva === 'categoria') return categorias || [];
    if (dimensaoAtiva === 'onde_pagar') return locais || [];
    if (dimensaoAtiva === 'recorrencia') return [
      { id: 'ESPORADICA', nome: 'Único', icone: 'target' },
      { id: 'PARCELA', nome: 'Parcelado', icone: 'layers' },
      { id: 'FIXA', nome: 'Mensal (recorrente)', icone: 'sync' }
    ];
    return [];
  };

  const listaAtiva = getListaAtiva();
  const isLoading = isLoadingContatos || isLoadingCategorias || isLoadingLocais;

  const filtered = listaAtiva.filter(item => 
    item.nome.toLowerCase().includes(busca.toLowerCase())
  );

  const itemAtivo = filtered.find(c => c.id === selecionado) || (filtered.length > 0 ? filtered[0] : null);
  const { data: resumo, isLoading: isLoadingResumo } = useVariavelResumo(dimensaoAtiva, itemAtivo?.id || null);

  const getModalCriar = () => {
    if (dimensaoAtiva === 'contato') return 'CRIAR_CONTATO';
    if (dimensaoAtiva === 'categoria') return 'CRIAR_CATEGORIA';
    if (dimensaoAtiva === 'onde_pagar') return 'CRIAR_LOCAL_PAGAMENTO';
    return null;
  };

  const getModalEditar = () => {
    if (dimensaoAtiva === 'contato') return 'EDITAR_CONTATO';
    if (dimensaoAtiva === 'categoria') return 'EDITAR_CATEGORIA';
    if (dimensaoAtiva === 'onde_pagar') return 'EDITAR_LOCAL_PAGAMENTO';
    return null;
  };

  return (
    <div className="h-[calc(100vh-10rem)] animate-in fade-in duration-700">
      <div className="grid grid-cols-12 gap-10 h-full">
        
        {/* Left Column: Master List */}
        <section className="col-span-12 lg:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-md flex flex-col overflow-hidden shadow-sm">
          {/* Header */}
          <div className="p-8 border-b border-outline-variant flex flex-col gap-6 shrink-0 bg-surface-container-low/30">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black text-on-surface tracking-tight">Variáveis</h2>
              <button 
                onClick={() => {
                  const modal = getModalCriar();
                  if (modal) abrirModal(modal as any);
                }}
                className={cn(
                  "p-2 bg-primary-container/10 text-primary-container rounded-md hover:bg-primary-container hover:text-on-primary transition-all shadow-sm",
                  dimensaoAtiva === 'recorrencia' && "opacity-0 pointer-events-none"
                )}
                title="Novo Registro"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Seletor de Dimensão */}
            <div className="flex bg-surface-container-high p-1 rounded-md">
              <button 
                onClick={() => { setDimensaoAtiva('contato'); setSelecionado(null); }}
                className={cn(
                  "flex-1 py-2 text-xs font-bold rounded transition-all",
                  dimensaoAtiva === 'contato' ? "bg-surface-container-lowest text-on-surface shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                )}
              >
                Contatos
              </button>
              <button 
                onClick={() => { setDimensaoAtiva('categoria'); setSelecionado(null); }}
                className={cn(
                  "flex-1 py-2 text-xs font-bold rounded transition-all",
                  dimensaoAtiva === 'categoria' ? "bg-surface-container-lowest text-on-surface shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                )}
              >
                Categorias
              </button>
              <button 
                onClick={() => { setDimensaoAtiva('onde_pagar'); setSelecionado(null); }}
                className={cn(
                  "flex-1 py-2 text-[10px] uppercase font-black rounded transition-all",
                  dimensaoAtiva === 'onde_pagar' ? "bg-surface-container-lowest text-on-surface shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                )}
              >
                Onde Pagar
              </button>
              <button 
                onClick={() => { setDimensaoAtiva('recorrencia'); setSelecionado(null); }}
                className={cn(
                  "flex-1 py-2 text-[10px] uppercase font-black rounded transition-all",
                  dimensaoAtiva === 'recorrencia' ? "bg-surface-container-lowest text-on-surface shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                )}
              >
                Cobrança
              </button>
            </div>

            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline w-4 h-4 group-focus-within:text-primary-container transition-colors" />
              <input 
                type="text" 
                placeholder={`Buscar em ${dimensaoAtiva.replace('_', ' ')}...`}
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant rounded-md py-3 pl-11 pr-4 text-sm font-medium focus:border-primary-container outline-none transition-all"
              />
            </div>
          </div>

          {/* Master List */}
          <div className="flex-1 overflow-y-auto divide-y divide-outline-variant/40">
            {isLoading ? (
              <div className="p-10 text-center font-bold text-[10px] uppercase tracking-widest text-on-surface-variant animate-pulse">Consultando Registros...</div>
            ) : filtered.length === 0 ? (
              <div className="p-10 text-center text-on-surface-variant font-medium opacity-40">Nenhum registro encontrado.</div>
            ) : (
              filtered.map((item: any) => (
                <div 
                  key={item.id} 
                  onClick={() => setSelecionado(item.id)}
                  className={cn(
                    "flex items-center gap-4 p-6 cursor-pointer transition-all border-l-[4px] group",
                    (selecionado === item.id || (!selecionado && itemAtivo?.id === item.id))
                      ? "bg-primary-fixed/30 border-l-primary-container" 
                      : "hover:bg-surface-container-low border-l-transparent"
                  )}
                >
                  <div 
                    className="w-12 h-12 rounded-md flex items-center justify-center font-black text-sm shrink-0 border border-outline-variant group-hover:scale-105 transition-transform shadow-sm text-primary-container"
                    style={{ backgroundColor: item.cor ? `${item.cor}20` : 'var(--surface-container-highest)', color: item.cor || 'var(--primary-container)' }}
                  >
                    {dimensaoAtiva === 'categoria' && item.icone ? (
                      <span className="material-symbols-outlined">{item.icone}</span>
                    ) : dimensaoAtiva === 'onde_pagar' ? (
                      <MapPin className="w-5 h-5" />
                    ) : dimensaoAtiva === 'recorrencia' ? (
                      <span className="material-symbols-outlined">{item.icone}</span>
                    ) : (
                      item.nome.substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-on-surface text-base truncate leading-tight">{item.nome}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-60">
                        {dimensaoAtiva === 'contato' ? (item.tipo_predominante || 'PARTICULAR') : 
                         dimensaoAtiva === 'categoria' ? 'CATEGORIA' : 
                         dimensaoAtiva === 'onde_pagar' ? 'LOCAL DE PAGAMENTO' : 'TIPO DE COBRANÇA'}
                      </span>
                    </div>
                  </div>
                  {item.saldo_pendente !== undefined && item.saldo_pendente > 0 && (
                    <div className="text-right shrink-0 mr-2">
                      <p className="text-[8px] font-black text-error uppercase tracking-widest opacity-40 mb-0.5">Pendente</p>
                      <p className="text-xs font-black text-error tnum">{formatarMoeda(item.saldo_pendente)}</p>
                    </div>
                  )}
                  <ChevronRight className={cn(
                    "w-4 h-4 text-outline transition-transform",
                    selecionado === item.id && "translate-x-1 text-primary-container"
                  )} />
                </div>
              ))
            )}
          </div>
        </section>

        {/* Right Column: Detail Panel */}
        <section className="hidden lg:col-span-8 flex flex-col gap-8 h-full overflow-y-auto pr-2 pb-20 lg:flex">
          {itemAtivo ? (
            <>
              {/* Detail Header */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-md p-10 shadow-sm flex justify-between items-start">
                <div className="flex items-center gap-10">
                  <div 
                    className="w-24 h-24 rounded-md flex items-center justify-center text-4xl font-black border-4 shadow-xl"
                    style={{ 
                      backgroundColor: itemAtivo.cor ? `${itemAtivo.cor}` : 'var(--primary-container)', 
                      color: itemAtivo.cor ? '#fff' : 'var(--on-primary)',
                      borderColor: 'var(--surface-container-highest)'
                    }}
                  >
                    {dimensaoAtiva === 'categoria' && itemAtivo.icone ? (
                      <span className="material-symbols-outlined text-5xl">{itemAtivo.icone}</span>
                    ) : dimensaoAtiva === 'onde_pagar' ? (
                      <MapPin className="w-10 h-10" />
                    ) : dimensaoAtiva === 'recorrencia' ? (
                      <span className="material-symbols-outlined text-5xl">{itemAtivo.icone}</span>
                    ) : (
                      itemAtivo.nome.substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h1 className="text-4xl font-black text-on-surface tracking-tighter leading-none">{itemAtivo.nome}</h1>
                      <p className="text-on-surface-variant font-medium text-sm flex items-center gap-2">
                        {dimensaoAtiva === 'contato' && <><MapPin className="w-4 h-4 opacity-40" /> Endereço não informado</>}
                        {dimensaoAtiva === 'categoria' && <><Tag className="w-4 h-4 opacity-40" /> Classificação Contábil</>}
                        {dimensaoAtiva === 'onde_pagar' && <><LayoutGrid className="w-4 h-4 opacity-40" /> Local de Liquidação</>}
                        {dimensaoAtiva === 'recorrencia' && <><Calendar className="w-4 h-4 opacity-40" /> Periodicidade de Pagamento</>}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="inline-flex items-center px-4 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-widest bg-primary-fixed/50 text-primary-container border border-primary-container/20">
                        {dimensaoAtiva.replace('_', ' ')}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-on-surface-variant opacity-60">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary-container" />
                        Ativo
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-4">
                  {getModalEditar() && (
                    <button 
                      onClick={() => {
                        const modal = getModalEditar();
                        if (modal) abrirModal(modal as any, itemAtivo.id);
                      }}
                      className="px-8 py-3 border border-outline-variant rounded-md font-bold text-sm text-on-surface hover:bg-surface-container transition-all"
                    >
                      Editar Cadastro
                    </button>
                  )}
                  <button 
                    onClick={() => abrirModal('CRIAR_LANCAMENTO')}
                    className="px-8 py-3 bg-primary-container text-on-primary rounded-md font-bold text-sm hover:opacity-90 transition-all shadow-lg flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Novo Lançamento
                  </button>
                </div>
              </div>

              {/* Financial Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div 
                  onClick={() => abrirModal('DETALHES_PAGOS_CONTATO')}
                  className="bg-surface-container-lowest border border-outline-variant rounded-md p-6 shadow-sm cursor-pointer hover:border-primary-container transition-all hover:scale-[1.02] active:scale-95 group"
                >
                  <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-2 group-hover:text-primary-container transition-colors">Total Pago (Liquidez)</p>
                  <p className={cn(
                    "text-2xl font-black text-primary-container tracking-tight tnum transition-opacity",
                    isLoadingResumo && "opacity-30"
                  )}>
                    {formatarMoeda(resumo?.resumo.volume_total || 0)}
                  </p>
                </div>
                <div 
                  onClick={() => abrirModal('DETALHES_PENDENTES_CONTATO')}
                  className="bg-surface-container-lowest border border-outline-variant border-l-[4px] border-l-error rounded-md p-6 shadow-sm cursor-pointer hover:border-error transition-all hover:scale-[1.02] active:scale-95 group"
                >
                  <p className="text-[10px] font-black text-error uppercase tracking-widest mb-2">Compromissos Pendentes</p>
                  <p className={cn(
                    "text-2xl font-black text-error tracking-tight tnum transition-opacity",
                    isLoadingResumo && "opacity-30"
                  )}>
                    {formatarMoeda(resumo?.resumo.compromissos_pendentes || 0)}
                  </p>
                </div>
                <div className="bg-surface-container-lowest border border-outline-variant rounded-md p-6 shadow-sm">
                  <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-2">Volume Financeiro Total</p>
                  <p className={cn(
                    "text-2xl font-black text-on-surface tracking-tight tnum transition-opacity",
                    isLoadingResumo && "opacity-30"
                  )}>
                    {formatarMoeda((resumo?.resumo.volume_total || 0) + (resumo?.resumo.compromissos_pendentes || 0))}
                  </p>
                </div>
              </div>

              {/* Totais por Mês - Horizontal Scroll */}
              <div className="space-y-4">
                <h3 className="text-sm font-black text-on-surface-variant uppercase tracking-widest">Projeção por Mês</h3>
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
                  {resumo?.totais_por_mes.map((m) => (
                    <div 
                      key={m.mes} 
                      onClick={() => abrirModal('DETALHES_MES_CONTATO', m.mes)}
                      className="bg-surface-container-lowest border border-outline-variant rounded-md p-6 min-w-[200px] shadow-sm shrink-0 cursor-pointer hover:border-primary-container transition-all hover:scale-[1.02] active:scale-95 group"
                    >
                      <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-1 group-hover:text-primary-container transition-colors">
                        {new Date(m.mes + "-01T12:00:00").toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                      </p>
                      <p className="text-xl font-black text-on-surface tnum">{formatarMoeda(m.valor)}</p>
                      <div className="w-full bg-surface-container-high h-1.5 rounded-full mt-3 overflow-hidden">
                        <div 
                          className="bg-primary-container h-full transition-all duration-1000" 
                          style={{ width: `${m.progresso}%` }} 
                        />
                      </div>
                    </div>
                  ))}
                  {(!resumo?.totais_por_mes || resumo.totais_por_mes.length === 0) && (
                    <p className="text-xs font-medium text-on-surface-variant opacity-40 py-10">Nenhuma projeção futura.</p>
                  )}
                </div>
              </div>

              {/* Classificação dos Lançamentos */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-md overflow-hidden shadow-sm">
                <div className="p-8 border-b border-outline-variant bg-surface-container-low/30 flex justify-between items-center">
                  <h3 className="text-lg font-black text-on-surface tracking-tight uppercase">Classificação Financeira</h3>
                  <div className="flex gap-2">
                    {['FIXA', 'PARCELA', 'ESPORADICA'].map((t) => (
                      <button 
                        key={t}
                        onClick={() => setTabAtiva(t as any)}
                        className={cn(
                          "px-4 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all",
                          tabAtiva === t 
                            ? "bg-primary-container text-on-primary shadow-md" 
                            : "text-on-surface-variant hover:bg-surface-container"
                        )}
                      >
                        {t === 'FIXA' ? 'Mensais' : t === 'PARCELA' ? 'Parcelados' : 'Esporádicos'}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="p-8 min-h-[300px]">
                  {tabAtiva === 'PARCELA' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {resumo?.por_tipo.PARCELA.map((p: any, idx: number) => (
                        <div key={idx} className="p-6 border border-outline-variant rounded-md space-y-4 hover:border-primary-container/30 transition-colors">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-bold text-on-surface text-base">{p.nome}</p>
                              <p className="text-[10px] font-black text-primary-container uppercase tracking-widest opacity-60">
                                {p.natureza} • {p.total_parcelas} Parcelas
                              </p>
                            </div>
                            <p className="font-black text-on-surface tnum">{formatarMoeda(p.valor_total)}</p>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                              <span>Progresso: {p.parcelas_pagas}/{p.total_parcelas} Pagas</span>
                              <span>{Math.round((p.parcelas_pagas / p.total_parcelas) * 100)}%</span>
                            </div>
                            <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                              <div 
                                className="bg-primary-container h-full transition-all duration-1000" 
                                style={{ width: `${(p.parcelas_pagas / p.total_parcelas) * 100}%` }} 
                              />
                            </div>
                          </div>
                          
                          <div className="pt-2 flex justify-between items-center border-t border-outline-variant/30">
                            <span className="text-[10px] font-bold text-on-surface-variant opacity-60 uppercase">Valor Liquidado</span>
                            <span className="text-xs font-black text-primary-container">{formatarMoeda(p.valor_pago)}</span>
                          </div>
                        </div>
                      ))}
                      {resumo?.por_tipo.PARCELA.length === 0 && (
                        <div className="col-span-2 py-10 text-center text-on-surface-variant opacity-40 font-medium">Nenhum compromisso parcelado.</div>
                      )}
                    </div>
                  )}

                  {tabAtiva === 'FIXA' && (
                    <div className="space-y-4">
                      {resumo?.por_tipo.FIXA.map((f: any, idx: number) => (
                        <div key={idx} className="p-6 border border-outline-variant rounded-md flex justify-between items-center hover:bg-surface-container-low/30 transition-all">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary-fixed/30 flex items-center justify-center text-primary-container">
                              <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-bold text-on-surface text-base">{f.nome}</p>
                              <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-60">Recorrência Mensal • {f.natureza}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-on-surface tnum">{formatarMoeda(f.ocorrencias[0]?.valor_editado ?? f.ocorrencias[0]?.valor)}</p>
                            <p className="text-[10px] font-bold text-primary-container uppercase mt-1">Lançamento Ativo</p>
                          </div>
                        </div>
                      ))}
                      {resumo?.por_tipo.FIXA.length === 0 && (
                        <div className="py-10 text-center text-on-surface-variant opacity-40 font-medium">Nenhum lançamento fixo registrado.</div>
                      )}
                    </div>
                  )}

                  {tabAtiva === 'ESPORADICA' && (
                    <div className="divide-y divide-outline-variant/40 border border-outline-variant rounded-md overflow-hidden">
                      {resumo?.por_tipo.ESPORADICA.map((oc: any, idx: number) => (
                        <div key={idx} className="p-4 flex justify-between items-center hover:bg-surface-container-low/30 transition-all group">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              oc.status === 'BAIXADA' ? "bg-primary-container" : "bg-outline-variant"
                            )} />
                            <div>
                              <p className="font-bold text-sm text-on-surface">{oc.nome || oc.lancamento.nome}</p>
                              <p className="text-[10px] font-medium text-on-surface-variant opacity-60">
                                {new Date(oc.data_vencimento + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <p className={cn(
                              "font-black text-sm tnum",
                              oc.lancamento?.natureza === "ENTRADA" ? "text-primary-container" : "text-error"
                            )}>{formatarMoeda(oc.valor_editado ?? oc.valor)}</p>
                            <span className={cn(
                              "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm border",
                              oc.status === 'BAIXADA' ? "border-primary-container/30 text-primary-container bg-primary-container/5" : "border-outline-variant text-outline"
                            )}>
                              {oc.status === 'BAIXADA' ? 'Pago' : 'Pendente'}
                            </span>
                          </div>
                        </div>
                      ))}
                      {resumo?.por_tipo.ESPORADICA.length === 0 && (
                        <div className="py-10 text-center text-on-surface-variant opacity-40 font-medium">Nenhum lançamento esporádico.</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Histórico Completo */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-md overflow-hidden shadow-sm">
                <div className="p-8 border-b border-outline-variant bg-surface-container-low/30">
                  <h3 className="text-lg font-black text-on-surface tracking-tight uppercase">Histórico Completo de Movimentações</h3>
                </div>
                <div className="overflow-x-auto">
                  {resumo?.historico && resumo.historico.length > 0 ? (
                    <table className="w-full text-nowrap">
                      <thead>
                        <tr className="bg-surface-container-low/40 text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">
                          <th className="px-8 py-4 text-left">Vencimento</th>
                          <th className="px-8 py-4 text-left">Lançamento</th>
                          <th className="px-8 py-4 text-center">Tipo</th>
                          <th className="px-8 py-4 text-right">Valor</th>
                          <th className="px-8 py-4 text-center">Status</th>
                          <th className="px-8 py-4 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/40">
                        {resumo.historico.map((oc: any) => (
                          <tr key={oc.id} className="hover:bg-surface-container-low/30 transition-colors group">
                            <td className="px-8 py-5 text-xs font-bold text-on-surface-variant tnum">
                              {new Date(oc.data_vencimento + 'T12:00:00').toLocaleDateString('pt-BR')}
                            </td>
                            <td className="px-8 py-5">
                              <p className="font-bold text-sm text-on-surface">{oc.lancamento.nome}</p>
                              {oc.numero_parcela && (
                                <span className="text-[10px] font-black text-primary uppercase opacity-60">Parcela {oc.numero_parcela}/{oc.lancamento.total_parcelas}</span>
                              )}
                            </td>
                            <td className="px-8 py-5 text-center">
                              <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 border border-outline-variant px-2 py-0.5 rounded-sm">
                                {oc.lancamento.tipo}
                              </span>
                            </td>
                            <td className="px-8 py-5 text-right">
                              <p className={cn(
                                "font-black text-sm tnum",
                                oc.lancamento.natureza === "ENTRADA" ? "text-primary-container" : "text-error"
                              )}>
                                {formatarMoeda(oc.valor_editado ?? oc.valor)}
                              </p>
                            </td>
                            <td className="px-8 py-5 text-center">
                              <span className={cn(
                                "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm border",
                                oc.status === 'BAIXADA' ? "border-primary-container/30 text-primary-container bg-primary-container/5" : "border-outline-variant text-outline"
                              )}>
                                {oc.status === 'BAIXADA' ? 'Pago' : 'Pendente'}
                              </span>
                            </td>
                            <td className="px-8 py-5 text-right">
                              <button 
                                onClick={() => abrirModal('EDITAR_LANCAMENTO', oc.lancamento.id)}
                                className="p-2 text-outline hover:text-primary transition-colors hover:bg-primary/5 rounded-md"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-20 text-center text-on-surface-variant opacity-40 font-medium">Sem movimentações registradas.</div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-20 gap-6 opacity-30">
              <LayoutGrid className="w-24 h-24 stroke-1" />
              <div className="space-y-2">
                <p className="text-2xl font-black text-on-surface tracking-tight uppercase">Seleção Necessária</p>
                <p className="text-sm font-medium">Selecione um item da lista ao lado para acessar a ficha financeira completa.</p>
              </div>
            </div>
          )}
        </section>
      </div>
      
      {/* Modal de Detalhes por Mês */}
      <ModalDetalhesMesContato id={itemAtivo?.id || null} dimensao={dimensaoAtiva} />
      {/* Modal de Detalhes por Status (Pago/Pendente) */}
      <ModalDetalhesStatusContato id={itemAtivo?.id || null} dimensao={dimensaoAtiva} />
    </div>
  );
}
