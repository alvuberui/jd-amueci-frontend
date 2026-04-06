"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { Button, Input, Message } from "@/components/ui";
import { HttpError } from "@/lib/api";

export function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState("amueci");
  const [password, setPassword] = useState("Amueci123!");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await login({ username, password });
    } catch (err) {
      setError(err instanceof HttpError ? err.message : "No se pudo iniciar sesion");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-mesh-dark">
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 gap-10 px-4 py-8 lg:grid-cols-[1.15fr_0.85fr] lg:px-8">
        <section className="relative overflow-hidden rounded-[36px] border border-white/10 bg-white/[0.04] p-8 shadow-panel backdrop-blur-2xl lg:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(125,34,255,0.25),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.12),transparent_22%)]" />
          <div className="relative flex h-full flex-col justify-between gap-10">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs uppercase tracking-[0.26em] text-slate-300">
                <Sparkles className="size-4 text-brand-300" />
                Plataforma de gestion AMUECI
              </div>
              <div className="space-y-5">
                <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-white lg:text-6xl">
                  Control elegante para una operativa interna mucho más clara.
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-slate-300">
                  Inventario de vestimenta e instrumentos, trazabilidad de préstamos, histórico de lavados y reparaciones,
                  y un dashboard diseñado para que la junta directiva vea el estado real del material en segundos.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ["Inventario vivo", "Consulta rápida del estado y detalle de cada recurso."],
                ["Operativa segura", "Validaciones de negocio y acceso protegido."],
                ["Escalable", "Base preparada para nuevas áreas de gestión."],
              ].map(([title, text]) => (
                <div key={title} className="rounded-3xl border border-white/10 bg-slate-950/30 p-5">
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex items-center">
          <div className="w-full rounded-[36px] border border-white/10 bg-slate-950/80 p-8 shadow-panel backdrop-blur-2xl lg:p-10">
            <div className="mb-8 flex items-center gap-4">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-brand-500/20 text-brand-200">
                <LockKeyhole className="size-6" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.26em] text-slate-500">Acceso privado</p>
                <h2 className="text-2xl font-semibold text-white">Iniciar sesión</h2>
              </div>
            </div>

            <div className="mb-8 rounded-3xl border border-emerald-400/15 bg-emerald-400/10 p-4 text-sm text-emerald-100">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 size-4 shrink-0" />
                <div>
                  <p className="font-medium">Primera versión con acceso compartido protegido</p>
                  <p className="mt-1 text-emerald-100/80">Usuario precargado para que puedas entrar y probar la aplicación nada más levantarla.</p>
                </div>
              </div>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Usuario</label>
                <Input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Usuario" />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Contraseña</label>
                <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Contraseña" />
              </div>
              <Message text={error} />
              <Button type="submit" className="w-full justify-between" disabled={loading}>
                <span>{loading ? "Accediendo..." : "Entrar en la plataforma"}</span>
                <ArrowRight className="size-4" />
              </Button>
            </form>

            <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
              Credenciales iniciales: <span className="font-semibold text-slate-200">amueci / Amueci123!</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
