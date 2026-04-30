"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useUIStore } from "@/stores/useUIStore";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Plus, 
  Loader2, 
  ArrowRight,
  Palette,
  LayoutGrid,
  Mail,
  User,
  Trash2,
  Save,
  MapPin
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCategorias } from "@/hooks/useCategorias";
import { useContatos } from "@/hooks/useContatos";
import { useLocaisPagamento } from "@/hooks/useLocaisPagamento";

// --- CATEGORIA FORM ---
interface FormCategoriaProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function FormCategoria({ onSuccess, onCancel }: FormCategoriaProps = {}) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { fecharModal, idSelecionado } = useUIStore();
  const { data: categorias } = useCategorias();

  const [nome, setNome] = useState("");
  const [cor, setCor] = useState("#397c2d");
  const [icone, setIcone] = useState("category");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!idSelecionado;

  useEffect(() => {
    if (isEdit && categorias) {
      const cat = categorias.find(c => c.id === idSelecionado);
      if (cat) {
        setNome(cat.nome);
        setCor(cat.cor);
        setIcone(cat.icone || "category");
      }
    }
  }, [isEdit, categorias, idSelecionado]);

  const iconesSet = ["category", "home", "shopping_cart", "restaurant", "local_gas_station", "medical_services", "school", "flight", "payments", "trending_up"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (isEdit) {
        const { error } = await supabase
          .from("categorias")
          .update({ nome, cor, icone })
          .eq("id", idSelecionado)
          .eq("user_id", user?.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("categorias")
          .insert({ user_id: user?.id, nome, cor, icone });
        if (error) throw error;
      }
      queryClient.invalidateQueries({ queryKey: ["categorias"] });
      if (onSuccess) onSuccess();
      else fecharModal();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Deseja realmente excluir esta categoria?")) return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("categorias")
        .delete()
        .eq("id", idSelecionado)
        .eq("user_id", user?.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["categorias"] });
      fecharModal();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in duration-500">
      {error && <div className="bg-error-container text-error p-4 rounded-md text-xs font-bold border border-error/20">{error}</div>}
      
      <div className="space-y-2">
        <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Nome da Categoria</label>
        <input 
          autoFocus
          required
          placeholder="Ex: Alimentação, Lazer..."
          value={nome}
          onChange={e => setNome(e.target.value)}
          className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-md text-sm font-bold outline-none focus:border-primary-container transition-all"
        />
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Cor de Destaque</label>
          <div className="flex items-center gap-4 bg-surface-container-low p-2 rounded-md border border-outline-variant">
            <input 
              type="color" 
              value={cor}
              onChange={e => setCor(e.target.value)}
              className="w-10 h-10 rounded-md cursor-pointer border-none bg-transparent"
            />
            <span className="text-xs font-black text-on-surface tnum">{cor.toUpperCase()}</span>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Símbolo Visual</label>
          <div className="flex flex-wrap gap-2">
            {iconesSet.map(i => (
              <button 
                key={i}
                type="button"
                onClick={() => setIcone(i)}
                className={cn(
                  "w-10 h-10 rounded-md flex items-center justify-center transition-all border",
                  icone === i ? "bg-primary-container text-on-primary border-primary" : "bg-surface-container-low text-on-surface-variant border-outline-variant hover:border-primary"
                )}
              >
                <span className="material-symbols-outlined text-xl">{i}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        {isEdit && (
          <button type="button" onClick={handleDelete} disabled={loading} className="px-6 py-4 border border-error/30 text-error rounded-xl font-bold hover:bg-error/10 transition-all disabled:opacity-50">
            <Trash2 className="w-5 h-5" />
          </button>
        )}
        {onCancel && (
          <button type="button" onClick={onCancel} disabled={loading} className="px-6 py-4 border border-outline-variant rounded-xl font-bold text-on-surface hover:bg-surface-container-low transition-all disabled:opacity-50">
            Cancelar
          </button>
        )}
        <button disabled={loading} className="flex-1 bg-primary-container text-on-primary py-4 rounded-xl font-black text-sm flex items-center justify-center gap-3 hover:opacity-90 transition-all shadow-xl disabled:opacity-50">
          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : isEdit ? <>Salvar Alterações <Save className="w-5 h-5" /></> : <>Criar Categoria <Plus className="w-5 h-5" /></>}
        </button>
      </div>
    </form>
  );
}

// --- CONTATO FORM ---
interface FormContatoProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function FormContato({ onSuccess, onCancel }: FormContatoProps = {}) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { fecharModal, idSelecionado } = useUIStore();
  const { data: contatos } = useContatos();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!idSelecionado;

  useEffect(() => {
    if (isEdit && contatos) {
      const c = contatos.find(c => c.id === idSelecionado);
      if (c) {
        setNome(c.nome);
        setEmail(c.email || "");
      }
    }
  }, [isEdit, contatos, idSelecionado]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (isEdit) {
        const { error } = await supabase
          .from("contatos")
          .update({ nome, email: email || null })
          .eq("id", idSelecionado)
          .eq("user_id", user?.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("contatos")
          .insert({ user_id: user?.id, nome, email: email || null });
        if (error) throw error;
      }
      queryClient.invalidateQueries({ queryKey: ["contatos"] });
      if (onSuccess) onSuccess();
      else fecharModal();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Deseja realmente excluir este contato?")) return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("contatos")
        .delete()
        .eq("id", idSelecionado)
        .eq("user_id", user?.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["contatos"] });
      fecharModal();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in duration-500">
      {error && <div className="bg-error-container text-error p-4 rounded-md text-xs font-bold border border-error/20">{error}</div>}
      
      <div className="space-y-2">
        <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Nome do Contato</label>
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
          <input 
            autoFocus
            required
            placeholder="Pessoa ou Empresa..."
            value={nome}
            onChange={e => setNome(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-surface-container-low border border-outline-variant rounded-md text-sm font-bold outline-none focus:border-primary-container transition-all"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">E-mail (Opcional)</label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
          <input 
            type="email"
            placeholder="contato@exemplo.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-surface-container-low border border-outline-variant rounded-md text-sm font-bold outline-none focus:border-primary-container transition-all"
          />
        </div>
      </div>

      <div className="flex gap-4">
        {isEdit && (
          <button type="button" onClick={handleDelete} disabled={loading} className="px-6 py-4 border border-error/30 text-error rounded-xl font-bold hover:bg-error/10 transition-all disabled:opacity-50">
            <Trash2 className="w-5 h-5" />
          </button>
        )}
        {onCancel && (
          <button type="button" onClick={onCancel} disabled={loading} className="px-6 py-4 border border-outline-variant rounded-xl font-bold text-on-surface hover:bg-surface-container-low transition-all disabled:opacity-50">
            Cancelar
          </button>
        )}
        <button disabled={loading} className="flex-1 bg-primary-container text-on-primary py-4 rounded-xl font-black text-sm flex items-center justify-center gap-3 hover:opacity-90 transition-all shadow-xl disabled:opacity-50">
          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : isEdit ? <>Salvar Alterações <Save className="w-5 h-5" /></> : <>Salvar Contato <ArrowRight className="w-5 h-5" /></>}
        </button>
      </div>
    </form>
  );
}

// --- LOCAL DE PAGAMENTO FORM ---
interface FormLocalPagamentoProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function FormLocalPagamento({ onSuccess, onCancel }: FormLocalPagamentoProps = {}) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { fecharModal, idSelecionado } = useUIStore();
  const { data: locais } = useLocaisPagamento();

  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!idSelecionado;

  useEffect(() => {
    if (isEdit && locais) {
      const c = locais.find(l => l.id === idSelecionado);
      if (c) {
        setNome(c.nome);
      }
    }
  }, [isEdit, locais, idSelecionado]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (isEdit) {
        const { error } = await supabase
          .from("locais_pagamento")
          .update({ nome })
          .eq("id", idSelecionado)
          .eq("user_id", user?.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("locais_pagamento")
          .insert({ user_id: user?.id, nome });
        if (error) throw error;
      }
      queryClient.invalidateQueries({ queryKey: ["locais_pagamento"] });
      if (onSuccess) onSuccess();
      else fecharModal();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Deseja realmente excluir este local de pagamento?")) return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("locais_pagamento")
        .delete()
        .eq("id", idSelecionado)
        .eq("user_id", user?.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["locais_pagamento"] });
      fecharModal();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in duration-500">
      {error && <div className="bg-error-container text-error p-4 rounded-md text-xs font-bold border border-error/20">{error}</div>}
      
      <div className="space-y-2">
        <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Nome do Local</label>
        <div className="relative">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
          <input 
            autoFocus
            required
            placeholder="Ex: Banco Itaú, Carteira, Dinheiro..."
            value={nome}
            onChange={e => setNome(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-surface-container-low border border-outline-variant rounded-md text-sm font-bold outline-none focus:border-primary-container transition-all"
          />
        </div>
      </div>

      <div className="flex gap-4">
        {isEdit && (
          <button type="button" onClick={handleDelete} disabled={loading} className="px-6 py-4 border border-error/30 text-error rounded-xl font-bold hover:bg-error/10 transition-all disabled:opacity-50">
            <Trash2 className="w-5 h-5" />
          </button>
        )}
        {onCancel && (
          <button type="button" onClick={onCancel} disabled={loading} className="px-6 py-4 border border-outline-variant rounded-xl font-bold text-on-surface hover:bg-surface-container-low transition-all disabled:opacity-50">
            Cancelar
          </button>
        )}
        <button disabled={loading} className="flex-1 bg-primary-container text-on-primary py-4 rounded-xl font-black text-sm flex items-center justify-center gap-3 hover:opacity-90 transition-all shadow-xl disabled:opacity-50">
          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : isEdit ? <>Salvar Alterações <Save className="w-5 h-5" /></> : <>Salvar Local <ArrowRight className="w-5 h-5" /></>}
        </button>
      </div>
    </form>
  );
}
