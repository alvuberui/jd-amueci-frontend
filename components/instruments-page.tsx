"use client";

import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useFeedback } from "@/components/feedback-provider";
import { Button, ConfirmButton, DataTable, EmptyState, Field, Input, LoadingState, Message, Page, PageHeader, SearchBox, SectionCard, Select, StatusBadge, Textarea, TransitionLink, useSearch } from "@/components/ui";
import { apiRequest, HttpError } from "@/lib/api";
import { formatCurrency, formatDate, formatDateTime, labelize } from "@/lib/format";
import type { Instrument, InstrumentStatus } from "@/lib/types";

const statuses: InstrumentStatus[] = ["DISPONIBLE", "PRESTADO", "EN_REPARACION", "FUERA_DE_USO"];

const initialForm = {
  name: "",
  family: "",
  brand: "",
  model: "",
  serialNumber: "",
  status: "DISPONIBLE" as InstrumentStatus,
  purchaseDate: "",
  purchasePrice: "",
  currentPrice: "",
  photoUrl: "",
  notes: "",
};

export function InstrumentsPage() {
  const { token } = useAuth();
  const { notify } = useFeedback();
  const [items, setItems] = useState<Instrument[]>([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function load() {
    if (!token) return;
    const data = await apiRequest<Instrument[]>("/api/instrumentos", {}, token);
    setItems(data);
  }

  useEffect(() => {
    setLoading(true);
    load()
      .catch((err) => {
        const message = err instanceof HttpError ? err.message : "No se pudo cargar";
        setError(message);
        notify({ title: "No se pudieron cargar los instrumentos", description: message, tone: "error" });
      })
      .finally(() => setLoading(false));
  }, [notify, token]);

  const { query, setQuery, filtered } = useSearch(items, (item) => [item.name, item.family, item.brand ?? "", item.model ?? "", item.status]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    try {
      setSubmitting(true);
      const payload = {
        ...form,
        purchaseDate: form.purchaseDate || null,
        purchasePrice: form.purchasePrice ? Number(form.purchasePrice) : null,
        currentPrice: form.currentPrice ? Number(form.currentPrice) : null,
      };
      if (editingId) {
        await apiRequest(`/api/instrumentos/${editingId}`, { method: "PUT", body: JSON.stringify(payload) }, token);
        notify({ title: "Instrumento actualizado", tone: "success" });
      } else {
        await apiRequest("/api/instrumentos", { method: "POST", body: JSON.stringify(payload) }, token);
        notify({ title: "Instrumento creado", tone: "success" });
      }
      setForm(initialForm);
      setEditingId(null);
      setFieldErrors({});
      await load();
    } catch (err) {
      const message = err instanceof HttpError ? err.message : "No se pudo guardar";
      setError(message);
      setFieldErrors(err instanceof HttpError ? (err.fieldErrors ?? {}) : {});
      notify({ title: "No se pudo guardar el instrumento", description: message, tone: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePhotoUpload(file: File) {
    if (!token) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      setUploadingPhoto(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"}/api/instrumentos/upload-photo`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const text = await response.text();
      const payload = text.trim() ? JSON.parse(text) as { message?: string; photoUrl?: string } : null;
      if (!response.ok) {
        throw new Error(payload?.message ?? "No se pudo subir la imagen");
      }
      if (!payload?.photoUrl) {
        throw new Error("El servidor no devolvio la ruta de la imagen");
      }
      const photoUrl = payload.photoUrl;
      setForm((current) => ({ ...current, photoUrl }));
      notify({ title: "Imagen subida correctamente", tone: "success" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo subir la imagen";
      setError(message);
      notify({ title: "No se pudo subir la imagen", description: message, tone: "error" });
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleDelete(id: number) {
    if (!token) return;
    try {
      setDeletingId(id);
      await apiRequest(`/api/instrumentos/${id}`, { method: "DELETE" }, token);
      notify({ title: "Instrumento eliminado", tone: "success" });
      await load();
    } catch (err) {
      const message = err instanceof HttpError ? err.message : "No se pudo eliminar";
      setError(message);
      notify({ title: "No se pudo eliminar el instrumento", description: message, tone: "error" });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Page>
      <PageHeader title="Instrumentos" subtitle="Inventario musical con contexto económico, estado operativo y acceso al detalle." />
      <div className="grid gap-6 xl:grid-cols-[440px_minmax(0,1fr)]">
        <SectionCard title={editingId ? "Editar instrumento" : "Nuevo instrumento"} description="Alta rápida con información técnica y económica.">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
              <Field label="Nombre" required error={fieldErrors.name}><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field>
              <Field label="Familia" required error={fieldErrors.family}><Input value={form.family} onChange={(event) => setForm({ ...form, family: event.target.value })} /></Field>
              <Field label="Marca" optional error={fieldErrors.brand}><Input value={form.brand} onChange={(event) => setForm({ ...form, brand: event.target.value })} /></Field>
              <Field label="Modelo" optional error={fieldErrors.model}><Input value={form.model} onChange={(event) => setForm({ ...form, model: event.target.value })} /></Field>
              <Field label="Numero de serie" optional error={fieldErrors.serialNumber}><Input value={form.serialNumber} onChange={(event) => setForm({ ...form, serialNumber: event.target.value })} /></Field>
              <Field label="Estado" required error={fieldErrors.status}>
                <Select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as InstrumentStatus })}>
                  {statuses.map((value) => <option key={value} value={value}>{labelize(value)}</option>)}
                </Select>
              </Field>
              <Field label="Fecha de compra" optional error={fieldErrors.purchaseDate}><Input type="date" value={form.purchaseDate} onChange={(event) => setForm({ ...form, purchaseDate: event.target.value })} /></Field>
              <Field label="Precio de compra" optional error={fieldErrors.purchasePrice}><Input type="number" value={form.purchasePrice} onChange={(event) => setForm({ ...form, purchasePrice: event.target.value })} /></Field>
              <Field label="Precio actual" optional error={fieldErrors.currentPrice}><Input type="number" value={form.currentPrice} onChange={(event) => setForm({ ...form, currentPrice: event.target.value })} /></Field>
              <Field label="Foto del instrumento" optional error={fieldErrors.photoUrl}>
                <div className="space-y-3">
                  <Input type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) void handlePhotoUpload(file); }} />
                  <Input value={form.photoUrl} readOnly placeholder={uploadingPhoto ? "Subiendo imagen..." : "La ruta se rellena automaticamente"} />
                </div>
              </Field>
            </div>
            <Field label="Observaciones" optional error={fieldErrors.notes}><Textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></Field>
            <Message text={error} />
            <div className={`grid gap-3 ${editingId ? "sm:grid-cols-2" : "grid-cols-1"}`}>
              <Button type="submit" loading={submitting}>{editingId ? "Guardar cambios" : "Crear instrumento"}</Button>
              {editingId ? <Button variant="ghost" type="button" onClick={() => { setEditingId(null); setForm(initialForm); }}>Cancelar</Button> : null}
            </div>
          </form>
        </SectionCard>

        <SectionCard title="Catálogo instrumental" description="Consulta rápida del parque instrumental y acceso al histórico por ficha.">
          <SearchBox value={query} onChange={setQuery} placeholder="Buscar por nombre, familia o marca" />
          {loading ? <LoadingState compact title="Cargando instrumentos" description="Preparando el catálogo musical." /> : filtered.length === 0 ? <EmptyState text="No hay instrumentos registrados todavía." /> : (
            <DataTable headers={["Nombre", "Familia", "Estado", "Compra", "Valor actual", "Acciones"]}>
              {filtered.map((item) => (
                <tr key={item.id} className="text-slate-200">
                  <td className="px-4 py-4">
                    <div className="font-medium text-white">{item.name}</div>
                    <div className="text-xs text-slate-500">{item.brand} {item.model}</div>
                  </td>
                  <td className="px-4 py-4">{item.family}</td>
                  <td className="px-4 py-4"><StatusBadge value={item.status} /></td>
                  <td className="px-4 py-4 text-slate-400">{formatDate(item.purchaseDate)}</td>
                  <td className="px-4 py-4 text-slate-400">{formatCurrency(item.currentPrice)}</td>
                  <td className="w-[220px] px-4 py-4">
                    <div className="grid min-w-[180px] gap-2">
                      <TransitionLink className="flex w-full min-h-10 items-center justify-center rounded-[16px] border border-white/10 bg-white/10 px-3.5 py-2 text-sm font-semibold text-white hover:bg-white/15" href={`/instrumentos/${item.id}`}>Detalle</TransitionLink>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setForm({
                            name: item.name,
                            family: item.family,
                            brand: item.brand ?? "",
                            model: item.model ?? "",
                            serialNumber: item.serialNumber ?? "",
                            status: item.status,
                            purchaseDate: item.purchaseDate ?? "",
                            purchasePrice: item.purchasePrice?.toString() ?? "",
                            currentPrice: item.currentPrice?.toString() ?? "",
                            photoUrl: item.photoUrl ?? "",
                            notes: item.notes ?? "",
                          });
                          setEditingId(item.id);
                        }}
                      >
                        Editar
                      </Button>
                      <ConfirmButton label="Eliminar" loading={deletingId === item.id} onConfirm={() => handleDelete(item.id)} />
                    </div>
                  </td>
                </tr>
              ))}
            </DataTable>
          )}
          <p className="text-sm text-slate-500">Última sincronización visible: {items[0] ? formatDateTime(items[0].updatedAt) : "sin datos"}</p>
        </SectionCard>
      </div>
    </Page>
  );
}
