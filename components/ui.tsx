"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MouseEvent, useEffect, useMemo, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, LoaderCircle, Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { labelize } from "@/lib/format";
import { useFeedback } from "@/components/feedback-provider";

export function AppShell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-slate-950 bg-mesh-dark text-slate-100">{children}</div>;
}

export function Page({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-6 px-5 py-6 lg:px-8 lg:py-8">{children}</div>;
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
  const minTableWidth = Math.max(820, headers.length * 155);

  return (
    <div className="overflow-hidden rounded-[24px] border border-white/10 bg-slate-950/35">
      <div className="max-h-[min(64vh,680px)] overflow-auto">
        <table className="w-full divide-y divide-white/10 text-sm" style={{ minWidth: `${minTableWidth}px` }}>
          <thead className="sticky top-0 z-10 bg-slate-900/95 text-left text-[11px] uppercase tracking-[0.16em] text-slate-400 backdrop-blur">
            <tr>{headers.map((header) => <th key={header} className="whitespace-nowrap px-4 py-4 font-medium">{header}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-white/5">{children}</tbody>
        </table>
      </div>
    </div>
  );
}

export type FilterableColumn<T> = {
  header: string;
  render: (item: T) => React.ReactNode;
  filterValue?: (item: T) => string | number | boolean | null | undefined;
  sortValue?: (item: T) => string | number | boolean | null | undefined;
  cellClassName?: string | ((item: T) => string);
  filterable?: boolean;
  sortable?: boolean;
  minWidth?: number;
};

type SortDirection = "asc" | "desc";

type SortState = {
  columnIndex: number;
  direction: SortDirection;
} | null;

export function FilterableDataTable<T>({
  columns,
  rows,
  getRowKey,
  emptyText = "No hay registros que coincidan con los filtros.",
}: {
  columns: FilterableColumn<T>[];
  rows: T[];
  getRowKey: (item: T, index: number) => React.Key;
  emptyText?: string;
}) {
  const [filters, setFilters] = useState<string[]>(() => columns.map(() => ""));
  const [sort, setSort] = useState<SortState>(null);

  useEffect(() => {
    setFilters((current) => columns.map((_, index) => current[index] ?? ""));
    setSort((current) => current && current.columnIndex >= columns.length ? null : current);
  }, [columns.length]);

  const visibleRows = useMemo(() => {
    const filteredRows = rows.filter((row) => columns.every((column, index) => {
      if (column.filterable === false) return true;
      const filter = normalizeFilter(filters[index] ?? "");
      if (!filter) return true;
      const value = column.filterValue ? column.filterValue(row) : "";
      return normalizeFilter(value).includes(filter);
    }));

    if (!sort) return filteredRows;

    const sortedColumn = columns[sort.columnIndex];
    if (!isSortableColumn(sortedColumn)) return filteredRows;

    return filteredRows
      .map((row, index) => ({ row, index }))
      .sort((left, right) => {
        const comparison = compareSortValues(getColumnSortValue(sortedColumn, left.row), getColumnSortValue(sortedColumn, right.row));
        if (comparison !== 0) return sort.direction === "asc" ? comparison : -comparison;
        return left.index - right.index;
      })
      .map(({ row }) => row);
  }, [columns, filters, rows, sort]);

  const minTableWidth = Math.max(820, columns.reduce((total, column) => total + (column.minWidth ?? 155), 0));

  function toggleSort(columnIndex: number) {
    setSort((current) => {
      if (!current || current.columnIndex !== columnIndex) return { columnIndex, direction: "asc" };
      if (current.direction === "asc") return { columnIndex, direction: "desc" };
      return null;
    });
  }

  if (rows.length === 0) {
    return <EmptyState text="No hay registros disponibles." />;
  }

  return (
    <div className="overflow-hidden rounded-[24px] border border-white/10 bg-slate-950/35">
      <div className="max-h-[min(64vh,680px)] overflow-auto">
        <table className="w-full divide-y divide-white/10 text-sm" style={{ minWidth: `${minTableWidth}px` }}>
          <thead className="sticky top-0 z-10 bg-slate-900/95 text-left backdrop-blur">
            <tr className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
              {columns.map((column, index) => {
                const sortable = isSortableColumn(column);
                const activeSortDirection = sort?.columnIndex === index ? sort.direction : null;
                const SortIcon = activeSortDirection === null ? ArrowUpDown : activeSortDirection === "asc" ? ArrowUp : ArrowDown;
                return (
                  <th
                    key={column.header}
                    className="whitespace-nowrap px-4 pb-2 pt-4 font-medium"
                    aria-sort={activeSortDirection === "asc" ? "ascending" : activeSortDirection === "desc" ? "descending" : undefined}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        className={cn(
                          "-ml-2 inline-flex max-w-full items-center gap-1.5 rounded-lg px-2 py-1 text-left transition hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/70",
                          activeSortDirection && "text-white",
                        )}
                        title={`Ordenar por ${column.header}`}
                        aria-label={`Ordenar por ${column.header}`}
                        onClick={() => toggleSort(index)}
                      >
                        <span className="truncate">{column.header}</span>
                        <SortIcon className="size-3.5 shrink-0" />
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
            <tr>
              {columns.map((column, index) => (
                <th key={`${column.header}-filter`} className="px-4 pb-4">
                  {column.filterable === false ? (
                    <div className="h-9" />
                  ) : (
                    <Input
                      aria-label={`Filtrar ${column.header}`}
                      className="h-9 rounded-xl px-3 py-2 text-xs font-normal normal-case tracking-normal"
                      placeholder="Filtrar"
                      value={filters[index] ?? ""}
                      onChange={(event) => setFilters((current) => current.map((value, currentIndex) => currentIndex === index ? event.target.value : value))}
                    />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {visibleRows.length === 0 ? (
              <tr>
                <td className="px-4 py-10 text-center text-sm text-slate-400" colSpan={columns.length}>
                  {emptyText}
                </td>
              </tr>
            ) : visibleRows.map((row, index) => (
              <tr key={getRowKey(row, index)}>
                {columns.map((column) => (
                  <td key={column.header} className={cn("px-4 py-4 align-top text-slate-300", typeof column.cellClassName === "function" ? column.cellClassName(row) : column.cellClassName)}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function isSortableColumn<T>(column: FilterableColumn<T> | undefined) {
  return Boolean(column && column.filterable !== false && column.sortable !== false && (column.sortValue || column.filterValue));
}

function getColumnSortValue<T>(column: FilterableColumn<T>, item: T) {
  return column.sortValue ? column.sortValue(item) : column.filterValue ? column.filterValue(item) : "";
}

function compareSortValues(
  leftValue: string | number | boolean | null | undefined,
  rightValue: string | number | boolean | null | undefined,
) {
  const left = toComparableSortValue(leftValue);
  const right = toComparableSortValue(rightValue);

  if (left === null && right === null) return 0;
  if (left === null) return 1;
  if (right === null) return -1;

  if (typeof left === "number" && typeof right === "number") {
    return left - right;
  }

  return String(left).localeCompare(String(right), "es", { numeric: true, sensitivity: "base" });
}

function toComparableSortValue(value: string | number | boolean | null | undefined): string | number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  if (typeof value === "boolean") return value ? 1 : 0;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const isoDateMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2}))?/);
  if (isoDateMatch) {
    const [, year, month, day, hour = "0", minute = "0"] = isoDateMatch;
    return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute)).getTime();
  }

  const spanishDateMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:,?\s+(\d{1,2}):(\d{2}))?/);
  if (spanishDateMatch) {
    const [, day, month, year, hour = "0", minute = "0"] = spanishDateMatch;
    const fullYear = year.length === 2 ? Number(`20${year}`) : Number(year);
    return new Date(fullYear, Number(month) - 1, Number(day), Number(hour), Number(minute)).getTime();
  }

  const timeMatch = trimmed.match(/^(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    const [, hour, minute] = timeMatch;
    return Number(hour) * 60 + Number(minute);
  }

  return normalizeFilter(trimmed);
}

function normalizeFilter(value: string | number | boolean | null | undefined) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
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
