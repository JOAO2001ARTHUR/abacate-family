"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === "login") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });
        if (signUpError) throw signUpError;
        alert("Cadastro realizado! Verifique seu e-mail para confirmar a conta (se aplicável) ou tente fazer login.");
        setMode("login");
      }

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro ao processar sua solicitação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-inter">
      {/* Left Panel - Brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary p-20 flex-col justify-between relative overflow-hidden">
        <div className="flex items-center gap-3 text-white z-10">
          <div className="text-2xl">🥑</div>
          <span className="text-2xl font-black tracking-tighter">Abacate Family</span>
        </div>

        <div className="max-w-md z-10">
          <h1 className="text-7xl font-black text-white tracking-tighter leading-[0.9] mb-8">
            Clareza para o seu crescimento.
          </h1>
          <p className="text-white/70 text-lg font-medium leading-relaxed">
            Uma plataforma de inteligência financeira projetada para fornecer insights precisos e gestão patrimonial de alto desempenho.
          </p>
        </div>

        <div className="flex items-center gap-4 z-10">
          <div className="flex -space-x-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-10 h-10 rounded-full border-2 border-primary bg-surface-container-highest overflow-hidden">
                <img src={`https://i.pravatar.cc/100?img=${i+12}`} alt="User" />
              </div>
            ))}
          </div>
          <span className="text-white/60 text-xs font-bold uppercase tracking-widest">
            Junte-se a +10.000 investidores
          </span>
        </div>

        {/* Abstract Background Decoration */}
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 bg-background flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-10">
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-on-surface tracking-tighter">
              {mode === "login" ? "Bem-vindo de volta" : "Crie sua conta"}
            </h2>
            <p className="text-on-surface-variant font-medium text-sm">
              {mode === "login" ? "Acesse sua conta para gerenciar seus ativos." : "Comece sua jornada financeira hoje mesmo."}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-outline-variant">
            <button 
              onClick={() => setMode("login")}
              className={cn(
                "flex-1 pb-4 text-sm font-bold transition-all",
                mode === "login" ? "text-primary border-b-2 border-primary" : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              Login
            </button>
            <button 
              onClick={() => setMode("register")}
              className={cn(
                "flex-1 pb-4 text-sm font-bold transition-all",
                mode === "register" ? "text-primary border-b-2 border-primary" : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              Registro
            </button>
          </div>

          {error && (
            <div className="bg-error-container text-error p-4 rounded-md text-xs font-bold border border-error/20 animate-in fade-in slide-in-from-top-1">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {mode === "register" && (
              <div className="space-y-2 animate-in fade-in duration-300">
                <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Nome Completo</label>
                <input 
                  type="text" 
                  required
                  placeholder="Seu nome"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-md focus:border-primary outline-none transition-all text-sm font-medium"
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">E-mail corporativo</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline group-focus-within:text-primary transition-colors" />
                <input 
                  type="email" 
                  required
                  placeholder="nome@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-md focus:border-primary outline-none transition-all text-sm font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Senha</label>
                <button type="button" className="text-[10px] font-bold text-primary hover:underline uppercase tracking-widest">Esqueceu a senha?</button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline group-focus-within:text-primary transition-colors" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3 bg-surface-container-lowest border border-outline-variant rounded-md focus:border-primary outline-none transition-all text-sm font-medium"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === "login" && (
              <div className="flex items-center gap-3">
                <input type="checkbox" id="remember" className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary" />
                <label htmlFor="remember" className="text-xs font-bold text-on-surface-variant">Lembrar-me neste dispositivo</label>
              </div>
            )}

            <button 
              disabled={loading}
              className="w-full bg-primary text-on-primary py-4 rounded-md font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg group disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {mode === "login" ? "Sign In" : "Criar Conta"}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-outline-variant"></div></div>
            <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest bg-background px-4 text-on-surface-variant">Ou continue com</div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-3 py-3 border border-outline-variant rounded-md hover:bg-surface-container transition-all">
              <img src="https://www.svgrepo.com/show/355037/google.svg" className="w-4 h-4" alt="Google" />
              <span className="text-xs font-bold">Google</span>
            </button>
            <button className="flex items-center justify-center gap-3 py-3 border border-outline-variant rounded-md hover:bg-surface-container transition-all">
              <img src="https://www.svgrepo.com/show/448239/microsoft.svg" className="w-4 h-4" alt="Microsoft" />
              <span className="text-xs font-bold">Microsoft</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
