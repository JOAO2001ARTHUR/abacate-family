"use client";

import { useState } from "react";
import { useContatos, useContatoResumo } from "@/hooks/useContatos";
import { useUIStore } from "@/stores/useUIStore";
import { 
  Plus, 
  Search, 
  MoreVertical, 
  User, 
  Mail,
  ChevronRight,
  ExternalLink,
  Phone,
  MapPin,
  CheckCircle2,
  TrendingUp,
  LayoutGrid,
  Edit2
} from "lucide-react";
import { useOcorrencias } from "@/hooks/useOcorrencias";
import { cn, formatarMoeda } from "@/lib/utils";

export default function ContatosPage() {
  const { data: contatos, isLoading } = useContatos();
  const { abrirModal } = useUIStore();
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [busca, setBusca] = useState("");

  const filtered = contatos?.filter(c => 
    c.nome.toLowerCase().includes(busca.toLowerCase())
  ) || [];

  const contatoAtivo = filtered.find(c => c.id === selecionado) || (filtered.length > 0 ? filtered[0] : null);
  const { data: resumo, isLoading: isLoadingResumo } = useContatoResumo(contatoAtivo?.id || null);
  const { data: recentes, isLoading: isLoadingRecentes } = useOcorrencias(contatoAtivo ? { contato_id: contatoAtivo.id } : null);

  return (
    <div className="h-[calc(100vh-10rem)] animate-in fade-in duration-700">
      <div className="grid grid-cols-12 gap-10 h-full">
        
        {/* Left Column: Master List - Official Style */}
        <section className="col-span-12 lg:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-md flex flex-col overflow-hidden shadow-sm">
          {/* Header */}
          <div className="p-8 border-b border-outline-variant flex flex-col gap-6 shrink-0 bg-surface-container-low/30">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black text-on-surface tracking-tight">Contatos</h2>
              <button 
                onClick={() => abrirModal('CRIAR_CONTATO')}
                className="p-2 bg-primary-container/10 text-primary-container rounded-md hover:bg-primary-container hover:text-on-primary transition-all shadow-sm"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline w-4 h-4 group-focus-within:text-primary-container transition-colors" />
              <input 
                type="text" 
                placeholder="Buscar por nome ou tag..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant rounded-md py-3 pl-11 pr-4 text-sm font-medium focus:border-primary-container outline-none transition-all"
              />
            </div>
          </div>

          {/* Contact List */}
          <div className="flex-1 overflow-y-auto divide-y divide-outline-variant/40">
            {isLoading ? (
              <div className="p-10 text-center font-bold text-[10px] uppercase tracking-widest text-on-surface-variant animate-pulse">Consultando Registros...</div>
            ) : filtered.length === 0 ? (
              <div className="p-10 text-center text-on-surface-variant font-medium opacity-40">Nenhum registro encontrado.</div>
            ) : (
              filtered.map((c) => (
                <div 
                  key={c.id} 
                  onClick={() => setSelecionado(c.id)}
                  className={cn(
                    "flex items-center gap-4 p-6 cursor-pointer transition-all border-l-[4px] group",
                    (selecionado === c.id || (!selecionado && contatoAtivo?.id === c.id))
                      ? "bg-primary-fixed/30 border-l-primary-container" 
                      : "hover:bg-surface-container-low border-l-transparent"
                  )}
                >
                  <div className="w-12 h-12 rounded-md bg-surface-container-highest text-primary-container flex items-center justify-center font-black text-sm shrink-0 border border-outline-variant group-hover:scale-105 transition-transform shadow-sm">
                    {c.nome.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-on-surface text-base truncate leading-tight">{c.nome}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-60">
                        {c.tipo_predominante || 'PARTICULAR'}
                      </span>
                      <div className="w-1 h-1 rounded-full bg-outline-variant" />
                      <span className="text-[10px] font-bold text-primary-container uppercase">Relacionamento Ativo</span>
                    </div>
                  </div>
                  <ChevronRight className={cn(
                    "w-4 h-4 text-outline transition-transform",
                    selecionado === c.id && "translate-x-1 text-primary-container"
                  )} />
                </div>
              ))
            )}
          </div>
        </section>

        {/* Right Column: Detail Panel - Official Style */}
        <section className="hidden lg:col-span-8 flex flex-col gap-8 h-full overflow-y-auto pr-2 pb-20 lg:flex">
          {contatoAtivo ? (
            <>
              {/* Detail Header */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-md p-10 shadow-sm flex justify-between items-start">
                <div className="flex items-center gap-10">
                  <div className="w-24 h-24 rounded-md bg-primary-container text-on-primary flex items-center justify-center text-4xl font-black border-4 border-surface-container-highest shadow-xl">
                    {contatoAtivo.nome.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h1 className="text-4xl font-black text-on-surface tracking-tighter leading-none">{contatoAtivo.nome}</h1>
                      <p className="text-on-surface-variant font-medium text-sm flex items-center gap-2">
                        <MapPin className="w-4 h-4 opacity-40" />
                        Endereço não informado
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="inline-flex items-center px-4 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-widest bg-primary-fixed/50 text-primary-container border border-primary-container/20">
                        {contatoAtivo.tipo_predominante || 'CONTATO'}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-on-surface-variant opacity-60">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary-container" />
                        Verificado
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button className="px-8 py-3 border border-outline-variant rounded-md font-bold text-sm text-on-surface hover:bg-surface-container transition-all">Editar Cadastro</button>
                  <button 
                    onClick={() => abrirModal('CRIAR_LANCAMENTO')}
                    className="px-8 py-3 bg-primary-container text-on-primary rounded-md font-bold text-sm hover:opacity-90 transition-all shadow-lg flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Novo Lançamento
                  </button>
                </div>
              </div>

              {/* Financial Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-surface-container-lowest border border-outline-variant rounded-md p-8 shadow-sm">
                  <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-4">Volume Total Transacionado</p>
                  <div className="flex items-end gap-2">
                    <p className={cn(
                      "text-3xl font-black text-on-surface tracking-tight tnum transition-opacity",
                      isLoadingResumo && "opacity-30"
                    )}>
                      {formatarMoeda(resumo?.volume_total || 0)}
                    </p>
                    <TrendingUp className="w-5 h-5 text-primary-container mb-1.5 opacity-20" />
                  </div>
                </div>
                <div className="bg-surface-container-lowest border border-outline-variant border-l-[6px] border-l-error rounded-md p-8 shadow-sm">
                  <p className="text-[10px] font-black text-error uppercase tracking-widest mb-4">Compromissos Pendentes</p>
                  <p className={cn(
                    "text-3xl font-black text-error tracking-tight tnum transition-opacity",
                    isLoadingResumo && "opacity-30"
                  )}>
                    {formatarMoeda(resumo?.compromissos_pendentes || 0)}
                  </p>
                </div>
                <div className="bg-surface-container-lowest border border-outline-variant rounded-md p-8 shadow-sm flex flex-col justify-center items-center text-center group hover:border-primary-container transition-colors">
                  <div className="w-12 h-12 bg-primary-fixed/40 rounded-full flex items-center justify-center text-primary-container mb-3 transition-transform group-hover:rotate-12">
                    <LayoutGrid className="w-6 h-6" />
                  </div>
                  <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">SITUAÇÃO FINANCEIRA</p>
                  <p className="text-base font-black text-on-surface mt-1">EM CONFORMIDADE</p>
                </div>
              </div>

              {/* Detailed Information Section */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-md p-10 shadow-sm space-y-10">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-on-surface tracking-tight uppercase">Informações Corporativas</h3>
                  <button className="text-[10px] font-black text-primary-container uppercase tracking-widest hover:underline flex items-center gap-2">
                    Ver Histórico Completo <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-12">
                  <div className="flex items-start gap-5 text-on-surface-variant">
                    <div className="w-10 h-10 rounded-md bg-surface-container-low flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5 opacity-60 text-primary-container" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">E-mail Principal</p>
                      <p className="font-bold text-on-surface text-base">{contatoAtivo.email || 'Não informado'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-5 text-on-surface-variant">
                    <div className="w-10 h-10 rounded-md bg-surface-container-low flex items-center justify-center shrink-0">
                      <Phone className="w-5 h-5 opacity-60 text-primary-container" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Telefone / WhatsApp</p>
                      <p className="font-bold text-on-surface text-base">Não informado</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transactions History Table - Mini Version */}
                <div className="flex-1 overflow-x-auto">
                  {isLoadingRecentes ? (
                    <div className="p-20 text-center font-bold text-[10px] uppercase tracking-widest text-outline animate-pulse">Buscando histórico...</div>
                  ) : recentes && recentes.length > 0 ? (
                    <table className="w-full">
                      <thead>
                        <tr className="bg-surface-container-low/40">
                          <th className="px-8 py-4 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">Lançamento</th>
                          <th className="px-8 py-4 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">Vencimento</th>
                          <th className="px-8 py-4 text-right text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">Valor</th>
                          <th className="px-8 py-4 text-center text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/40">
                        {recentes.slice(0, 5).map((oc) => (
                          <tr key={oc.id} className="hover:bg-surface-container-low/30 transition-colors group">
                            <td className="px-8 py-5">
                              <p className="font-bold text-sm text-on-surface truncate max-w-[200px]">{oc.nome}</p>
                              {oc.numero_parcela && (
                                <span className="text-[10px] font-black text-primary uppercase opacity-60">Parcela {oc.numero_parcela}</span>
                              )}
                            </td>
                            <td className="px-8 py-5">
                              <p className="text-xs font-bold text-on-surface-variant">
                                {new Date(oc.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}
                              </p>
                            </td>
                            <td className="px-8 py-5 text-right">
                              <p className={cn(
                                "font-black text-sm tnum",
                                oc.natureza === "ENTRADA" ? "text-primary-container" : "text-error"
                              )}>
                                {formatarMoeda(oc.valor_editado ?? oc.valor)}
                              </p>
                            </td>
                            <td className="px-8 py-5 text-center">
                              <button 
                                onClick={() => abrirModal('EDITAR_LANCAMENTO', oc.regra_id)}
                                className="p-2 text-outline hover:text-primary transition-colors hover:bg-primary/5 rounded-md"
                                title="Editar Lançamento"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-20 text-center flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center text-outline/30">
                        <ExternalLink className="w-8 h-8" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-base font-black text-on-surface tracking-tight opacity-40 uppercase">Nenhum lançamento registrado</p>
                        <p className="text-xs font-medium text-on-surface-variant opacity-40">O histórico financeiro deste contato está vazio.</p>
                      </div>
                    </div>
                  )}
                </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-20 gap-6 opacity-30">
              <User className="w-24 h-24 stroke-1" />
              <div className="space-y-2">
                <p className="text-2xl font-black text-on-surface tracking-tight uppercase">Seleção Necessária</p>
                <p className="text-sm font-medium">Selecione um contato da lista ao lado para acessar a ficha financeira completa.</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
