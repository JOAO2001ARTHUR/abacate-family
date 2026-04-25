"use client";

import { X, AlertTriangle, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

type Escopo = 'APENAS_ESTE' | 'ESTE_E_PROXIMOS' | 'ESTE_E_ANTERIORES' | 'TODOS';

interface ModalConfirmarEscopoProps {
  onClose: () => void;
  onConfirm: (escopo: Escopo) => void;
  isLoading?: boolean;
}

export function ModalConfirmarEscopo({ onClose, onConfirm, isLoading }: ModalConfirmarEscopoProps) {
  const [escopo, setEscopo] = useState<Escopo>('ESTE_E_PROXIMOS');

  const options: { id: Escopo; label: string; desc: string; warning?: boolean }[] = [
    { 
      id: 'APENAS_ESTE', 
      label: 'Apenas este mês', 
      desc: 'Altera somente a ocorrência selecionada sem afetar as demais.' 
    },
    { 
      id: 'ESTE_E_PROXIMOS', 
      label: 'Este e os próximos', 
      desc: 'Atualiza o lançamento atual e todos os futuros parcelamentos/recorrências.' 
    },
    { 
      id: 'ESTE_E_ANTERIORES', 
      label: 'Este e os anteriores', 
      desc: 'Atualiza o atual e todo o histórico passado deste lançamento.',
      warning: true
    },
    { 
      id: 'TODOS', 
      label: 'Todos os lançamentos', 
      desc: 'Altera absolutamente todas as parcelas e recorrências vinculadas.',
      warning: true
    },
  ];

  return (
    <div className="bg-card border-2 border-primary/20 rounded-2xl shadow-2xl p-6 w-full max-w-lg animate-in fade-in zoom-in duration-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3 text-primary">
          <AlertTriangle className="w-6 h-6" />
          <h3 className="text-xl font-black text-slate-900">Aplicar alteração em...</h3>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-3 mb-8">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setEscopo(opt.id)}
            className={cn(
              "w-full text-left p-4 rounded-xl border-2 transition-all flex flex-col gap-1",
              escopo === opt.id 
                ? "bg-primary/5 border-primary shadow-sm" 
                : "bg-white border-slate-100 hover:border-slate-300"
            )}
          >
            <div className="flex items-center justify-between">
              <span className={cn(
                "text-sm font-black uppercase tracking-widest",
                escopo === opt.id ? "text-primary" : "text-slate-900"
              )}>
                {opt.label}
              </span>
              {escopo === opt.id && <div className="w-2 h-2 rounded-full bg-primary" />}
            </div>
            <p className="text-xs font-medium text-muted-foreground">{opt.desc}</p>
          </button>
        ))}
      </div>

      {/* Aviso Obrigatório para histórico */}
      {(escopo === 'ESTE_E_ANTERIORES' || escopo === 'TODOS') && (
        <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs font-bold text-amber-800 leading-relaxed">
            Atenção: esta ação irá alterar ocorrências já baixadas (pagas). 
            O valor registrado nos pagamentos passados será atualizado.
          </p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={() => onConfirm(escopo)}
          disabled={isLoading}
          className="flex-1 px-4 py-3 rounded-xl font-black bg-primary text-white hover:bg-primary/90 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          CONFIRMAR ALTERAÇÃO
        </button>
      </div>
    </div>
  );
}
