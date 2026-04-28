"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { LayoutGrid, Shirt, ScrollText, Waves, Music4, Wrench, LogOut, Package, Users, BriefcaseBusiness, UserCircle2, School, CalendarClock, DoorOpen } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { Button, TransitionLink } from "@/components/ui";

const memberItems = [
  { href: "/mi-perfil", label: "Mi perfil", icon: UserCircle2 },
  { href: "/mi-agenda", label: "Mi agenda", icon: CalendarClock },
  { href: "/mis-prestamos", label: "Mis préstamos", icon: BriefcaseBusiness },
  { href: "/disponibilidad-aulas", label: "Disponibilidad de aulas", icon: DoorOpen },
];

const boardItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/socios", label: "Socios", icon: Users },
  { href: "/aulas", label: "Aulas", icon: DoorOpen },
  { href: "/vestimentas", label: "Vestimentas", icon: Shirt },
  { href: "/prestamos-vestimentas", label: "Préstamos de vestimentas", icon: ScrollText },
  { href: "/lavados", label: "Lavados", icon: Waves },
  { href: "/instrumentos", label: "Instrumentos", icon: Music4 },
  { href: "/prestamos-instrumentos", label: "Préstamos de instrumentos", icon: Package },
  { href: "/reparaciones", label: "Reparaciones", icon: Wrench },
];

const schoolItems = [
  { href: "/escuela", label: "Escuela", icon: School },
];

export function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { token, user, ready, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isBoard = user?.roles.includes("DIRECTIVA") ?? false;
  const isSchoolDirector = user?.roles.includes("DIRECCION_ESCUELA") ?? false;
  const isSocio = user?.roles.includes("SOCIO") ?? false;
  const isTeacher = user?.roles.includes("PROFESOR") ?? false;
  const hasSchoolProfile = user?.roles.includes("PROFESOR") || user?.roles.includes("ALUMNO") || user?.roles.includes("SOCIO");
  const canAccessRoomAvailability = isSocio || isTeacher || isBoard;
  const personalItems = memberItems.filter((item) => item.href !== "/disponibilidad-aulas" || canAccessRoomAvailability);
  const navGroups = [
    { title: "Acceso personal", items: personalItems },
    ...(isSchoolDirector ? [{ title: "Dirección de escuela", items: schoolItems }] : []),
    ...(isBoard ? [{ title: "Acceso de directiva", items: boardItems }] : []),
  ];
  const allowedPaths = new Set(navGroups.flatMap((group) => group.items.map((item) => item.href)));

  useEffect(() => {
    if (ready && !token) {
      router.replace("/login");
    }
  }, [ready, router, token]);

  useEffect(() => {
    if (!ready || !token || !user) return;

    const isAllowedPath = Array.from(allowedPaths).some((path) => pathname === path || pathname.startsWith(`${path}/`));
    if (!isAllowedPath) {
      router.replace(isBoard ? "/dashboard" : isSchoolDirector ? "/escuela" : "/mi-agenda");
    }
  }, [allowedPaths, hasSchoolProfile, isBoard, isSchoolDirector, pathname, ready, router, token, user]);

  if (!ready || !token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-mesh-dark">
      <div className="mx-auto grid min-h-screen w-full max-w-[1600px] grid-cols-1 lg:grid-cols-[308px_minmax(0,1fr)]">
        <aside className="border-b border-white/10 bg-slate-950/72 p-5 backdrop-blur-2xl lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-3 rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
            <div className="flex size-12 items-center justify-center rounded-[16px] bg-brand-500 text-lg font-semibold text-white shadow-[0_10px_26px_rgba(47,125,246,0.35)]">A</div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">AMUECI</p>
              <h1 className="text-lg font-semibold text-white">Gestión interna</h1>
            </div>
          </div>

          <div className="mt-5 rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Sesión activa</p>
            <p className="mt-2 text-sm font-medium text-slate-100">{user?.displayName}</p>
            <p className="mt-1 text-sm text-slate-400">
              {isBoard
                ? "Acceso completo a banda, inventario, socios y reservas de la banda."
                : isSchoolDirector
                  ? "Acceso a la planificación académica y al control de la escuela."
                  : hasSchoolProfile
                  ? "Consulta tus clases, tus reservas y la disponibilidad diaria de aulas."
                  : "Consulta personal de préstamos, reservas y disponibilidad de aulas."}
            </p>
          </div>

          <nav className="mt-6 space-y-5">
            {navGroups.map((group) => (
              <div key={group.title}>
                <p className="px-3 text-[11px] uppercase tracking-[0.24em] text-slate-500">{group.title}</p>
                <div className="mt-2 grid gap-1.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = pathname === item.href;
                    return (
                      <TransitionLink
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 rounded-[18px] px-4 py-3 text-sm transition ${
                          active
                            ? "border border-brand-400/40 bg-brand-500/18 text-white"
                            : "border border-transparent text-slate-300 hover:border-white/10 hover:bg-white/[0.04] hover:text-white"
                        }`}
                      >
                        <div className={active ? "text-brand-200" : "text-slate-500"}>
                          <Icon className="size-4" />
                        </div>
                        <span className="leading-5">{item.label}</span>
                      </TransitionLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="mt-8">
            <Button variant="ghost" className="w-full justify-start gap-3 text-slate-300" onClick={logout}>
              <LogOut className="size-4" />
              Cerrar sesión
            </Button>
          </div>
        </aside>
        <main className="min-w-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0))]">
          <div className="min-h-screen px-4 py-5 lg:px-8 lg:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
