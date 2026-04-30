
"use client";

import { useUIStore } from "@/stores/useUIStore";
import { useVariavelResumo, DimensaoType } from "@/hooks/useVariaveis";
import { formatarMoeda, cn } from "@/lib/utils";
import { X, Calendar, CheckCircle2, Clock, ArrowUpRight, ArrowDownLeft } from "lucide-react";

export function ModalDetalhesMesContato({ id, dimensao }: { id: string | null, dimensao: DimensaoType }) {
  const { modalAberto, fecharModal, idSelecionado: mes } = useUIStore();
  const { data: resumo } = useVariavelResumo(dimensao, id);

  if (modalAberto !== 'DETALHES_MES_CONTATO' || !mes || !resumo) return null;

  // Filtrar histórico pelo mês selecionado
  const ocorrenciasMes = resumo.historico.filter(oc => oc.data_vencimento.startsWith(mes));

  const porCategoria = {
    FIXA: ocorrenciasMes.filter(oc => oc.lancamento.tipo === 'FIXA'),
    PARCELA: ocorrenciasMes.filter(oc => oc.lancamento.tipo === 'PARCELA'),
    ESPORADICA: ocorrenciasMes.filter(oc => oc.lancamento.tipo === 'ESPORADICA' || !oc.lancamento.tipo)
  };

  const totalPago = ocorrenciasMes
    .filter(oc => oc.status === 'BAIXADA')
    .reduce((acc, oc) => acc + Number(oc.valor_editado ?? oc.valor), 0);

  const totalPendente = ocorrenciasMes
    .filter(oc => oc.status === 'PENDENTE')
    .reduce((acc, oc) => acc + Number(oc.valor_editado ?? oc.valor), 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={fecharModal} />
      
      <div className="relative bg-surface-container-lowest border border-outline-variant rounded-md shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-8 border-b border-outline-variant flex justify-between items-center bg-surface-container-low/30">
          <div>
            <h2 className="text-2xl font-black text-on-surface tracking-tighter uppercase">Detalhes da Referência</h2>
            <p className="text-on-surface-variant font-bold text-sm flex items-center gap-2 mt-1">
              <Calendar className="w-4 h-4 text-primary-container" />
              {new Date(mes + "-01T12:00:00").toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </p>
          </div>
          <button 
            onClick={fecharModal}
            className="p-2 hover:bg-surface-container rounded-md transition-colors text-outline hover:text-on-surface"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-10">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-surface-container-low/50 border border-outline-variant rounded-md p-6">
              <p className="text-[10px] font-black text-primary-container uppercase tracking-widest mb-1">Liquidado no Mês</p>
              <p className="text-2xl font-black text-on-surface tnum">{formatarMoeda(totalPago)}</p>
            </div>
            <div className="bg-surface-container-low/50 border border-outline-variant rounded-md p-6">
              <p className="text-[10px] font-black text-error uppercase tracking-widest mb-1">Pendente no Mês</p>
              <p className="text-2xl font-black text-on-surface tnum">{formatarMoeda(totalPendente)}</p>
            </div>
          </div>

          {/* List by Type */}
          <div className="space-y-8">
            {/* Fixos */}
            {porCategoria.FIXA.length > 0 && (
              <section className="space-y-4">
                <h3 className="text-xs font-black text-on-surface-variant uppercase tracking-widest flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-container" />
                  Pagamentos Fixos (Mensais)
                </h3>
                <div className="divide-y divide-outline-variant/40 border border-outline-variant rounded-md overflow-hidden">
                  {porCategoria.FIXA.map(oc => (
                    <ItemDetalhe key={oc.id} oc={oc} />
                  ))}
                </div>
              </section>
            )}

            {/* Parcelados */}
            {porCategoria.PARCELA.length > 0 && (
              <section className="space-y-4">
                <h3 className="text-xs font-black text-on-surface-variant uppercase tracking-widest flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Pagamentos Parcelados
                </h3>
                <div className="divide-y divide-outline-variant/40 border border-outline-variant rounded-md overflow-hidden">
                  {porCategoria.PARCELA.map(oc => (
                    <ItemDetalhe key={oc.id} oc={oc} showParcela />
                  ))}
                </div>
              </section>
            )}

            {/* Esporádicos */}
            {porCategoria.ESPORADICA.length > 0 && (
              <section className="space-y-4">
                <h3 className="text-xs font-black text-on-surface-variant uppercase tracking-widest flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-outline" />
                  Pagamentos Esporádicos / Únicos
                </h3>
                <div className="divide-y divide-outline-variant/40 border border-outline-variant rounded-md overflow-hidden">
                  {porCategoria.ESPORADICA.map(oc => (
                    <ItemDetalhe key={oc.id} oc={oc} />
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-outline-variant bg-surface-container-low/30 flex justify-between items-end">
          <div className="text-left">
            <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-1 opacity-60">Percentual Liquidado</p>
            <p className="text-xl font-black text-primary-container">{Math.round((totalPago / (totalPago + totalPendente || 1)) * 100)}%</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-1">Volume de Compromisso do Mês</p>
            <p className="text-3xl font-black text-on-surface tnum">{formatarMoeda(totalPago + totalPendente)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ItemDetalhe({ oc, showParcela }: { oc: any, showParcela?: boolean }) {
  return (
    <div className="p-5 flex justify-between items-center hover:bg-surface-container-low transition-colors group">
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-10 h-10 rounded-md flex items-center justify-center border border-outline-variant/30",
          oc.status === 'BAIXADA' ? "bg-primary-fixed/30 text-primary-container" : "bg-surface-container-highest text-outline"
        )}>
          {oc.status === 'BAIXADA' ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
        </div>
        <div>
          <p className="font-bold text-on-surface text-base">
            {oc.nome}
            {showParcela && (
              <span className="ml-3 text-[10px] font-black text-primary-container bg-primary-fixed/50 px-2 py-0.5 rounded-sm uppercase tracking-tighter">
                Parcela {oc.numero_parcela}/{oc.lancamento.total_parcelas}
              </span>
            )}
          </p>
          <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-60">
            {new Date(oc.data_vencimento + "T12:00:00").toLocaleDateString('pt-BR')} • {oc.lancamento.natureza}
          </p>
        </div>
      </div>
      <div className="text-right">
        <div className="flex items-center justify-end gap-2">
          {oc.lancamento.natureza === 'ENTRADA' ? (
            <ArrowUpRight className="w-4 h-4 text-primary-container opacity-40" />
          ) : (
            <ArrowDownLeft className="w-4 h-4 text-error opacity-40" />
          )}
          <p className={cn(
            "font-black text-lg tnum",
            oc.lancamento.natureza === 'ENTRADA' ? "text-primary-container" : "text-error"
          )}>
            {oc.lancamento.natureza === 'ENTRADA' ? '+' : '-'} {formatarMoeda(oc.valor_editado ?? oc.valor)}
          </p>
        </div>
        <span className={cn(
          "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm border inline-block mt-1",
          oc.status === 'BAIXADA' ? "border-primary-container/30 text-primary-container bg-primary-container/5" : "border-outline-variant text-outline"
        )}>
          {oc.status === 'BAIXADA' ? 'Liquidado' : 'Pendente'}
        </span>
      </div>
    </div>
  );
}
