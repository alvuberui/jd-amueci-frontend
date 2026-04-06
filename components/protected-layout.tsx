"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { LayoutGrid, Shirt, ScrollText, Waves, Music4, Wrench, LogOut, Package } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/vestimentas", label: "Vestimentas", icon: Shirt },
  { href: "/prestamos-vestimentas", label: "Prestamos vestimentas", icon: ScrollText },
  { href: "/lavados", label: "Lavados", icon: Waves },
  { href: "/instrumentos", label: "Instrumentos", icon: Music4 },
  { href: "/prestamos-instrumentos", label: "Prestamos instrumentos", icon: Package },
  { href: "/reparaciones", label: "Reparaciones", icon: Wrench },
];

export function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { token, user, ready, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (ready && !token) {
      router.replace("/login");
    }
  }, [ready, router, token]);

  if (!ready || !token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-mesh-dark">
      <div className="mx-auto grid min-h-screen w-full max-w-[1600px] grid-cols-1 lg:grid-cols-[290px_minmax(0,1fr)]">
        <aside className="border-b border-white/10 bg-slate-950/80 p-5 backdrop-blur-xl lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-brand-500 text-lg font-semibold text-white">A</div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">AMUECI</p>
              <h1 className="text-lg font-semibold text-white">Gestion interna</h1>
            </div>
          </div>

          <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Sesion</p>
            <p className="mt-2 text-sm text-slate-200">{user?.username}</p>
            <p className="text-sm text-slate-400">Aplicacion privada para junta directiva</p>
          </div>

          <nav className="mt-6 grid gap-2">
            {items.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${
                    active
                      ? "bg-brand-500 text-white shadow-lg shadow-brand-900/40"
                      : "text-slate-300 hover:bg-white/[0.05] hover:text-white"
                  }`}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-6">
            <Button variant="ghost" className="w-full justify-start gap-3 text-slate-300" onClick={logout}>
              <LogOut className="size-4" />
              Cerrar sesion
            </Button>
          </div>
        </aside>
        <main className="min-w-0 bg-slate-950/20">
          <div className="min-h-screen px-4 py-5 lg:px-6 lg:py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
