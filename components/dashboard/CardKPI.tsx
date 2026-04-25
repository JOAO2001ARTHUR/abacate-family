"use client";

import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface CardKPIProps {
  label: string;
  value: string;
  type?: 'ENTRADA' | 'SAIDA' | 'NEUTRO';
  delta?: {
    value: string;
    isPositive: boolean;
  };
}

export function CardKPI({ label, value, delta, type = 'NEUTRO' }: CardKPIProps) {
  const isPositive = type === 'ENTRADA' || type === 'NEUTRO';
  
  return (
    <div className={cn(
      "group relative card-premium hover:card-premium-hover rounded-[2.5rem] p-8 overflow-hidden",
      "transition-all duration-500"
    )}>
      {/* Decorative background glow */}
      <div className={cn(
        "absolute -right-8 -top-8 w-32 h-32 blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-700",
        type === 'ENTRADA' ? "bg-emerald-400" : type === 'SAIDA' ? "bg-rose-400" : "bg-primary"
      )} />

      <div className="flex items-start justify-between relative z-10">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-slate-600 transition-colors">
              {label}
            </span>
          </div>
          <div className="flex flex-col">
            <h4 className={cn(
              "text-4xl font-black tracking-tighter transition-all duration-300",
              type === 'ENTRADA' ? "text-emerald-600" : type === 'SAIDA' ? "text-rose-600" : "text-slate-900"
            )}>
              {value}
            </h4>
          </div>
        </div>

        <div className={cn(
          "w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-lg",
          type === 'ENTRADA' ? "bg-emerald-50 text-emerald-600 shadow-emerald-100" : 
          type === 'SAIDA' ? "bg-rose-50 text-rose-600 shadow-rose-100" : 
          "bg-blue-50 text-primary shadow-blue-100"
        )}>
          {type === 'ENTRADA' ? <TrendingUp className="w-8 h-8" /> : 
           type === 'SAIDA' ? <TrendingDown className="w-8 h-8" /> : 
           <Wallet className="w-8 h-8" />}
        </div>
      </div>

      <div className="mt-8 flex items-center gap-3 relative z-10">
        {delta && (
          <div className={cn(
            "flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-sm",
            delta.isPositive ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-rose-50 text-rose-700 border border-rose-100"
          )}>
            {delta.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {delta.value}
          </div>
        )}
        <span className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">vs período ant.</span>
      </div>
      
      {/* Interactive line at bottom */}
      <div className={cn(
        "absolute bottom-0 left-0 h-1.5 transition-all duration-500 w-0 group-hover:w-full",
        type === 'ENTRADA' ? "bg-emerald-500" : type === 'SAIDA' ? "bg-rose-500" : "bg-primary"
      )} />
    </div>
  );
}
