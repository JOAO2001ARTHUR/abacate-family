"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  Tags, 
  Users, 
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const menuItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Lançamentos", href: "/lancamentos", icon: ArrowLeftRight },
  { name: "Categorias", href: "/categorias", icon: Tags },
  { name: "Contatos", href: "/contatos", icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={cn(
      "h-screen glass flex flex-col transition-all duration-500 ease-in-out relative z-40 m-4 rounded-[2.5rem] shadow-2xl shadow-slate-200/50",
      collapsed ? "w-24" : "w-72"
    )}>
      {/* Header / Logo */}
      <div className="p-8 flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200 shrink-0 transform hover:rotate-12 transition-transform duration-300">
          <TrendingUp className="w-6 h-6" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="font-black text-xl tracking-tight text-slate-900 leading-none">
              Abacate <span className="text-primary">Family</span>
            </span>
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">SaaS Financeiro</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative",
                isActive 
                  ? "bg-primary text-white shadow-xl shadow-blue-100 translate-x-1" 
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <item.icon className={cn("w-5 h-5 shrink-0 transition-transform group-hover:scale-110", isActive ? "" : "group-hover:text-primary")} />
              {!collapsed && <span className="font-bold tracking-tight">{item.name}</span>}
              
              {isActive && (
                <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-white rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 space-y-2">
        <button className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-all font-bold tracking-tight">
          <Settings className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Configurações</span>}
        </button>
        <button className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-rose-500 hover:bg-rose-50 transition-all font-bold tracking-tight">
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
        
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-3 text-slate-400 hover:text-slate-900 mt-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all"
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* Background decoration */}
      {!collapsed && (
        <div className="absolute bottom-20 left-6 right-6 p-4 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl text-white overflow-hidden group">
          <p className="text-xs font-black uppercase tracking-[0.2em] opacity-50 mb-2">Plano</p>
          <p className="text-lg font-black tracking-tight mb-3">Premium Life</p>
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
            <div className="h-full w-2/3 bg-primary rounded-full" />
          </div>
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white/5 rounded-full blur-2xl group-hover:bg-primary/20 transition-all duration-700" />
        </div>
      )}
    </aside>
  );
}
