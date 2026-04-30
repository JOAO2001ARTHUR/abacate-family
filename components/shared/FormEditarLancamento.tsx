"use client";

import { useState, useEffect } from "react";
import { useCategorias } from "@/hooks/useCategorias";
import { useContatos } from "@/hooks/useContatos";
import { useLocaisPagamento } from "@/hooks/useLocaisPagamento";
import { useLancamento } from "@/hooks/useLancamentos";
import { useUIStore } from "@/stores/useUIStore";
import { 
  ArrowRight, 
  Loader2, 
  DollarSign,
  Tag,
  User,
  AlertCircle,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ModalEscopoEdicao } from "./ModalEscopoEdicao";
import { FormCriarCategoriaInline, FormCriarContatoInline, FormCriarLocalPagamentoInline } from "./FormEntidadesInline";

export function FormEditarLancamento() {
  const { idSelecionado, fecharModal } = useUIStore();
  const [regraId] = (idSelecionado || "").split(":");
  const { data: lancamento, isLoading: isLoadingLanc } = useLancamento(regraId || idSelecionado);
  const { data: categorias } = useCategorias();
  const { data: contatos } = useContatos();
  const { data: locaisPagamento } = useLocaisPagamento();

  const [nome, setNome] = useState("");
  const [natureza, setNatureza] = useState<"ENTRADA" | "SAIDA">("SAIDA");
  const [categoriaId, setCategoriaId] = useState("");
  const [contatoId, setContatoId] = useState("");
  const [valorBase, setValorBase] = useState("");
  const [tipo, setTipo] = useState<"ESPORADICA" | "FIXA" | "PARCELA">("ESPORADICA");
  const [totalParcelas, setTotalParcelas] = useState("1");
  const [localPagamentoId, setLocalPagamentoId] = useState("");
  
  const [showAddCategoria, setShowAddCategoria] = useState(false);
  const [showAddContato, setShowAddContato] = useState(false);
  const [showAddLocal, setShowAddLocal] = useState(false);
  
  const [showEscopo, setShowEscopo] = useState(false);
  const [dadosParaSalvar, setDadosParaSalvar] = useState<any>(null);

  useEffect(() => {
    if (lancamento) {
      setNome(lancamento.nome);
      setNatureza(lancamento.natureza);
      setCategoriaId(lancamento.categoria_id);
      setContatoId(lancamento.contato_id || "");
      setValorBase(lancamento.valor_base.toString());
      setTipo(lancamento.tipo);
      setTotalParcelas(lancamento.total_parcelas?.toString() || "1");
      setLocalPagamentoId(lancamento.local_pagamento_id || "");
    }
  }, [lancamento]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const dados = {
      nome,
      natureza,
      categoria_id: categoriaId,
      contato_id: contatoId || null,
      local_pagamento_id: localPagamentoId || null,
      valor_base: parseFloat(valorBase),
      tipo,
      total_parcelas: tipo === "PARCELA" ? parseInt(totalParcelas) : null,
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
    <div className="relative min-h-[500px]">
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

      {showAddLocal && (
        <FormCriarLocalPagamentoInline 
          onSucesso={(id) => { setLocalPagamentoId(id); setShowAddLocal(false); }} 
          onCancelar={() => setShowAddLocal(false)} 
        />
      )}

      {!showAddCategoria && !showAddContato && !showAddLocal && (
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
              {categorias?.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest flex justify-between items-center">
            Contato
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

      {/* Onde pagar (Local de Pagamento) */}
      <div className="space-y-2">
        <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest flex justify-between items-center">
          Onde Pagar / Banco
          <button type="button" onClick={() => setShowAddLocal(true)} className="text-primary hover:text-primary-container transition-colors">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </label>
        <div className="relative group">
          <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/60 group-focus-within:text-primary transition-colors" />
          <select 
            value={localPagamentoId}
            onChange={(e) => setLocalPagamentoId(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-primary/5 border border-primary/20 rounded-md focus:border-primary outline-none transition-all text-sm font-black appearance-none text-on-surface"
          >
            <option value="">Selecionar banco/local...</option>
            {locaisPagamento?.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
          </select>
        </div>
      </div>

      {/* Tipo de Lançamento */}
      <div className="space-y-4 pt-4 border-t border-outline-variant">
        <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest block">Tipo de Recorrência</label>
        <div className="flex gap-4">
          {[
            { id: "ESPORADICA", label: "Único" },
            { id: "PARCELA", label: "Parcelado" },
            { id: "FIXA", label: "Mensal" }
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTipo(t.id as any)}
              className={cn(
                "flex-1 px-4 py-2 rounded-md text-[10px] font-black uppercase tracking-widest border transition-all",
                tipo === t.id 
                  ? "bg-primary-container text-on-primary border-primary shadow-sm" 
                  : "bg-surface text-on-surface-variant border-outline-variant hover:border-primary"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tipo === "PARCELA" && (
          <div className="space-y-2 animate-in fade-in duration-300">
            <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Número total de Parcelas</label>
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
      )}
    </div>
  );
}
