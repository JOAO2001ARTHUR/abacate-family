"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { schemaLancamento, LancamentoInput } from "@/lib/validations";
import { cn } from "@/lib/utils";
import { X, Loader2 } from "lucide-react";
import { useCategorias } from "@/hooks/useCategorias";
import { useContatos } from "@/hooks/useContatos";

interface FormLancamentoProps {
  onClose: () => void;
  onSubmit?: (data: LancamentoInput) => void;
  initialData?: Partial<LancamentoInput>;
}

export function FormLancamento({ onClose, onSubmit, initialData }: FormLancamentoProps) {
  const { data: categorias, isLoading: loadingCats } = useCategorias();
  const { data: contatos, isLoading: loadingContatos } = useContatos();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LancamentoInput>({
    resolver: zodResolver(schemaLancamento),
    defaultValues: {
      natureza: "SAIDA",
      tipo: "ESPORADICA",
      data_inicio: new Date().toISOString().split('T')[0],
      ...initialData
    }
  });

  const tipoSelecionado = watch("tipo");
  const naturezaSelecionada = watch("natureza");

  const handleFormSubmit = async (data: LancamentoInput) => {
    try {
      await onSubmit?.(data);
      onClose();
    } catch (error) {
      console.error("Erro ao salvar lançamento:", error);
    }
  };

  return (
    <div className="bg-card border rounded-xl shadow-lg p-6 w-full max-w-2xl overflow-y-auto max-h-[90vh]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold">
          {initialData ? "Editar Lançamento" : "Novo Lançamento"}
        </h3>
        <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Toggle Natureza */}
        <div className="flex p-1 bg-muted rounded-lg w-full sm:w-fit">
          <button
            type="button"
            onClick={() => setValue("natureza", "ENTRADA")}
            className={cn(
              "flex-1 sm:px-6 py-2 rounded-md text-sm font-semibold transition-all",
              naturezaSelecionada === "ENTRADA" ? "bg-white shadow-sm text-entrada" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Entrada
          </button>
          <button
            type="button"
            onClick={() => setValue("natureza", "SAIDA")}
            className={cn(
              "flex-1 sm:px-6 py-2 rounded-md text-sm font-semibold transition-all",
              naturezaSelecionada === "SAIDA" ? "bg-white shadow-sm text-saida" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Saída
          </button>
          <input type="hidden" {...register("natureza")} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nome */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome do Lançamento</label>
            <input
              {...register("nome")}
              placeholder="Ex: Aluguel, Salário, Internet"
              className={cn(
                "w-full px-4 py-2 bg-background border rounded-lg focus:ring-2 focus:ring-primary outline-none",
                errors.nome && "border-destructive"
              )}
            />
            {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
          </div>

          {/* Valor Base */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Valor Base (R$)</label>
            <input
              type="number"
              step="0.01"
              {...register("valor_base", { valueAsNumber: true })}
              placeholder="0,00"
              className={cn(
                "w-full px-4 py-2 bg-background border rounded-lg focus:ring-2 focus:ring-primary outline-none",
                errors.valor_base && "border-destructive"
              )}
            />
            {errors.valor_base && <p className="text-xs text-destructive">{errors.valor_base.message}</p>}
          </div>

          {/* Tipo de Lançamento */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo</label>
            <select
              {...register("tipo")}
              className="w-full px-4 py-2 bg-background border rounded-lg focus:ring-2 focus:ring-primary outline-none"
            >
              <option value="ESPORADICA">Único (Esporádico)</option>
              <option value="FIXA">Fixo (Mensal)</option>
              <option value="PARCELA">Parcelado</option>
            </select>
          </div>

          {/* Data de Início */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Data de Início</label>
            <input
              type="date"
              {...register("data_inicio")}
              className="w-full px-4 py-2 bg-background border rounded-lg focus:ring-2 focus:ring-primary outline-none"
            />
            {errors.data_inicio && <p className="text-xs text-destructive">{errors.data_inicio.message}</p>}
          </div>

          {/* Campos Condicionais */}
          {tipoSelecionado === "PARCELA" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Total de Parcelas</label>
              <input
                type="number"
                {...register("total_parcelas", { valueAsNumber: true })}
                placeholder="Ex: 12"
                className="w-full px-4 py-2 bg-background border rounded-lg focus:ring-2 focus:ring-primary outline-none"
              />
              {errors.total_parcelas && <p className="text-xs text-destructive">{errors.total_parcelas.message}</p>}
            </div>
          )}

          {tipoSelecionado === "FIXA" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Data de Fim (Opcional)</label>
              <input
                type="date"
                {...register("data_fim")}
                className="w-full px-4 py-2 bg-background border rounded-lg focus:ring-2 focus:ring-primary outline-none"
              />
              {errors.data_fim && <p className="text-xs text-destructive">{errors.data_fim.message}</p>}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Categoria */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Categoria</label>
            <select
              {...register("categoria_id")}
              disabled={loadingCats}
              className="w-full px-4 py-2 bg-background border rounded-lg focus:ring-2 focus:ring-primary outline-none disabled:opacity-50"
            >
              <option value="">{loadingCats ? "Carregando..." : "Selecione uma categoria"}</option>
              {categorias?.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nome}</option>
              ))}
            </select>
            {errors.categoria_id && <p className="text-xs text-destructive">{errors.categoria_id.message}</p>}
          </div>

          {/* Contato */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Contato (Opcional)</label>
            <select
              {...register("contato_id")}
              disabled={loadingContatos}
              className="w-full px-4 py-2 bg-background border rounded-lg focus:ring-2 focus:ring-primary outline-none disabled:opacity-50"
            >
              <option value="">{loadingContatos ? "Carregando..." : "Selecione um contato"}</option>
              {contatos?.map(contato => (
                <option key={contato.id} value={contato.id}>{contato.nome}</option>
              ))}
            </select>
            {errors.contato_id && <p className="text-xs text-destructive">{errors.contato_id.message}</p>}
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-lg font-semibold text-muted-foreground hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-2 rounded-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm flex items-center gap-2 disabled:opacity-70"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {initialData ? "Atualizar" : "Salvar Lançamento"}
          </button>
        </div>
      </form>
    </div>
  );
}
