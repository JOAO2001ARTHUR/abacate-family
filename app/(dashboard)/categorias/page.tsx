"use client";

import { useCategorias } from "@/hooks/useCategorias";
import { useUIStore } from "@/stores/useUIStore";
import { Plus, MoreVertical, LayoutGrid, Tags } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CategoriasPage() {
  const { data: categorias, isLoading } = useCategorias();
  const { abrirModal } = useUIStore();

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      {/* Page Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-on-surface tracking-tighter">Categorias</h1>
          <p className="text-on-surface-variant text-sm font-medium mt-1">Organize seus lançamentos por centros de custo e receita.</p>
        </div>
        <button 
          onClick={() => abrirModal('CRIAR_CATEGORIA')}
          className="bg-primary-container text-on-primary px-8 py-3 rounded-md font-bold text-sm flex items-center gap-2 hover:opacity-90 transition-all shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Nova Categoria
        </button>
      </div>

      {/* Categories Grid - Official Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-56 bg-surface-container-lowest border border-outline-variant rounded-md animate-pulse" />
          ))
        ) : (
          categorias?.map((cat) => (
            <div 
              key={cat.id} 
              className={cn(
                "relative bg-surface-container-lowest border border-outline-variant rounded-md p-8 flex flex-col items-center text-center gap-6 hover:border-primary-container transition-all cursor-default shadow-sm hover:shadow-md group",
                !cat.ativo && "opacity-60 grayscale-[0.5]"
              )}
            >
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110" 
                style={{ backgroundColor: cat.cor || '#397c2d' }}
              >
                <span className="material-symbols-outlined text-3xl">
                  {cat.icone || 'category'}
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-on-surface tracking-tight leading-none group-hover:text-primary-container transition-colors">
                  {cat.nome}
                </h3>
                <div className="flex items-center justify-center gap-2 text-on-surface-variant font-bold text-[10px] uppercase tracking-widest opacity-60">
                  <Tags className="w-3 h-3" />
                  <span>SISTEMÁTICO</span>
                </div>
              </div>

              <div className="w-full pt-4 border-t border-outline-variant/40 flex justify-center">
                <span className={cn(
                  "px-4 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest border",
                  cat.ativo 
                    ? "bg-primary-fixed/30 text-primary-container border-primary/10" 
                    : "bg-surface-container text-on-surface-variant border-outline-variant"
                )}>
                  {cat.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              
              <button className="absolute top-4 right-4 text-outline hover:text-primary-container transition-all">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          ))
        )}

        {/* New Category Placeholder */}
        <div 
          onClick={() => abrirModal('CRIAR_CATEGORIA')}
          className="bg-surface border-2 border-dashed border-outline-variant rounded-md p-8 flex flex-col items-center justify-center gap-6 hover:border-primary-container hover:bg-surface-container-low transition-all cursor-pointer group h-full min-h-[220px]"
        >
          <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-outline group-hover:bg-primary-container group-hover:text-on-primary transition-all">
            <Plus className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-on-surface-variant group-hover:text-primary-container transition-colors">Nova Categoria</h3>
            <p className="text-[10px] font-medium text-outline">Adicionar novo centro</p>
          </div>
        </div>
      </div>
    </div>
  );
}
