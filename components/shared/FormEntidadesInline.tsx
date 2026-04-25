"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Plus, 
  Loader2, 
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- FORM CATEGORIA (HIGH FIDELITY TO SCREENSHOT) ---
export function FormCriarCategoriaInline({ onSucesso, onCancelar }: { onSucesso: (id: string) => void, onCancelar: () => void }) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [nome, setNome] = useState("");
  const [cor, setCor] = useState("#397c2d");
  const [icone, setIcone] = useState("category");
  const [loading, setLoading] = useState(false);

  const iconesSet = ["category", "home", "shopping_cart", "restaurant", "local_gas_station", "medical_services", "school", "flight", "payments", "trending_up"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("categorias")
        .insert({ user_id: user?.id, nome, cor, icone })
        .select()
        .single();
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["categorias"] });
      onSucesso(data.id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute inset-0 bg-surface-container-lowest z-10 flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header matching screenshot */}
      <div className="p-6 border-b border-outline-variant flex justify-between items-center">
        <h3 className="text-xl font-black text-on-surface tracking-tight uppercase">Criar Categoria</h3>
        <button onClick={onCancelar} className="p-2 hover:bg-surface-container-low rounded-full transition-colors">
          <X className="w-5 h-5 text-on-surface-variant" />
        </button>
      </div>

      <div className="p-10 space-y-10 flex-1 overflow-y-auto">
        <div className="space-y-3">
          <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Nome da Categoria</label>
          <input 
            autoFocus
            placeholder="Ex: Alimentação, Lazer..."
            value={nome}
            onChange={e => setNome(e.target.value)}
            className="w-full px-5 py-4 bg-background border border-primary/40 rounded-md text-base font-medium outline-none focus:border-primary transition-all placeholder:text-outline/50"
          />
        </div>

        <div className="grid grid-cols-2 gap-10">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Cor de Destaque</label>
            <div className="flex items-center gap-4 bg-background border border-outline-variant p-4 rounded-md h-[72px]">
              <input 
                type="color" 
                value={cor}
                onChange={e => setCor(e.target.value)}
                className="w-12 h-12 rounded-sm cursor-pointer border-none bg-transparent"
              />
              <span className="text-sm font-black text-on-surface tnum">{cor.toUpperCase()}</span>
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Símbolo Visual</label>
            <div className="grid grid-cols-4 gap-3">
              {iconesSet.map(i => (
                <button 
                  key={i}
                  type="button"
                  onClick={() => setIcone(i)}
                  className={cn(
                    "w-11 h-11 rounded-md flex items-center justify-center transition-all border",
                    icone === i 
                      ? "bg-primary text-on-primary border-primary shadow-md" 
                      : "bg-background text-on-surface-variant border-outline-variant hover:border-primary/40"
                  )}
                >
                  <span className="material-symbols-outlined text-xl">{i}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="p-10">
        <button 
          onClick={handleSubmit} 
          disabled={loading || !nome} 
          className="w-full bg-primary text-on-primary py-5 rounded-xl font-black text-base flex justify-center items-center gap-3 shadow-xl hover:opacity-90 transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Criar Categoria <Plus className="w-5 h-5" /></>}
        </button>
      </div>
    </div>
  );
}

// --- FORM CONTATO (HIGH FIDELITY) ---
export function FormCriarContatoInline({ onSucesso, onCancelar }: { onSucesso: (id: string) => void, onCancelar: () => void }) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("contatos")
        .insert({ user_id: user?.id, nome })
        .select()
        .single();
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["contatos"] });
      onSucesso(data.id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute inset-0 bg-surface-container-lowest z-10 flex flex-col animate-in slide-in-from-right duration-300">
      <div className="p-6 border-b border-outline-variant flex justify-between items-center">
        <h3 className="text-xl font-black text-on-surface tracking-tight uppercase">Criar Contato</h3>
        <button onClick={onCancelar} className="p-2 hover:bg-surface-container-low rounded-full transition-colors">
          <X className="w-5 h-5 text-on-surface-variant" />
        </button>
      </div>

      <div className="p-10 space-y-10 flex-1">
        <div className="space-y-3">
          <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Nome do Contato ou Empresa</label>
          <input 
            autoFocus
            placeholder="Digite o nome..."
            value={nome}
            onChange={e => setNome(e.target.value)}
            className="w-full px-5 py-4 bg-background border border-primary/40 rounded-md text-base font-medium outline-none focus:border-primary transition-all"
          />
        </div>
      </div>

      <div className="p-10">
        <button 
          onClick={handleSubmit} 
          disabled={loading || !nome} 
          className="w-full bg-primary text-on-primary py-5 rounded-xl font-black text-base flex justify-center items-center gap-3 shadow-xl hover:opacity-90 transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Salvar Contato <Plus className="w-5 h-5" /></>}
        </button>
      </div>
    </div>
  );
}
