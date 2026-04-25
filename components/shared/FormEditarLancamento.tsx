"use client";

import { useState, useEffect } from "react";
import { useCategorias } from "@/hooks/useCategorias";
import { useContatos } from "@/hooks/useContatos";
import { useLancamento } from "@/hooks/useLancamentos";
import { useUIStore } from "@/stores/useUIStore";
import { 
  ArrowRight, 
  Loader2, 
  DollarSign,
  Tag,
  User,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ModalEscopoEdicao } from "./ModalEscopoEdicao";

export function FormEditarLancamento() {
  const { idSelecionado, fecharModal } = useUIStore();
  const { data: lancamento, isLoading: isLoadingLanc } = useLancamento(idSelecionado);
  const { data: categorias } = useCategorias();
  const { data: contatos } = useContatos();

  const [nome, setNome] = useState("");
  const [natureza, setNatureza] = useState<"ENTRADA" | "SAIDA">("SAIDA");
  const [categoriaId, setCategoriaId] = useState("");
  const [contatoId, setContatoId] = useState("");
  const [valorBase, setValorBase] = useState("");
  
  const [showEscopo, setShowEscopo] = useState(false);
  const [dadosParaSalvar, setDadosParaSalvar] = useState<any>(null);

  useEffect(() => {
    if (lancamento) {
      setNome(lancamento.nome);
      setNatureza(lancamento.natureza);
      setCategoriaId(lancamento.categoria_id);
      setContatoId(lancamento.contato_id || "");
      setValorBase(lancamento.valor_base.toString());
    }
  }, [lancamento]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const dados = {
      nome,
      natureza,
      categoria_id: categoriaId,
      contato_id: contatoId || null,
      valor_base: parseFloat(valorBase),
    };

    if (lancamento?.tipo === "ESPORADICA") {
      // Se for único, o escopo é implícito (APENAS_ESTE)
      setDadosParaSalvar({ ...dados, escopo: "APENAS_ESTE", idOcorrenciaRef: idSelecionado });
      setShowEscopo(true); // Ainda mostramos para confirmação ou podemos pular
    } else {
      setDadosParaSalvar(dados);
      setShowEscopo(true);
    }
  };

  if (isLoadingLanc) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-4 text-outline animate-pulse">
        <Loader2 className="w-10 h-10 animate-spin" />
        <p className="text-xs font-black uppercase tracking-widest">Carregando Dados...</p>
      </div>
    );
  }

  if (showEscopo && dadosParaSalvar && lancamento) {
    return (
      <ModalEscopoEdicao 
        lancamentoId={lancamento.id}
        tipoLancamento={lancamento.tipo}
        dados={dadosParaSalvar}
        onBack={() => setShowEscopo(false)}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-500">
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
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-md focus:border-primary-container outline-none transition-all text-sm font-bold"
          />
        </div>
      </div>

      {/* Valor */}
      <div className="space-y-2">
        <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Valor Base</label>
        <div className="relative">
          <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
          <input 
            type="number" 
            step="0.01"
            required
            value={valorBase}
            onChange={(e) => setValorBase(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-md focus:border-primary-container outline-none transition-all text-sm font-black tnum"
          />
        </div>
      </div>

      {/* Categoria & Contato */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Categoria</label>
          <div className="relative group">
            <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/60 group-focus-within:text-primary transition-colors" />
            <select 
              required
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-primary/5 border border-primary/20 rounded-md focus:border-primary outline-none transition-all text-sm font-black appearance-none text-on-surface"
            >
              {categorias?.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Contato</label>
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

      <div className="p-4 bg-primary-fixed/10 border border-primary/10 rounded-md flex gap-4 items-center">
        <AlertCircle className="w-5 h-5 text-primary-container" />
        <p className="text-[10px] font-bold text-primary-container leading-relaxed">
          Você está editando a regra principal do lançamento. Na próxima etapa, você escolherá quais parcelas serão afetadas.
        </p>
      </div>

      <button 
        className="w-full bg-primary-container text-on-primary py-4 rounded-xl font-black text-sm flex items-center justify-center gap-3 hover:opacity-90 transition-all shadow-xl"
      >
        Continuar para Escopo <ArrowRight className="w-5 h-5" />
      </button>
    </form>
  );
}
