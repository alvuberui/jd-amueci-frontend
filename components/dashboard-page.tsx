"use client";

import { useEffect, useState } from "react";
import { ArrowRight, ChartNoAxesCombined, Music4, Shirt, Waves, Wrench } from "lucide-react";
import { Button, LoadingState, Page, PageHeader, Panel, TransitionLink } from "@/components/ui";
import { useAuth } from "@/components/auth-provider";
import { useFeedback } from "@/components/feedback-provider";
import { apiRequest, HttpError } from "@/lib/api";
import type { Summary } from "@/lib/types";

const emptySummary: Summary = {
  totalVestimentas: 0,
  totalInstrumentos: 0,
  vestimentasPrestadas: 0,
  instrumentosPrestados: 0,
  instrumentosEnReparacion: 0,
  vestimentasEnLavado: 0,
};

export function DashboardPage() {
  const { token } = useAuth();
  const [summary, setSummary] = useState<Summary>(emptySummary);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { notify } = useFeedback();

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    apiRequest<Summary>("/api/dashboard/summary", {}, token)
      .then(setSummary)
      .catch((err) => {
        const message = err instanceof HttpError ? err.message : "No se pudo cargar el dashboard";
        setError(message);
        notify({ title: "No se pudo cargar el dashboard", description: message, tone: "error" });
      })
      .finally(() => setLoading(false));
  }, [notify, token]);

  const cards = [
    { label: "Vestimentas", value: summary.totalVestimentas, accent: "from-brand-500/14 to-transparent" },
    { label: "Instrumentos", value: summary.totalInstrumentos, accent: "from-sky-500/14 to-transparent" },
    { label: "Vestimentas prestadas", value: summary.vestimentasPrestadas, accent: "from-amber-500/14 to-transparent" },
    { label: "Instrumentos prestados", value: summary.instrumentosPrestados, accent: "from-emerald-500/14 to-transparent" },
    { label: "Instrumentos en reparación", value: summary.instrumentosEnReparacion, accent: "from-rose-500/14 to-transparent" },
    { label: "Vestimentas en lavado", value: summary.vestimentasEnLavado, accent: "from-cyan-500/14 to-transparent" },
  ];

  const quickLinks = [
    { href: "/vestimentas", label: "Gestionar vestimentas", icon: Shirt },
    { href: "/instrumentos", label: "Gestionar instrumentos", icon: Music4 },
    { href: "/lavados", label: "Controlar lavados", icon: Waves },
    { href: "/reparaciones", label: "Seguir reparaciones", icon: Wrench },
  ];

  return (
    <Page>
      <PageHeader
        title="Dashboard"
        subtitle="Resumen general del material y accesos directos a las tareas más frecuentes."
        actions={
          <Button variant="secondary" className="w-full sm:w-auto gap-2">
            <ChartNoAxesCombined className="size-4" />
            Estado general
          </Button>
        }
      />

      {error ? <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</div> : null}

      {loading ? <LoadingState title="Cargando dashboard" description="Preparando los indicadores principales." /> : (
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <article key={card.label} className={`overflow-hidden rounded-[24px] border border-white/10 bg-gradient-to-br ${card.accent} p-6 shadow-panel`}>
            <div className="text-sm text-slate-400">{card.label}</div>
            <div className="mt-5 flex items-end justify-between">
              <strong className="text-4xl font-semibold text-white">{card.value}</strong>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-slate-400">Actualizado</span>
            </div>
          </article>
        ))}
      </section>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel className="space-y-5">
          <div>
            <h2 className="text-xl font-semibold text-white">Accesos directos</h2>
            <p className="mt-1 text-sm text-slate-400">Enlaces rápidos a las áreas que más se usan en la operativa diaria.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <TransitionLink key={link.href} href={link.href} className="group rounded-[22px] border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/15 hover:bg-white/[0.05]">
                  <div className="flex items-center justify-between">
                    <div className="flex size-12 items-center justify-center rounded-[16px] border border-white/10 bg-white/[0.04] text-brand-200">
                      <Icon className="size-5" />
                    </div>
                    <ArrowRight className="size-4 text-slate-500 transition group-hover:translate-x-1 group-hover:text-white" />
                  </div>
                  <p className="mt-4 text-base font-medium text-white">{link.label}</p>
                </TransitionLink>
              );
            })}
          </div>
        </Panel>

        <Panel className="space-y-5">
          <div>
            <h2 className="text-xl font-semibold text-white">Situación actual</h2>
            <p className="mt-1 text-sm text-slate-400">Una lectura rápida de disponibilidad, actividad e incidencias.</p>
          </div>
          <div className="space-y-4">
            {[
              ["Recursos disponibles", `${summary.totalVestimentas + summary.totalInstrumentos} activos en catálogo`],
              ["Recursos con movimiento", `${summary.vestimentasPrestadas + summary.instrumentosPrestados} préstamos activos`],
              ["Incidencias operativas", `${summary.vestimentasEnLavado + summary.instrumentosEnReparacion} elementos en tratamiento`],
            ].map(([title, text]) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <p className="text-sm font-medium text-white">{title}</p>
                <p className="mt-1 text-sm text-slate-400">{text}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </Page>
  );
}
