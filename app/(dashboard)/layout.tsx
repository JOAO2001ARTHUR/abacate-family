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
  Tags,
  Users,
  LogOut,
  User as UserIcon
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
    { label: "Categorias", href: "/categorias", icon: <Tags className="w-5 h-5" /> },
    { label: "Contatos", href: "/contatos", icon: <Users className="w-5 h-5" /> },
  ];

  return (
    <div className="bg-background text-on-surface min-h-screen flex antialiased overflow-hidden">
      {/* SideNavBar - Official Style */}
      <aside className="bg-surface-container-low border-r border-outline-variant h-screen w-64 fixed left-0 top-0 z-50 flex flex-col py-6 hidden md:flex">
        <div className="px-6 mb-8">
          <div className="text-2xl font-black text-primary tracking-tighter flex items-center gap-2">
            <span>Abacate</span>
            <span className="text-xl">🥑</span>
            <span>Family</span>
          </div>
          <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-1 opacity-60">Financial Intelligence</div>
        </div>
        
        <nav className="flex-1 flex flex-col px-3">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
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
            onClick={() => abrirModal('CRIAR_LANCAMENTO')}
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
        {/* TopAppBar - Official Style */}
        <header className="bg-surface-container-lowest/90 backdrop-blur-md flex justify-between items-center h-16 px-8 w-full sticky top-0 z-40 border-b border-outline-variant">
          {/* Search Bar on Left */}
          <div className="flex items-center bg-surface-container-low rounded-md px-4 py-2 w-96 group focus-within:ring-1 focus-within:ring-primary transition-all border border-transparent focus-within:border-primary">
            <Search className="w-4 h-4 text-outline mr-3" />
            <input 
              type="text" 
              placeholder="Search transactions, contacts..." 
              className="bg-transparent border-none focus:ring-0 text-sm font-medium text-on-surface w-full p-0 placeholder:text-outline"
            />
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-primary font-bold text-sm cursor-pointer hover:opacity-80 transition-opacity">
              <span>{new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
              <Calendar className="w-4 h-4" />
            </div>
            
            <div className="h-6 w-px bg-outline-variant" />
            
            <div className="flex items-center gap-4">
              <button className="text-on-surface-variant hover:text-on-surface transition-colors">
                <Bell className="w-5 h-5" />
              </button>
              <button className="text-on-surface-variant hover:text-on-surface transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Scrollable Canvas */}
        <main className="flex-1 overflow-y-auto p-8 bg-background">
          <div className="max-w-[1440px] mx-auto">
            {children}
          </div>
        </main>
      </div>

      <Modals />
    </div>
  );
}
