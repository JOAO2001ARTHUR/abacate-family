"use client";

import { useState } from "react";
import { useUpdateLancamento } from "@/hooks/useLancamentos";
import { useUIStore } from "@/stores/useUIStore";
import { 
  Check, 
  ArrowLeft, 
  Loader2, 
  AlertTriangle,
  History,
  FastForward,
  PlayCircle,
  Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  lancamentoId: string;
  tipoLancamento: string;
  dados: any;
  onBack: () => void;
}

export function ModalEscopoEdicao({ lancamentoId, tipoLancamento, dados, onBack }: Props) {
  const { idSelecionado: idOcorrenciaRef, fecharModal } = useUIStore();
  const updateLancamento = useUpdateLancamento();
  
  const [escopo, setEscopo] = useState<string>("ESTE_E_PROXIMOS");

  const opcoes = [
    { 
      id: "APENAS_ESTE", 
      titulo: "Apenas este", 
      desc: "Altera somente esta ocorrência específica.", 
      icon: <Calendar className="w-5 h-5" />,
      alerta: false 
    },
    { 
      id: "ESTE_E_PROXIMOS", 
      titulo: "Este e os próximos", 
      desc: "Altera a ocorrência atual e todas as futuras.", 
      icon: <FastForward className="w-5 h-5" />,
      alerta: false 
    },
    { 
      id: "ESTE_E_ANTERIORES", 
      titulo: "Este e os anteriores", 
      desc: "Altera a atual e as passadas (Histórico).", 
      icon: <History className="w-5 h-5" />,
      alerta: true 
    },
    { 
      id: "TODOS", 
      titulo: "Toda a série", 
      desc: "Altera todas as ocorrências deste lançamento.", 
      icon: <PlayCircle className="w-5 h-5" />,
      alerta: true 
    },
  ];

  // Se for único, simplificamos
  const opcoesFiltradas = tipoLancamento === "ESPORADICA" 
    ? [opcoes[0]] 
    : opcoes;

  const handleSalvar = async () => {
    try {
      await updateLancamento.mutateAsync({
        id: lancamentoId,
        data: {
          ...dados,
          escopo,
          idOcorrenciaRef,
        }
      });
      fecharModal();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-right-10 duration-500">
      <div className="space-y-2">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao formulário
        </button>
        <h4 className="text-2xl font-black text-on-surface tracking-tighter">Qual o escopo da edição?</h4>
        <p className="text-on-surface-variant font-medium text-sm">Escolha como as mudanças serão aplicadas nas parcelas deste lançamento.</p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {opcoesFiltradas.map((op) => (
          <button
            key={op.id}
            onClick={() => setEscopo(op.id)}
            className={cn(
              "flex items-start gap-4 p-5 rounded-xl border-2 transition-all text-left group",
              escopo === op.id 
                ? "bg-primary-fixed/20 border-primary shadow-md" 
                : "bg-surface-container-low border-outline-variant hover:border-primary/40"
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
              escopo === op.id ? "bg-primary text-on-primary" : "bg-surface-container-highest text-outline"
            )}>
              {op.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-black text-on-surface uppercase tracking-tight text-sm">{op.titulo}</span>
                {escopo === op.id && <Check className="w-5 h-5 text-primary" />}
              </div>
              <p className="text-xs font-medium text-on-surface-variant leading-relaxed mt-1">{op.desc}</p>
              
              {op.alerta && escopo === op.id && (
                <div className="mt-3 p-3 bg-error-container/50 border border-error/20 rounded-md flex items-center gap-2 animate-in fade-in zoom-in-95 duration-300">
                  <AlertTriangle className="w-4 h-4 text-error shrink-0" />
                  <p className="text-[10px] font-bold text-error leading-tight uppercase">
                    Atenção: Isso alterará registros passados já concluídos.
                  </p>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      <button 
        disabled={updateLancamento.isPending}
        onClick={handleSalvar}
        className="w-full bg-primary text-on-primary py-4 rounded-xl font-black text-sm flex items-center justify-center gap-3 hover:opacity-90 transition-all shadow-xl disabled:opacity-50"
      >
        {updateLancamento.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : "Confirmar e Salvar Alterações"}
      </button>
    </div>
  );
}
