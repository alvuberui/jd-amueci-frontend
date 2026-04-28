"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MouseEvent, useEffect, useMemo, useState, useTransition } from "react";
import { LoaderCircle, Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { labelize } from "@/lib/format";
import { useFeedback } from "@/components/feedback-provider";

export function AppShell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-slate-950 bg-mesh-dark text-slate-100">{children}</div>;
}

export function Page({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-5 py-6 lg:px-8 lg:py-8">{children}</div>;
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-2">
        <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-300">
          AMUECI
        </div>
        <div>
          <h1 className="text-[2rem] font-semibold tracking-tight text-white lg:text-[2.5rem]">{title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300 lg:text-base">{subtitle}</p>
        </div>
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}

export function Panel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-[28px] border border-white/10 bg-slate-950/55 p-6 shadow-panel backdrop-blur-xl", className)}>
      {children}
    </section>
  );
}

export function SectionCard({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Panel className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          {description ? <p className="mt-1 text-sm text-slate-400">{description}</p> : null}
        </div>
        {actions}
      </div>
      {children}
    </Panel>
  );
}

export function Button({
  children,
  className,
  variant = "primary",
  loading = false,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  loading?: boolean;
}) {
  return (
    <button
      className={cn(
        "flex w-full min-h-11 items-center justify-center gap-2 rounded-[14px] border px-4 py-2.5 text-sm font-medium shadow-sm transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/70 disabled:pointer-events-none disabled:opacity-65",
        variant === "primary" && "border-brand-400/30 bg-brand-500 text-white shadow-[0_14px_34px_rgba(27,0,58,0.34)] hover:bg-[#2a0b4d]",
        variant === "secondary" && "border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]",
        variant === "ghost" && "border-white/0 bg-transparent text-slate-300 hover:border-white/10 hover:bg-white/[0.05] hover:text-white",
        variant === "danger" && "border-rose-400/20 bg-rose-500/12 text-rose-100 hover:bg-rose-500/18",
        className,
      )}
      disabled={props.disabled || loading}
      {...props}
    >
      {loading ? <Spinner className="size-4" /> : null}
      {children}
    </button>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <LoaderCircle className={cn("animate-spin text-current", className)} />;
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return (
    <input
      className={cn("w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-brand-400 focus:ring-brand-400", className)}
      {...rest}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className, ...rest } = props;
  return (
    <select
      className={cn("w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-brand-400 focus:ring-brand-400", className)}
      {...rest}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...rest } = props;
  return (
    <textarea
      className={cn("min-h-28 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-brand-400 focus:ring-brand-400", className)}
      {...rest}
    />
  );
}

export function Field({
  label,
  required,
  optional,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm text-slate-300">
      <span className="flex flex-wrap items-center gap-2">
        {label}
        {required ? <span className="rounded-full bg-rose-400/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-rose-200">Obligatorio</span> : null}
        {optional ? <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-slate-400">Opcional</span> : null}
      </span>
      {children}
      {error ? <span className="text-xs text-rose-300">{error}</span> : null}
    </label>
  );
}

export function StatusBadge({ value }: { value: string }) {
  const tone = useMemo(() => {
    if (value.includes("DISPONIBLE")) return "bg-emerald-400/15 text-emerald-200 ring-emerald-400/20";
    if (value.includes("PREST")) return "bg-amber-400/15 text-amber-200 ring-amber-400/20";
    if (value.includes("LAVADO") || value.includes("REPARACION")) return "bg-sky-400/15 text-sky-200 ring-sky-400/20";
    return "bg-rose-400/15 text-rose-200 ring-rose-400/20";
  }, [value]);

  return (
    <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1", tone)}>
      {labelize(value)}
    </span>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] px-6 py-14 text-center text-sm text-slate-400">
      {text}
    </div>
  );
}

export function LoadingState({
  title = "Cargando contenido",
  description = "Estamos recuperando la información más reciente.",
  compact = false,
}: {
  title?: string;
  description?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn(
      "rounded-[24px] border border-white/10 bg-white/[0.03] text-center",
      compact ? "px-5 py-8" : "px-6 py-14",
    )}>
      <div className="mx-auto flex size-14 items-center justify-center rounded-[18px] border border-white/10 bg-white/[0.03]">
        <Spinner className="size-6 text-brand-300" />
      </div>
      <p className="mt-4 text-base font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm text-slate-400">{description}</p>
    </div>
  );
}

export function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
      <Input className="pl-11" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </div>
  );
}

export function ConfirmButton({
  label,
  onConfirm,
  loading = false,
}: {
  label: string;
  onConfirm: () => void;
  loading?: boolean;
}) {
  return (
    <Button
      variant="danger"
      loading={loading}
      onClick={() => {
        if (window.confirm("Confirma que deseas eliminar este elemento.")) onConfirm();
      }}
    >
      {label}
    </Button>
  );
}

export function Message({ text, tone = "error" }: { text?: string | null; tone?: "error" | "success" }) {
  if (!text) return null;
  return (
    <div className={cn(
      "rounded-[18px] border px-4 py-3 text-sm",
      tone === "error" && "border-rose-400/20 bg-rose-500/10 text-rose-50",
      tone === "success" && "border-emerald-400/20 bg-emerald-500/10 text-emerald-50",
    )}>
      {text}
    </div>
  );
}

export function TransitionLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { showLoader, hideLoader } = useFeedback();

  useEffect(() => {
    if (pathname === href) {
      hideLoader();
    }
  }, [hideLoader, href, pathname]);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      pathname === href
    ) {
      return;
    }

    event.preventDefault();
    showLoader("Abriendo sección");
    startTransition(() => {
      router.push(href);
    });
  }

  return (
    <Link href={href} className={className} onClick={handleClick} aria-busy={isPending}>
      {children}
    </Link>
  );
}

export function DataTable({
  headers,
  children,
}: {
  headers: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-white/10 bg-slate-950/35">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/10 text-sm">
          <thead className="bg-white/[0.04] text-left text-[11px] uppercase tracking-[0.16em] text-slate-400">
            <tr>{headers.map((header) => <th key={header} className="px-4 py-4 font-medium">{header}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-white/5">{children}</tbody>
        </table>
      </div>
    </div>
  );
}

export function useSearch<T>(items: T[], getter: (item: T) => string[]) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return items;
    return items.filter((item) => getter(item).some((value) => value.toLowerCase().includes(normalized)));
  }, [getter, items, query]);

  return { query, setQuery, filtered };
}
