"use client";

import { useState } from "react";
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
  User
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- STANDALONE CATEGORIA FORM ---
export function FormCriarCategoria() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { fecharModal } = useUIStore();

  const [nome, setNome] = useState("");
  const [cor, setCor] = useState("#397c2d");
  const [icone, setIcone] = useState("category");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const iconesSet = ["category", "home", "shopping_cart", "restaurant", "local_gas_station", "medical_services", "school", "flight", "payments", "trending_up"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("categorias")
        .insert({ user_id: user?.id, nome, cor, icone });
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

      <button disabled={loading} className="w-full bg-primary-container text-on-primary py-4 rounded-xl font-black text-sm flex items-center justify-center gap-3 hover:opacity-90 transition-all shadow-xl disabled:opacity-50">
        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Criar Categoria <Plus className="w-5 h-5" /></>}
      </button>
    </form>
  );
}

// --- STANDALONE CONTATO FORM ---
export function FormCriarContato() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { fecharModal } = useUIStore();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("contatos")
        .insert({ user_id: user?.id, nome, email: email || null });
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

      <button disabled={loading} className="w-full bg-primary-container text-on-primary py-4 rounded-xl font-black text-sm flex items-center justify-center gap-3 hover:opacity-90 transition-all shadow-xl disabled:opacity-50">
        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Salvar Contato <ArrowRight className="w-5 h-5" /></>}
      </button>
    </form>
  );
}
