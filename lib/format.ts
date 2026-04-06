export function formatDate(value?: string | null) {
  if (!value) return "Sin dato";
  return new Intl.DateTimeFormat("es-ES").format(new Date(value));
}

export function formatDateTime(value?: string | null) {
  if (!value) return "Sin dato";
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatCurrency(value?: number | null) {
  if (value === null || value === undefined) return "Sin dato";
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(value);
}

export function labelize(value: string) {
  return value.split("_").join(" ").toLowerCase().replace(/^\w/, (letter) => letter.toUpperCase());
}
