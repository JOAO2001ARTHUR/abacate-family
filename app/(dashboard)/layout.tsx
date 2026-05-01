"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/useUIStore";
import { Modals } from "@/components/shared/Modals";
import { createClient } from "@/utils/supabase/client";
import { 
  Plus, 
  Search, 
  Bell, 
  Settings, 
  Calendar,
  LayoutDashboard,
  ArrowLeftRight,
  LayoutGrid,
  LogOut,
  User as UserIcon,
  Menu,
  X
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { abrirModal } = useUIStore();
  
  const [user, setUser] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const navItems = [
    { label: "Dashboard", href: "/", icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: "Entradas e Saídas", href: "/lancamentos", icon: <ArrowLeftRight className="w-5 h-5" /> },
    { label: "Variáveis", href: "/variaveis", icon: <LayoutGrid className="w-5 h-5" /> },
  ];

  return (
    <div className="bg-background text-on-surface min-h-screen flex antialiased overflow-hidden relative">
      {/* Overlay for Mobile Menu */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-[70] md:hidden animate-in fade-in duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* SideNavBar - Drawer on Mobile, Fixed on Desktop */}
      <aside className={cn(
        "bg-surface-container-low border-r border-outline-variant h-screen w-64 fixed left-0 top-0 z-[80] flex flex-col py-6 transition-transform duration-300 md:translate-x-0",
        isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:flex"
      )}>
        <div className="px-6 mb-8 flex items-center justify-between">
          <div>
            <div className="text-2xl font-black text-primary tracking-tighter flex items-center gap-2">
              <span>Abacate</span>
              <span className="text-xl">🥑</span>
              <span>Family</span>
            </div>
            <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-1 opacity-60">Financial Intelligence</div>
          </div>
          <button 
            className="md:hidden p-2 hover:bg-surface-container rounded-full"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="flex-1 flex flex-col px-3">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-200 border-l-4",
                  active 
                    ? "bg-primary-fixed/40 text-primary-container border-primary font-bold" 
                    : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface border-l-transparent"
                )}
              >
                {item.icon}
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto px-4 space-y-6">
          <button 
            onClick={() => { abrirModal('CRIAR_LANCAMENTO'); setIsMobileMenuOpen(false); }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-container text-on-primary rounded-md hover:opacity-90 transition-all font-bold text-sm shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Transaction
          </button>
          
          <div className="flex items-center gap-3 px-2 border-t border-outline-variant pt-4 pb-2">
            <div className="w-9 h-9 rounded-md bg-surface-container-highest flex items-center justify-center border border-outline-variant text-primary-container">
              {user?.user_metadata?.avatar_url ? (
                <img 
                  src={user.user_metadata.avatar_url} 
                  alt="User" 
                  className="w-full h-full object-cover rounded-md"
                />
              ) : (
                <UserIcon className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-on-surface text-xs truncate">
                {user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Financial Admin"}
              </div>
              <div className="text-[10px] text-on-surface-variant font-bold uppercase tracking-tighter opacity-60">
                {user ? "Personal Plan" : "Pro Plan"}
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="text-on-surface-variant hover:text-error transition-colors"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col md:ml-64 h-screen overflow-hidden">
        {/* TopAppBar - Responsive Style */}
        <header className="bg-surface-container-lowest/90 backdrop-blur-md flex justify-between items-center h-16 px-4 md:px-8 w-full sticky top-0 z-40 border-b border-outline-variant">
          {/* Menu & Logo on Mobile / Search on Desktop */}
          <div className="flex items-center gap-4 flex-1">
            <button 
              className="md:hidden p-2 text-on-surface-variant hover:bg-surface-container rounded-md"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="text-xl font-black text-primary tracking-tighter flex md:hidden items-center gap-1">
              <span>Abacate</span>
              <span className="text-lg">🥑</span>
            </div>

            <div className="hidden md:flex items-center bg-surface-container-low rounded-md px-4 py-2 w-full max-w-md group focus-within:ring-1 focus-within:ring-primary transition-all border border-transparent focus-within:border-primary">
              <Search className="w-4 h-4 text-outline mr-3 shrink-0" />
              <input 
                type="text" 
                placeholder="Search transactions..." 
                className="bg-transparent border-none focus:ring-0 text-sm font-medium text-on-surface w-full p-0 placeholder:text-outline"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <div className="hidden sm:flex items-center gap-2 text-primary font-bold text-xs md:text-sm cursor-pointer hover:opacity-80 transition-opacity">
              <span>{new Date().toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}</span>
              <Calendar className="w-4 h-4" />
            </div>
            
            <div className="hidden sm:block h-6 w-px bg-outline-variant" />
            
            <div className="flex items-center gap-2 md:gap-4">
              <button className="md:hidden text-on-surface-variant p-2">
                <Search className="w-5 h-5" />
              </button>
              <button className="text-on-surface-variant hover:text-on-surface transition-colors p-2">
                <Bell className="w-5 h-5" />
              </button>
              <button 
                onClick={handleLogout}
                className="md:hidden text-on-surface-variant p-2"
              >
                <LogOut className="w-5 h-5" />
              </button>
              <button className="hidden md:block text-on-surface-variant hover:text-on-surface transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Scrollable Canvas */}
        <main className="flex-1 overflow-y-auto p-4 md:p-12 bg-background pb-32 md:pb-12">
          <div className="max-w-[1920px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-container-lowest/95 backdrop-blur-lg border-t border-outline-variant h-20 px-6 flex items-center justify-between z-[60] safe-area-bottom">
        {navItems.slice(0, 2).map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 transition-all duration-200",
                active ? "text-primary" : "text-on-surface-variant opacity-60"
              )}
            >
              <div className={cn("p-1 rounded-md", active && "bg-primary/10")}>
                {item.icon}
              </div>
              <span className="text-[10px] font-black uppercase tracking-tighter">{item.label.split(' ')[0]}</span>
            </Link>
          );
        })}

        {/* Floating Action Button (Mobile) */}
        <button 
          onClick={() => abrirModal('CRIAR_LANCAMENTO')}
          className="bg-primary text-on-primary w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg -translate-y-6 border-4 border-background transition-transform active:scale-95"
        >
          <Plus className="w-7 h-7" />
        </button>

        <Link
          href="/variaveis"
          className={cn(
            "flex flex-col items-center gap-1 transition-all duration-200",
            pathname === "/variaveis" ? "text-primary" : "text-on-surface-variant opacity-60"
          )}
        >
          <div className={cn("p-1 rounded-md", pathname === "/variaveis" && "bg-primary/10")}>
            <LayoutGrid className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-tighter">Variáveis</span>
        </Link>

        <button 
          onClick={() => {}} // Could be a settings or profile modal
          className="flex flex-col items-center gap-1 text-on-surface-variant opacity-60"
        >
          <div className="w-6 h-6 rounded-md bg-surface-container-highest flex items-center justify-center border border-outline-variant">
            <UserIcon className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-tighter">Perfil</span>
        </button>
      </nav>

      <Modals />
    </div>
  );
}
  );
}
