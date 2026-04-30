"use client";

import { useState } from "react";
import { useUIStore } from "@/stores/useUIStore";
import { X, CheckCircle2, AlertCircle, Loader2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { FormCriarLancamento } from "./FormCriarLancamento";
import { FormEditarLancamento } from "./FormEditarLancamento";
import { FormDuplicarLancamento } from "./FormDuplicarLancamento";
import { FormCategoria, FormContato, FormLocalPagamento } from "./FormEntidadesStandalone";
import { ModalExcluirLancamento } from "./ModalExcluirLancamento";

export function Modals() {
  const { modalAberto, fecharModal, idSelecionado } = useUIStore();
  const supabase = createClient();
  const queryClient = useQueryClient();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!modalAberto || ['DETALHES_MES_CONTATO', 'DETALHES_PAGOS_CONTATO', 'DETALHES_PENDENTES_CONTATO'].includes(modalAberto)) return null;

  const handleConfirmarBaixa = async () => {
    if (!idSelecionado) return;
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error: updateError } = await supabase
        .from("ocorrencias")
        .update({ 
          status: "BAIXADA",
          data_baixa: new Date().toISOString().split('T')[0],
          baixado_por: user?.id,
          baixado_em: new Date().toISOString()
        })
        .eq("id", idSelecionado);

      if (updateError) throw updateError;

      // Sucesso
      queryClient.invalidateQueries({ queryKey: ["ocorrencias"] });
      fecharModal();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmarDesbaixa = async () => {
    if (!idSelecionado) return;
    setLoading(true);
    setError(null);
    try {
      const { error: updateError } = await supabase
        .from("ocorrencias")
        .update({ 
          status: "PENDENTE",
          data_baixa: null,
          baixado_por: null,
          baixado_em: null
        })
        .eq("id", idSelecionado);

      if (updateError) throw updateError;

      // Sucesso
      queryClient.invalidateQueries({ queryKey: ["ocorrencias"] });
      fecharModal();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div 
        className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" 
        onClick={fecharModal} 
      />
      
      <div className="relative bg-surface-container-lowest border border-outline-variant rounded-[1rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-6 border-b border-outline-variant flex justify-between items-center">
          <h3 className="text-xl font-black text-on-surface tracking-tight uppercase">
            {modalAberto.replace(/_/g, ' ')}
          </h3>
          <button 
            onClick={fecharModal}
            className="p-2 hover:bg-surface-container-low rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-on-surface-variant" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 max-h-[85vh] overflow-y-auto">
          {error && <div className="bg-error-container text-error p-4 rounded-md text-xs font-bold mb-4 border border-error/20">{error}</div>}

          {modalAberto === 'CRIAR_LANCAMENTO' && <FormCriarLancamento />}
          {modalAberto === 'EDITAR_LANCAMENTO' && <FormEditarLancamento />}
          {modalAberto === 'DUPLICAR_LANCAMENTO' && <FormDuplicarLancamento />}
          {(modalAberto === 'CRIAR_CATEGORIA' || modalAberto === 'EDITAR_CATEGORIA') && <FormCategoria />}
          {(modalAberto === 'CRIAR_CONTATO' || modalAberto === 'EDITAR_CONTATO') && <FormContato />}
          {(modalAberto === 'CRIAR_LOCAL_PAGAMENTO' || modalAberto === 'EDITAR_LOCAL_PAGAMENTO') && <FormLocalPagamento />}
          {modalAberto === 'EXCLUIR_LANCAMENTO' && <ModalExcluirLancamento />}

          {modalAberto === 'BAIXAR' && (
            <div className="space-y-6 text-center">
              <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h4 className="text-2xl font-black text-on-surface tracking-tighter">Confirmar Baixa?</h4>
                <p className="text-on-surface-variant font-medium">Você está confirmando o pagamento desta conta. Esta ação registrará a data e hora atual.</p>
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  onClick={fecharModal}
                  disabled={loading}
                  className="flex-1 px-6 py-3 border border-outline-variant rounded-md font-bold text-on-surface hover:bg-surface-container-low transition-all disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleConfirmarBaixa}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-primary text-on-primary rounded-md font-bold hover:opacity-90 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirmar Pagamento"}
                </button>
              </div>
            </div>
          )}

          {modalAberto === 'DESBAIXAR' && (
            <div className="space-y-6 text-center">
              <div className="w-20 h-20 bg-amber-500/10 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                <RotateCcw className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h4 className="text-2xl font-black text-on-surface tracking-tighter">Reverter Baixa?</h4>
                <p className="text-on-surface-variant font-medium">Você está desmarcando o pagamento desta conta. O status voltará para "Pendente".</p>
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  onClick={fecharModal}
                  disabled={loading}
                  className="flex-1 px-6 py-3 border border-outline-variant rounded-md font-bold text-on-surface hover:bg-surface-container-low transition-all disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleConfirmarDesbaixa}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-amber-600 text-white rounded-md font-bold hover:opacity-90 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirmar Reversão"}
                </button>
              </div>
            </div>
          )}

          {!['BAIXAR', 'DESBAIXAR', 'EXCLUIR_LANCAMENTO', 'CRIAR_LANCAMENTO', 'EDITAR_LANCAMENTO', 'DUPLICAR_LANCAMENTO', 'CRIAR_CATEGORIA', 'EDITAR_CATEGORIA', 'CRIAR_CONTATO', 'EDITAR_CONTATO', 'CRIAR_LOCAL_PAGAMENTO', 'EDITAR_LOCAL_PAGAMENTO'].includes(modalAberto) && (
            <div className="py-12 text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-outline mx-auto" />
              <p className="font-bold text-on-surface-variant">Este formulário ({modalAberto}) está sendo preparado.</p>
              <button 
                onClick={fecharModal}
                className="px-8 py-2 bg-surface-container text-on-surface rounded-md font-bold text-sm"
              >
                Fechar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
