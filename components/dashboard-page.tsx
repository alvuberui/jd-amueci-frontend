"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChartNoAxesCombined, Music4, Shirt, Waves, Wrench } from "lucide-react";
import { Button, Page, PageHeader, Panel } from "@/components/ui";
import { useAuth } from "@/components/auth-provider";
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

  useEffect(() => {
    if (!token) return;
    apiRequest<Summary>("/api/dashboard/summary", {}, token)
      .then(setSummary)
      .catch((err) => setError(err instanceof HttpError ? err.message : "No se pudo cargar el dashboard"));
  }, [token]);

  const cards = [
    { label: "Vestimentas", value: summary.totalVestimentas, accent: "from-fuchsia-500/20 to-brand-500/5" },
    { label: "Instrumentos", value: summary.totalInstrumentos, accent: "from-sky-500/20 to-slate-900/10" },
    { label: "Vestimentas prestadas", value: summary.vestimentasPrestadas, accent: "from-amber-500/20 to-slate-900/10" },
    { label: "Instrumentos prestados", value: summary.instrumentosPrestados, accent: "from-emerald-500/20 to-slate-900/10" },
    { label: "Instrumentos en reparacion", value: summary.instrumentosEnReparacion, accent: "from-rose-500/20 to-slate-900/10" },
    { label: "Vestimentas en lavado", value: summary.vestimentasEnLavado, accent: "from-cyan-500/20 to-slate-900/10" },
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
        subtitle="Visión ejecutiva del estado del material y acceso directo a las áreas clave de operación."
        actions={
          <Button className="gap-2">
            <ChartNoAxesCombined className="size-4" />
            Resumen operativo
          </Button>
        }
      />

      {error ? <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</div> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <article key={card.label} className={`overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br ${card.accent} p-6 shadow-panel`}>
            <div className="text-sm text-slate-300">{card.label}</div>
            <div className="mt-6 flex items-end justify-between">
              <strong className="text-4xl font-semibold text-white">{card.value}</strong>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-400">Live</span>
            </div>
          </article>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel className="space-y-5">
          <div>
            <h2 className="text-xl font-semibold text-white">Atajos operativos</h2>
            <p className="mt-1 text-sm text-slate-400">Entradas rápidas para la operativa más frecuente del día a día.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link key={link.href} href={link.href} className="group rounded-[26px] border border-white/10 bg-white/[0.03] p-5 transition hover:border-brand-400/50 hover:bg-brand-500/10">
                  <div className="flex items-center justify-between">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-white/5 text-brand-200">
                      <Icon className="size-5" />
                    </div>
                    <ArrowRight className="size-4 text-slate-500 transition group-hover:translate-x-1 group-hover:text-white" />
                  </div>
                  <p className="mt-4 text-base font-medium text-white">{link.label}</p>
                </Link>
              );
            })}
          </div>
        </Panel>

        <Panel className="space-y-5">
          <div>
            <h2 className="text-xl font-semibold text-white">Estado general</h2>
            <p className="mt-1 text-sm text-slate-400">La primera versión ya concentra inventario, cesiones, lavados y reparaciones.</p>
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
