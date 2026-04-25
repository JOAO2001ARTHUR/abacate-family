"use client";

import { useState } from "react";
import { X, CheckCircle2, Loader2 } from "lucide-react";
import { formatarMoeda, formatarData } from "@/lib/utils";
import { useOcorrencias } from "@/hooks/useOcorrencias";
import { api } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";

interface ModalBaixaProps {
  id: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ModalBaixa({ id, onClose, onSuccess }: ModalBaixaProps) {
  const queryClient = useQueryClient();
  const { data: ocorrencias } = useOcorrencias();
  const ocorrencia = ocorrencias?.find(o => o.id === id);

  const [dataBaixa, setDataBaixa] = useState(new Date().toISOString().split('T')[0]);
  const [observacao, setObservacao] = useState("");
  const [loading, setLoading] = useState(false);

  if (!ocorrencia) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await api.put(`/ocorrencias/${id}/baixar`, { 
        data_baixa: dataBaixa, 
        observacao 
      });
      queryClient.invalidateQueries({ queryKey: ['ocorrencias'] });
      onSuccess();
    } catch (error) {
      console.error("Erro ao baixar ocorrência:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card border-2 border-emerald-100 rounded-2xl shadow-2xl p-6 w-full max-w-md animate-in fade-in zoom-in duration-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-emerald-600">
          <CheckCircle2 className="w-6 h-6" />
          <h3 className="text-xl font-black text-slate-900">Confirmar Baixa</h3>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4 mb-8">
        <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
          <p className="text-[10px] text-emerald-700 uppercase font-black tracking-widest mb-1">Lançamento</p>
          <p className="font-black text-lg text-slate-900">{ocorrencia.nome}</p>
          <div className="flex justify-between mt-3 pt-3 border-t border-emerald-100/50">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-black">Vencimento</p>
              <p className="font-bold text-slate-700">{formatarData(ocorrencia.data_vencimento)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground uppercase font-black">Valor</p>
              <p className="font-black text-lg text-emerald-600">{formatarMoeda(ocorrencia.valor_editado ?? ocorrencia.valor)}</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Data da Baixa</label>
          <input
            type="date"
            value={dataBaixa}
            onChange={(e) => setDataBaixa(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border-transparent focus:border-emerald-500 focus:bg-white rounded-xl outline-none transition-all font-bold"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Observação (Opcional)</label>
          <textarea
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Ex: Paguei com desconto, via PIX..."
            rows={3}
            className="w-full px-4 py-3 bg-slate-50 border-transparent focus:border-emerald-500 focus:bg-white rounded-xl outline-none resize-none transition-all font-medium"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleConfirm}
          disabled={loading}
          className="flex-1 px-4 py-3 rounded-xl font-black bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          CONFIRMAR BAIXA
        </button>
      </div>
    </div>
  );
}
