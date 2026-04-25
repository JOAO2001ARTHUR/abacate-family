"use client";

import { useUIStore } from "@/stores/useUIStore";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { format, addMonths, subMonths, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export function FiltrosPeriodo() {
  const { mesAtivo, setMesAtivo } = useUIStore();
  
  const currentDate = parseISO(`${mesAtivo}-01`);

  const handlePrevious = () => {
    const prev = subMonths(currentDate, 1);
    setMesAtivo(format(prev, "yyyy-MM"));
  };

  const handleNext = () => {
    const next = addMonths(currentDate, 1);
    setMesAtivo(format(next, "yyyy-MM"));
  };

  const handleToday = () => {
    setMesAtivo(format(new Date(), "yyyy-MM"));
  };

  return (
    <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/50 rounded-2xl">
      <button 
        onClick={handlePrevious}
        className="p-3 bg-white hover:bg-primary hover:text-white rounded-xl transition-all shadow-sm hover:shadow-lg hover:shadow-blue-200 active:scale-95"
        title="Mês anterior"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      
      <button 
        onClick={handleToday}
        className="flex items-center gap-3 px-8 py-3 bg-white hover:bg-slate-50 rounded-xl transition-all shadow-sm min-w-[200px] justify-center group"
      >
        <Calendar className="w-5 h-5 text-primary transition-transform group-hover:scale-110" />
        <span className="text-sm font-black capitalize tracking-tight text-slate-900">
          {format(currentDate, "MMMM yyyy", { locale: ptBR })}
        </span>
      </button>

      <button 
        onClick={handleNext}
        className="p-3 bg-white hover:bg-primary hover:text-white rounded-xl transition-all shadow-sm hover:shadow-lg hover:shadow-blue-200 active:scale-95"
        title="Próximo mês"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
