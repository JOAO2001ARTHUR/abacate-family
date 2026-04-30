
"use client";

import { useState } from "react";
import { useUIStore } from "@/stores/useUIStore";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  Trash2, 
  X, 
  Check, 
  AlertTriangle,
  History,
  FastForward,
  PlayCircle,
  Calendar,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

export function ModalExcluirLancamento() {
  const { idSelecionado, fecharModal } = useUIStore();
  const [regraId, idOcorrenciaRef] = (idSelecionado || "").split(":");
  const queryClient = useQueryClient();
  
  const [escopo, setEscopo] = useState<string>("APENAS_ESTE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const opcoes = [
    { 
      id: "APENAS_ESTE", 
      titulo: "Apenas este", 
      desc: "Remove somente esta ocorrência específica.", 
      icon: <Calendar className="w-5 h-5" />,
      alerta: false 
    },
    { 
      id: "ESTE_E_PROXIMOS", 
      titulo: "Este e os próximos", 
      desc: "Remove a ocorrência atual e todas as futuras.", 
      icon: <FastForward className="w-5 h-5" />,
      alerta: true 
    },
    { 
      id: "ESTE_E_ANTERIORES", 
      titulo: "Este e os anteriores", 
      desc: "Remove a atual e as passadas (Histórico).", 
      icon: <History className="w-5 h-5" />,
      alerta: true 
    },
    { 
      id: "TODOS", 
      titulo: "Toda a série", 
      desc: "Remove todas as ocorrências e desativa o lançamento.", 
      icon: <PlayCircle className="w-5 h-5" />,
      alerta: true 
    },
  ];

  const handleExcluir = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/lancamentos/${regraId}?escopo=${escopo}&idOcorrenciaRef=${idOcorrenciaRef}`);
      queryClient.invalidateQueries({ queryKey: ["ocorrencias"] });
      fecharModal();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <div className="w-12 h-12 bg-error/10 text-error rounded-full flex items-center justify-center mb-4">
          <Trash2 className="w-6 h-6" />
        </div>
        <h4 className="text-2xl font-black text-on-surface tracking-tighter uppercase">Excluir Lançamento?</h4>
        <p className="text-on-surface-variant font-medium text-sm">Esta ação é irreversível. Como você deseja aplicar a exclusão?</p>
      </div>

      {error && (
        <div className="bg-error-container text-error p-4 rounded-md text-xs font-bold border border-error/20 animate-in shake duration-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        {opcoes.map((op) => (
          <button
            key={op.id}
            onClick={() => setEscopo(op.id)}
            className={cn(
              "flex items-start gap-4 p-5 rounded-xl border-2 transition-all text-left group",
              escopo === op.id 
                ? "bg-error-container/20 border-error shadow-md" 
                : "bg-surface-container-low border-outline-variant hover:border-error/30"
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
              escopo === op.id ? "bg-error text-on-error" : "bg-surface-container-highest text-outline"
            )}>
              {op.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-black text-on-surface uppercase tracking-tight text-sm">{op.titulo}</span>
                {escopo === op.id && <Check className="w-5 h-5 text-error" />}
              </div>
              <p className="text-xs font-medium text-on-surface-variant leading-relaxed mt-1">{op.desc}</p>
              
              {op.alerta && escopo === op.id && (
                <div className="mt-3 p-3 bg-error-container/50 border border-error/20 rounded-md flex items-center gap-2 animate-in fade-in zoom-in-95 duration-300">
                  <AlertTriangle className="w-4 h-4 text-error shrink-0" />
                  <p className="text-[10px] font-bold text-error leading-tight uppercase">
                    Atenção: Isso afetará múltiplas parcelas.
                  </p>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="flex gap-4">
        <button 
          onClick={fecharModal}
          disabled={loading}
          className="flex-1 px-6 py-4 border border-outline-variant rounded-xl font-black text-sm text-on-surface hover:bg-surface-container-low transition-all disabled:opacity-50"
        >
          Manter Lançamento
        </button>
        <button 
          disabled={loading}
          onClick={handleExcluir}
          className="flex-1 bg-error text-on-error py-4 rounded-xl font-black text-sm flex items-center justify-center gap-3 hover:opacity-90 transition-all shadow-xl disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Confirmar Exclusão"}
        </button>
      </div>
    </div>
  );
}
