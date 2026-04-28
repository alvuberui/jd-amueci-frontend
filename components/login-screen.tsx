"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, LockKeyhole, ShieldCheck, Sparkles, Users, FileCheck2 } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { Button, Input, Message } from "@/components/ui";
import { useFeedback } from "@/components/feedback-provider";
import { HttpError } from "@/lib/api";

export function LoginScreen() {
  const { login } = useAuth();
  const { notify, showLoader, hideLoader } = useFeedback();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      setLoading(true);
      setError(null);
      showLoader("Validando acceso");
      await login({ username, password });
      notify({ title: "Sesión iniciada", description: "Estamos entrando en la plataforma.", tone: "success" });
    } catch (err) {
      const message = err instanceof HttpError ? err.message : "No se pudo iniciar sesion";
      setError(message);
      notify({ title: "Acceso denegado", description: message, tone: "error" });
    } finally {
      hideLoader();
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-mesh-dark">
      <div className="mx-auto grid min-h-screen max-w-[1380px] items-center gap-10 px-5 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <section className="relative overflow-hidden rounded-[40px] border border-white/10 bg-white/[0.04] p-8 shadow-panel backdrop-blur-2xl lg:p-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(27,0,58,0.42),transparent_30%),radial-gradient(circle_at_80%_22%,rgba(120,86,173,0.16),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0))]" />
          <div className="relative space-y-10">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-[11px] uppercase tracking-[0.26em] text-slate-300">
                <Sparkles className="size-3.5" />
                AMUECI · Gestión interna
              </div>
              <div className="space-y-4">
                <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-white lg:text-[4rem] lg:leading-[1.02]">
                  La plataforma interna para gestionar socios, inventario y operaciones de la banda.
                </h1>
                <p className="max-w-xl text-base leading-8 text-slate-300 lg:text-lg">
                  La plataforma reúne inventario, operaciones y seguimiento de socios en un único entorno privado, con una experiencia pensada para trabajar rápido y sin fricción.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {[
                ["Inventario vivo", "Vestimentas e instrumentos con estado actualizado y trazabilidad."],
                ["Socios y permisos", "Cada persona entra con el nivel de acceso que realmente le corresponde."],
                ["Histórico claro", "Préstamos, lavados y reparaciones organizados sin ruido visual."],
              ].map(([title, text], index) => {
                const icons = [FileCheck2, Users, ShieldCheck];
                const Icon = icons[index];
                return (
                  <div key={title} className="rounded-[24px] border border-white/10 bg-slate-950/28 p-5">
                    <div className="flex size-11 items-center justify-center rounded-[18px] bg-brand-500/18 text-brand-100">
                      <Icon className="size-5" />
                    </div>
                    <p className="mt-4 text-sm font-semibold text-white">{title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="relative">
          <div className="absolute inset-0 rounded-[40px] bg-[radial-gradient(circle_at_top,rgba(27,0,58,0.28),transparent_45%)] blur-3xl" />
          <div className="relative overflow-hidden rounded-[40px] border border-white/10 bg-slate-950/86 p-8 shadow-panel backdrop-blur-2xl lg:p-10">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-300/60 to-transparent" />

            <div className="mb-8 flex items-center gap-4">
              <div className="flex size-14 items-center justify-center rounded-[20px] bg-brand-500/18 text-brand-100">
                <LockKeyhole className="size-6" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.26em] text-slate-500">Acceso privado</p>
                <h2 className="text-2xl font-semibold text-white">Iniciar sesión</h2>
              </div>
            </div>

            <div className="mb-8 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm font-semibold text-white">Socios</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Consulta personal de préstamos de instrumento y vestimenta.
                </p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm font-semibold text-white">Directiva</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Acceso completo a la gestión, manteniendo también el perfil de socio.
                </p>
              </div>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Usuario</label>
                <Input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Introduce tu usuario" autoComplete="username" />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Contraseña</label>
                <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Introduce tu contraseña" autoComplete="current-password" />
              </div>
              <Message text={error} />
              <Button type="submit" className="w-full justify-between" loading={loading}>
                <span>{loading ? "Accediendo..." : "Entrar"}</span>
                <ArrowRight className="size-4" />
              </Button>
            </form>

            <div className="mt-8 rounded-[22px] border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand-200" />
                <p className="text-sm leading-6 text-slate-400">
                  Las credenciales se asignan desde la propia asociación. Si todavía no tienes acceso, solicita el alta a la junta directiva.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
