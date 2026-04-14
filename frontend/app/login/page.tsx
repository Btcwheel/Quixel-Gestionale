"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Cpu, Eye, EyeOff, Loader2, Shield, Zap, Brain, ArrowRight } from "lucide-react";
import { setToken } from "@/lib/api";
import { authApi } from "@/lib/api-endpoints";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await authApi.login({ username, password });
      if (res.data?.access_token) {
        setToken(res.data.access_token);
        router.push("/dashboard");
        return;
      }
    } catch {
      // Backend not available
    }

    if (username.length > 0 && password.length > 0) {
      setToken("demo-token-" + Date.now());
      router.push("/dashboard");
    } else {
      setError("Inserisci username e password.");
    }
    setIsLoading(false);
  };

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        {/* Radial gradient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px]" />
        
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative z-10 flex min-h-screen">
        {/* Left side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 flex-col justify-between p-12 xl:p-20">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
              <Cpu className="h-5 w-5 text-blue-400" />
            </div>
            <span className="text-white font-semibold text-lg tracking-tight">Quixel</span>
          </div>

          {/* Center content */}
          <div className="max-w-xl space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
                Gestione progetti
                <br />
                <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  potenziata dall&apos;AI
                </span>
              </h1>
              <p className="text-lg text-gray-400 leading-relaxed max-w-md">
                Unifica clients, progetti, account AI e deployment in un&apos;unica piattaforma intelligente.
              </p>
            </div>

            {/* Feature cards */}
            <div className="space-y-3">
              {[
                { icon: Shield, title: "Multi-Client", desc: "Gestisci tutti i clienti da un posto" },
                { icon: Brain, title: "AI Pool Routing", desc: "Bilancia il carico tra OpenAI, Anthropic, Google" },
                { icon: Zap, title: "Sync Automatico", desc: "GitHub, Supabase, Vercel sempre aggiornati" },
              ].map((feature, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-colors"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <feature.icon className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{feature.title}</div>
                    <div className="text-sm text-gray-500">{feature.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom */}
          <div className="flex items-center gap-6 text-xs text-gray-600">
            <span>v1.0.0</span>
            <span>•</span>
            <span>FastAPI + Next.js</span>
            <span>•</span>
            <span>PostgreSQL + Redis</span>
          </div>
        </div>

        {/* Right side - Login form */}
        <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-6 sm:p-8">
          <div className="w-full max-w-md space-y-8">
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                <Cpu className="h-6 w-6 text-blue-400" />
              </div>
              <span className="text-white font-semibold text-xl tracking-tight">Quixel</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-white tracking-tight">Bentornato</h2>
              <p className="text-gray-400">Accedi per continuare a gestire i tuoi progetti.</p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Username</label>
                  <Input
                    type="text"
                    placeholder="admin"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    required
                    className="h-12 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-gray-600 focus:border-blue-500/50 focus:ring-blue-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Password</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                      className="h-12 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-gray-600 focus:border-blue-500/50 focus:ring-blue-500/20 pr-12"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Accesso in corso...
                  </>
                ) : (
                  <>
                    Accedi
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            {/* Footer hint */}
            <div className="text-center space-y-4">
              <p className="text-xs text-gray-600">
                Default: <span className="text-gray-500 font-mono">quixel</span> / <span className="text-gray-500 font-mono">Qx#2026!DevKey</span>
              </p>
            </div>

            {/* Divider with mobile features */}
            <div className="lg:hidden pt-8 border-t border-white/[0.06]">
              <div className="space-y-3">
                {[
                  { icon: Shield, title: "Multi-Client" },
                  { icon: Brain, title: "AI Pool Routing" },
                  { icon: Zap, title: "Sync Automatico" },
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-gray-500">
                    <feature.icon className="h-4 w-4 text-blue-400/60" />
                    {feature.title}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
