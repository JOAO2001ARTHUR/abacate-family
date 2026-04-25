"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { schemaCategoria, CategoriaInput } from "@/lib/validations";
import { cn } from "@/lib/utils";
import { X, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";

interface FormCategoriaProps {
  onClose: () => void;
  initialData?: any;
}

export function FormCategoria({ onClose, initialData }: FormCategoriaProps) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CategoriaInput>({
    resolver: zodResolver(schemaCategoria),
    defaultValues: initialData || {
      nome: "",
      cor: "#3b82f6",
      ativo: true,
      ordem: 0,
    }
  });

  const corSelecionada = watch("cor");

  const handleFormSubmit = async (data: CategoriaInput) => {
    try {
      if (initialData?.id) {
        await api.put(`/categorias/${initialData.id}`, data);
      } else {
        await api.post('/categorias', data);
      }
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      onClose();
    } catch (error) {
      console.error("Erro ao salvar categoria:", error);
    }
  };

  return (
    <div className="bg-card border-2 rounded-2xl shadow-2xl p-6 w-full max-w-md animate-in fade-in zoom-in duration-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-black text-slate-900">
          {initialData ? "Editar Categoria" : "Nova Categoria"}
        </h3>
        <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="space-y-4">
          {/* Preview */}
          <div className="flex justify-center py-4">
            <div 
              className="px-6 py-2 rounded-full border-2 font-black uppercase text-xs tracking-[0.2em] shadow-lg transition-all"
              style={{ 
                backgroundColor: `${corSelecionada}10`, 
                borderColor: corSelecionada,
                color: corSelecionada 
              }}
            >
              {watch("nome") || "Nome da Categoria"}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Nome</label>
            <input
              {...register("nome")}
              placeholder="Ex: Alimentação, Lazer..."
              className="w-full px-4 py-3 bg-slate-50 border-transparent focus:border-primary focus:bg-white rounded-xl outline-none transition-all font-bold"
            />
            {errors.nome && <p className="text-xs text-red-500 font-bold">{errors.nome.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Cor (HEX)</label>
              <div className="flex gap-2">
                <input 
                  type="color" 
                  {...register("cor")}
                  className="w-12 h-12 rounded-lg border-none p-0 cursor-pointer overflow-hidden"
                />
                <input
                  {...register("cor")}
                  placeholder="#000000"
                  className="flex-1 px-4 py-3 bg-slate-50 border-transparent focus:border-primary focus:bg-white rounded-xl outline-none transition-all font-bold text-center"
                />
              </div>
              {errors.cor && <p className="text-xs text-red-500 font-bold">{errors.cor.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Status</label>
              <select
                {...register("ativo", { setValueAs: v => v === "true" })}
                className="w-full px-4 py-3 bg-slate-50 border-transparent focus:border-primary focus:bg-white rounded-xl outline-none transition-all font-bold"
              >
                <option value="true">Ativa</option>
                <option value="false">Inativa</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-4 py-3 rounded-xl font-black bg-primary text-white hover:bg-primary/90 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {initialData ? "ATUALIZAR" : "CRIAR CATEGORIA"}
          </button>
        </div>
      </form>
    </div>
  );
}
