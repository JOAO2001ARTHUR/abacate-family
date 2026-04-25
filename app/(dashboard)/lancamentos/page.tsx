"use client";

import { useState } from "react";
import { useOcorrencias, calcularStatusReal } from "@/hooks/useOcorrencias";
import { formatarMoeda } from "@/lib/utils";
import { 
  Download,
  Search,
  Filter,
  Calendar,
  MoreVertical,
  CheckCircle2,
  Clock,
  TrendingUp,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useUIStore } from "@/stores/useUIStore";
import { cn } from "@/lib/utils";

export default function LancamentosPage() {
  const { data: ocorrencias, isLoading } = useOcorrencias();
  const { abrirModal } = useUIStore();
  const [busca, setBusca] = useState("");

  const filtered = ocorrencias?.filter(oc => 
    oc.nome.toLowerCase().includes(busca.toLowerCase()) ||
    oc.categoria?.nome.toLowerCase().includes(busca.toLowerCase())
  ) || [];

  const totais = filtered.reduce((acc, o) => {
    const valor = o.valor_editado ?? o.valor;
    if (o.natureza === 'ENTRADA') acc.entradas += valor;
    else acc.saidas += valor;
    return acc;
  }, { entradas: 0, saidas: 0 });

  return (
    <div className="space-y-8 pb-40 animate-in fade-in duration-700">
      {/* Page Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-on-surface tracking-tighter">Registro de Transações</h1>
          <p className="text-on-surface-variant text-sm font-medium mt-1">Gerencie suas entradas e saídas financeiras.</p>
        </div>
        <button className="bg-primary-container text-on-primary px-8 py-3 rounded-md font-bold text-sm flex items-center gap-2 hover:opacity-90 transition-all shadow-sm">
          <Download className="w-4 h-4" />
          Exportar Relatório
        </button>
      </div>

      {/* Filter Card - Official Style */}
      <section className="bg-surface-container-lowest border border-outline-variant rounded-md p-8 shadow-sm grid grid-cols-12 gap-8 items-end">
        <div className="col-span-12 md:col-span-5 space-y-2">
          <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Buscar</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
            <input 
              type="text" 
              placeholder="Descrição, categoria..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-surface-container-low border border-outline-variant rounded-md focus:border-primary-container focus:ring-0 outline-none transition-all text-sm font-medium"
            />
          </div>
        </div>
        
        <div className="col-span-12 md:col-span-3 space-y-2">
          <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Data</label>
          <div className="flex items-center justify-between px-4 py-3 bg-surface-container-low border border-outline-variant rounded-md text-sm font-medium text-on-surface-variant">
            <span>mm/dd/yyyy</span>
            <Calendar className="w-4 h-4 text-outline" />
          </div>
        </div>

        <div className="col-span-12 md:col-span-2 space-y-2">
          <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Natureza</label>
          <select className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-md text-sm font-medium outline-none">
            <option>Todas</option>
            <option>Entrada</option>
            <option>Saída</option>
          </select>
        </div>

        <div className="col-span-12 md:col-span-2">
          <button className="w-full bg-primary-container text-on-primary px-4 py-3 rounded-md font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-sm">
            <Filter className="w-4 h-4" />
            Filtrar
          </button>
        </div>
      </section>

      {/* Data Table Container */}
      <section className="bg-surface-container-lowest border border-outline-variant rounded-md overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant text-[10px] font-black text-on-surface-variant uppercase tracking-widest">
                <th className="px-8 py-4">Data</th>
                <th className="px-8 py-4">Descrição</th>
                <th className="px-8 py-4">Categoria</th>
                <th className="px-8 py-4">Natureza</th>
                <th className="px-8 py-4 text-right">Valor</th>
                <th className="px-8 py-4 text-center">Status</th>
                <th className="px-8 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center animate-pulse font-bold text-on-surface-variant uppercase tracking-widest text-xs">Sincronizando Dados...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center text-on-surface-variant font-medium opacity-40">Nenhuma transação registrada no período.</td>
                </tr>
              ) : (
                filtered.map((oc) => (
                  <tr key={oc.id} className="hover:bg-surface-container-low transition-colors group">
                    <td className="px-8 py-5 text-sm font-medium text-on-surface tnum">
                      {new Date(oc.data_vencimento).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-8 py-5">
                      <div className="font-bold text-on-surface text-sm">{oc.nome}</div>
                      <div className="text-[10px] text-on-surface-variant font-medium opacity-60 uppercase tracking-tighter mt-0.5">Ref: {oc.id.substring(0,8)}</div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-sm font-medium text-on-surface-variant">{oc.categoria?.nome || 'Inespecífico'}</span>
                    </td>
                    <td className="px-8 py-5">
                      <span className={cn(
                        "inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                        oc.natureza === 'ENTRADA' ? "bg-primary-fixed/40 text-primary-container" : "bg-error-container/40 text-error"
                      )}>
                        {oc.natureza}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right font-black tnum text-base">
                      <span className={oc.natureza === 'ENTRADA' ? "text-primary-container" : "text-error"}>
                        {oc.natureza === 'ENTRADA' ? '+' : '-'} {formatarMoeda(oc.valor_editado ?? oc.valor)}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <div className="flex justify-center">
                        {calcularStatusReal(oc) === 'BAIXADA' ? (
                          <CheckCircle2 className="w-5 h-5 text-primary-container" />
                        ) : (
                          <Clock className="w-5 h-5 text-outline" />
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button 
                        onClick={() => abrirModal('BAIXAR', oc.id)}
                        className="text-outline hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="p-6 border-t border-outline-variant flex justify-between items-center bg-surface-container-low/30">
          <span className="text-xs font-bold text-on-surface-variant">Mostrando 1-{filtered.length} de {filtered.length} transações</span>
          <div className="flex gap-2">
            <button className="px-4 py-2 border border-outline-variant rounded-md text-xs font-bold text-on-surface-variant hover:bg-surface-container transition-all disabled:opacity-30" disabled>Anterior</button>
            <button className="px-4 py-2 border border-outline-variant rounded-md text-xs font-bold text-on-surface-variant hover:bg-surface-container transition-all disabled:opacity-30" disabled>Próxima</button>
          </div>
        </div>
      </section>

      {/* Official Sticky Footer */}
      <footer className="fixed bottom-0 right-0 left-64 bg-surface-container-low/90 backdrop-blur-xl border-t border-outline-variant p-10 z-30 shadow-[0_-10px_30px_-5px_rgba(0,0,0,0.03)]">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex items-center gap-16">
            <div className="text-center">
              <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-2">Total Entradas (Período)</p>
              <p className="font-black text-xl text-primary-container tnum">+{formatarMoeda(totais.entradas)}</p>
            </div>
            <div className="w-px h-12 bg-outline-variant" />
            <div className="text-center">
              <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-2">Total Saídas (Período)</p>
              <p className="font-black text-xl text-error tnum">-{formatarMoeda(totais.saidas)}</p>
            </div>
          </div>
          <div className="text-right border-l border-outline-variant pl-16">
            <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-2">SALDO DO PERÍODO</p>
            <div className="flex items-center gap-5">
              <span className="text-4xl font-black text-primary-container tracking-tighter tnum">
                {formatarMoeda(totais.entradas - totais.saidas)}
              </span>
              <TrendingUp className={cn("w-8 h-8", (totais.entradas - totais.saidas) >= 0 ? "text-primary-container" : "text-error rotate-180")} />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
