"use client";

import { useState } from "react";
import { useCategorias } from "@/hooks/useCategorias";
import { useContatos } from "@/hooks/useContatos";
import { createClient } from "@/utils/supabase/client";
import { useUIStore } from "@/stores/useUIStore";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Plus, 
  ArrowRight, 
  Loader2, 
  Calendar, 
  DollarSign,
  Tag,
  User,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FormCriarCategoriaInline, FormCriarContatoInline } from "./FormEntidadesInline";

export function FormCriarLancamento() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { fecharModal } = useUIStore();
  
  const { data: categorias } = useCategorias();
  const { data: contatos } = useContatos();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sub-form states
  const [showAddCategoria, setShowAddCategoria] = useState(false);
  const [showAddContato, setShowAddContato] = useState(false);

  // Form State
  const [nome, setNome] = useState("");
  const [natureza, setNatureza] = useState<"ENTRADA" | "SAIDA">("SAIDA");
  const [tipo, setTipo] = useState<"ESPORADICA" | "FIXA" | "PARCELA">("ESPORADICA");
  const [categoriaId, setCategoriaId] = useState("");
  const [contatoId, setContatoId] = useState("");
  const [valorBase, setValorBase] = useState("");
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split('T')[0]);
  const [totalParcelas, setTotalParcelas] = useState("1");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoriaId) {
      setError("Selecione ou crie uma categoria.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado.");

      const { data: lancamento, error: lError } = await supabase
        .from("lancamentos")
        .insert({
          user_id: user.id,
          nome,
          natureza,
          tipo,
          categoria_id: categoriaId,
          contato_id: contatoId || null,
          valor_base: parseFloat(valorBase),
          data_inicio: dataInicio,
          total_parcelas: tipo === "PARCELA" ? parseInt(totalParcelas) : null,
        })
        .select()
        .single();

      if (lError) throw lError;

      const numOcorrencias = tipo === "PARCELA" ? parseInt(totalParcelas) : 1;
      const ocorrenciasData = [];

      for (let i = 0; i < numOcorrencias; i++) {
        const dataVenc = new Date(dataInicio);
        dataVenc.setMonth(dataVenc.getMonth() + i);
        
        ocorrenciasData.push({
          lancamento_id: lancamento.id,
          numero_parcela: tipo === "PARCELA" ? i + 1 : null,
          data_vencimento: dataVenc.toISOString().split('T')[0],
          data_competencia: dataVenc.toISOString().split('T')[0],
          valor: parseFloat(valorBase),
          status: "PENDENTE",
        });
      }

      const { error: oError } = await supabase.from("ocorrencias").insert(ocorrenciasData);
      if (oError) throw oError;

      queryClient.invalidateQueries({ queryKey: ["ocorrencias"] });
      fecharModal();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[500px]">
      {/* Inline Forms Overlay - High Fidelity */}
      {showAddCategoria && (
        <FormCriarCategoriaInline 
          onSucesso={(id) => { setCategoriaId(id); setShowAddCategoria(false); }} 
          onCancelar={() => setShowAddCategoria(false)} 
        />
      )}

      {showAddContato && (
        <FormCriarContatoInline 
          onSucesso={(id) => { setContatoId(id); setShowAddContato(false); }} 
          onCancelar={() => setShowAddContato(false)} 
        />
      )}

      {!showAddCategoria && !showAddContato && (
        <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-500">
          {error && (
            <div className="bg-error-container text-error p-4 rounded-xl text-xs font-bold border border-error/20">
              {error}
            </div>
          )}

          {/* Natureza & Nome */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Natureza</label>
              <div className="flex bg-surface-container-low p-1 rounded-md">
                <button 
                  type="button"
                  onClick={() => setNatureza("ENTRADA")}
                  className={cn(
                    "flex-1 py-2 text-xs font-black uppercase tracking-tighter rounded-sm transition-all",
                    natureza === "ENTRADA" ? "bg-primary-container text-on-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                  )}
                >
                  Entrada
                </button>
                <button 
                  type="button"
                  onClick={() => setNatureza("SAIDA")}
                  className={cn(
                    "flex-1 py-2 text-xs font-black uppercase tracking-tighter rounded-sm transition-all",
                    natureza === "SAIDA" ? "bg-error text-on-error shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                  )}
                >
                  Saída
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Descrição</label>
              <input 
                type="text" 
                required
                placeholder="Ex: Aluguel, Salário..."
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-md focus:border-primary-container outline-none transition-all text-sm font-bold"
              />
            </div>
          </div>

          {/* Valor & Data */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Valor</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
                <input 
                  type="number" 
                  step="0.01"
                  required
                  placeholder="0,00"
                  value={valorBase}
                  onChange={(e) => setValorBase(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-md focus:border-primary-container outline-none transition-all text-sm font-black tnum"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Data de Início</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
                <input 
                  type="date" 
                  required
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-md focus:border-primary-container outline-none transition-all text-sm font-bold"
                />
              </div>
            </div>
          </div>

          {/* Categoria & Contato com Botões "+" */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest flex justify-between items-center">
                Categoria
                <button type="button" onClick={() => setShowAddCategoria(true)} className="text-primary hover:text-primary-container transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </label>
              <div className="relative group">
                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/60 group-focus-within:text-primary transition-colors" />
                <select 
                  required
                  value={categoriaId}
                  onChange={(e) => setCategoriaId(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-primary/5 border border-primary/20 rounded-md focus:border-primary outline-none transition-all text-sm font-black appearance-none text-on-surface"
                >
                  <option value="">Selecionar...</option>
                  {categorias?.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest flex justify-between items-center">
                Contato (Opcional)
                <button type="button" onClick={() => setShowAddContato(true)} className="text-primary hover:text-primary-container transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/60 group-focus-within:text-primary transition-colors" />
                <select 
                  value={contatoId}
                  onChange={(e) => setContatoId(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-primary/5 border border-primary/20 rounded-md focus:border-primary outline-none transition-all text-sm font-black appearance-none text-on-surface"
                >
                  <option value="">Nenhum...</option>
                  {contatos?.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Tipo de Lançamento */}
          <div className="space-y-4 pt-4 border-t border-outline-variant">
            <div className="flex gap-4">
              {["ESPORADICA", "PARCELA", "FIXA"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTipo(t as any)}
                  className={cn(
                    "flex-1 px-4 py-2 rounded-md text-[10px] font-black uppercase tracking-widest border transition-all",
                    tipo === t 
                      ? "bg-primary-container text-on-primary border-primary shadow-sm" 
                      : "bg-surface text-on-surface-variant border-outline-variant hover:border-primary"
                  )}
                >
                  {t === "ESPORADICA" ? "Único" : t === "PARCELA" ? "Parcelado" : "Mensal"}
                </button>
              ))}
            </div>

            {tipo === "PARCELA" && (
              <div className="space-y-2 animate-in fade-in duration-300">
                <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Número de Parcelas</label>
                <input 
                  type="number" 
                  min="1"
                  required
                  value={totalParcelas}
                  onChange={(e) => setTotalParcelas(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-md focus:border-primary-container outline-none transition-all text-sm font-bold"
                />
              </div>
            )}

            {tipo === "FIXA" && (
              <div className="p-4 bg-primary-fixed/20 border border-primary/10 rounded-md flex gap-4 items-center animate-in fade-in duration-300">
                <Info className="w-5 h-5 text-primary-container" />
                <p className="text-[10px] font-bold text-primary-container leading-relaxed">
                  O sistema gerará este lançamento automaticamente todos os meses até que você o finalize manualmente.
                </p>
              </div>
            )}
          </div>

          <button 
            disabled={loading}
            className="w-full bg-primary-container text-on-primary py-4 rounded-xl font-black text-sm flex items-center justify-center gap-3 hover:opacity-90 transition-all shadow-xl disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Criar Lançamento <ArrowRight className="w-5 h-5" /></>}
          </button>
        </form>
      )}
    </div>
  );
}
