"use client";

import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useFeedback } from "@/components/feedback-provider";
import { Button, ConfirmButton, EmptyState, Field, FilterableDataTable, Input, LoadingState, Message, Page, PageHeader, SearchBox, SectionCard, Select, StatusBadge, Textarea, TransitionLink, useSearch } from "@/components/ui";
import { apiRequest, HttpError } from "@/lib/api";
import { formatDate, formatDateTime, labelize } from "@/lib/format";
import type { Garment, GarmentStatus, GarmentType } from "@/lib/types";

const garmentTypes: GarmentType[] = ["CHAQUETA", "PANTALON", "CAMISA", "BOLSO_ARREOS", "PAR_DE_HOMBRERAS", "CUELLOS", "PAR_DE_MANGAS"];
const garmentStatuses: GarmentStatus[] = ["DISPONIBLE", "PRESTADA", "EN_LAVADO", "FUERA_DE_USO"];

const initialForm = {
  type: "CHAQUETA" as GarmentType,
  size: "",
  status: "DISPONIBLE" as GarmentStatus,
  purchaseDate: "",
  notes: "",
};

export function GarmentsPage() {
  const { token } = useAuth();
  const { notify } = useFeedback();
  const [items, setItems] = useState<Garment[]>([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function load() {
    if (!token) return;
    const data = await apiRequest<Garment[]>("/api/vestimentas", {}, token);
    setItems(data);
  }

  useEffect(() => {
    setLoading(true);
    load()
      .catch((err) => {
        const message = err instanceof HttpError ? err.message : "No se pudo cargar";
        setError(message);
        notify({ title: "No se pudieron cargar las vestimentas", description: message, tone: "error" });
      })
      .finally(() => setLoading(false));
  }, [notify, token]);

  const { query, setQuery, filtered } = useSearch(items, (item) => [item.identifier, item.type, item.size, item.status, item.notes ?? ""]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    try {
      setSubmitting(true);
      setError(null);
      const currentIdentifier = editingId ? items.find((item) => item.id === editingId)?.identifier ?? null : null;
      const payload = {
        ...form,
        identifier: currentIdentifier,
        purchaseDate: form.purchaseDate || null,
      };
      if (editingId) {
        await apiRequest(`/api/vestimentas/${editingId}`, { method: "PUT", body: JSON.stringify(payload) }, token);
        notify({ title: "Vestimenta actualizada", tone: "success" });
      } else {
        await apiRequest("/api/vestimentas", { method: "POST", body: JSON.stringify(payload) }, token);
        notify({ title: "Vestimenta creada", tone: "success" });
      }
      setForm(initialForm);
      setEditingId(null);
      setFieldErrors({});
      await load();
    } catch (err) {
      const message = err instanceof HttpError ? err.message : "No se pudo guardar";
      setError(message);
      setFieldErrors(err instanceof HttpError ? (err.fieldErrors ?? {}) : {});
      notify({ title: "No se pudo guardar la vestimenta", description: message, tone: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!token) return;
    try {
      setDeletingId(id);
      await apiRequest(`/api/vestimentas/${id}`, { method: "DELETE" }, token);
      notify({ title: "Vestimenta eliminada", tone: "success" });
      await load();
    } catch (err) {
      const message = err instanceof HttpError ? err.message : "No se pudo eliminar";
      setError(message);
      notify({ title: "No se pudo eliminar la vestimenta", description: message, tone: "error" });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Page>
      <PageHeader title="Vestimentas" subtitle="Inventario textil con una edición rápida y detalle operativo por recurso." />
      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <SectionCard title={editingId ? "Editar vestimenta" : "Nueva vestimenta"} description="Formulario optimizado para altas y cambios frecuentes.">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
              <Field label="Tipo" required error={fieldErrors.type}>
                <Select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as GarmentType })}>
                  {garmentTypes.map((value) => <option key={value} value={value}>{labelize(value)}</option>)}
                </Select>
              </Field>
              <Field label="Identificador interno" optional>
                <Input value={editingId ? items.find((item) => item.id === editingId)?.identifier ?? "" : "Se genera automaticamente al crear"} readOnly />
              </Field>
              <Field label="Talla" required error={fieldErrors.size}>
                <Input value={form.size} onChange={(event) => setForm({ ...form, size: event.target.value })} />
              </Field>
              <Field label="Estado" required error={fieldErrors.status}>
                <Select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as GarmentStatus })}>
                  {garmentStatuses.map((value) => <option key={value} value={value}>{labelize(value)}</option>)}
                </Select>
              </Field>
              <Field label="Fecha de compra" optional error={fieldErrors.purchaseDate}>
                <Input type="date" value={form.purchaseDate} onChange={(event) => setForm({ ...form, purchaseDate: event.target.value })} />
              </Field>
            </div>
            <Field label="Observaciones" optional error={fieldErrors.notes}>
              <Textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
            </Field>
            <Message text={error} />
            <div className={`grid gap-3 ${editingId ? "sm:grid-cols-2" : "grid-cols-1"}`}>
              <Button type="submit" loading={submitting}>{editingId ? "Guardar cambios" : "Crear vestimenta"}</Button>
              {editingId ? <Button variant="ghost" type="button" onClick={() => { setEditingId(null); setForm(initialForm); }}>Cancelar</Button> : null}
            </div>
          </form>
        </SectionCard>

        <SectionCard title="Catálogo actual" description="Búsqueda rápida, estado visible y acceso al detalle por prenda.">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SearchBox value={query} onChange={setQuery} placeholder="Buscar por identificador, talla o estado" />
          </div>
          {loading ? (
            <LoadingState compact title="Cargando vestimentas" description="Consultando el inventario textil." />
          ) : filtered.length === 0 ? (
            <EmptyState text="No hay vestimentas registradas todavía." />
          ) : (
            <FilterableDataTable
              rows={filtered}
              getRowKey={(item) => item.id}
              columns={[
                { header: "Identificador", filterValue: (item) => item.identifier, render: (item) => <span className="font-medium text-white">{item.identifier}</span>, minWidth: 170 },
                { header: "Tipo", filterValue: (item) => labelize(item.type), render: (item) => labelize(item.type), minWidth: 190 },
                { header: "Estado", filterValue: (item) => labelize(item.status), render: (item) => <StatusBadge value={item.status} />, minWidth: 160 },
                { header: "Talla", filterValue: (item) => item.size, render: (item) => item.size, minWidth: 110 },
                { header: "Compra", filterValue: (item) => formatDate(item.purchaseDate), render: (item) => <span className="text-slate-400">{formatDate(item.purchaseDate)}</span>, minWidth: 150 },
                { header: "Actualizado", filterValue: (item) => formatDateTime(item.updatedAt), render: (item) => <span className="text-slate-400">{formatDateTime(item.updatedAt)}</span>, minWidth: 190 },
                { header: "Acciones", filterable: false, render: (item) => (
                  <div className="grid min-w-[180px] gap-2">
                    <TransitionLink className="flex w-full min-h-10 items-center justify-center rounded-[16px] border border-white/10 bg-white/10 px-3.5 py-2 text-sm font-semibold text-white hover:bg-white/15" href={`/vestimentas/${item.id}`}>Detalle</TransitionLink>
                    <Button variant="ghost" onClick={() => { setEditingId(item.id); setForm({ type: item.type, size: item.size, status: item.status, purchaseDate: item.purchaseDate ?? "", notes: item.notes ?? "" }); }}>
                      Editar
                    </Button>
                    <ConfirmButton label="Eliminar" loading={deletingId === item.id} onConfirm={() => handleDelete(item.id)} />
                  </div>
                ), cellClassName: "w-[220px]", minWidth: 220 },
              ]}
            />
          )}
        </SectionCard>
      </div>
    </Page>
  );
}
