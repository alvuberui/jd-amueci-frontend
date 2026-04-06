"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { Button, ConfirmButton, DataTable, EmptyState, Field, Input, Message, Page, PageHeader, SearchBox, SectionCard, Select, StatusBadge, Textarea, useSearch } from "@/components/ui";
import { apiRequest, HttpError } from "@/lib/api";
import { formatDate, formatDateTime, labelize } from "@/lib/format";
import type { Garment, GarmentStatus, GarmentType } from "@/lib/types";

const garmentTypes: GarmentType[] = ["CHAQUETA", "PANTALON", "CAMISA", "PAR_DE_HOMBRERAS", "CUELLOS", "PAR_DE_MANGAS"];
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
  const [items, setItems] = useState<Garment[]>([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function load() {
    if (!token) return;
    const data = await apiRequest<Garment[]>("/api/vestimentas", {}, token);
    setItems(data);
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof HttpError ? err.message : "No se pudo cargar"));
  }, [token]);

  const { query, setQuery, filtered } = useSearch(items, (item) => [item.identifier, item.type, item.size, item.status, item.notes ?? ""]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    try {
      setError(null);
      const payload = {
        ...form,
        identifier: null,
        purchaseDate: form.purchaseDate || null,
      };
      if (editingId) {
        await apiRequest(`/api/vestimentas/${editingId}`, { method: "PUT", body: JSON.stringify(payload) }, token);
        setMessage("Vestimenta actualizada");
      } else {
        await apiRequest("/api/vestimentas", { method: "POST", body: JSON.stringify(payload) }, token);
        setMessage("Vestimenta creada");
      }
      setForm(initialForm);
      setEditingId(null);
      setFieldErrors({});
      await load();
    } catch (err) {
      setError(err instanceof HttpError ? err.message : "No se pudo guardar");
      setFieldErrors(err instanceof HttpError ? (err.fieldErrors ?? {}) : {});
    }
  }

  async function handleDelete(id: number) {
    if (!token) return;
    try {
      await apiRequest(`/api/vestimentas/${id}`, { method: "DELETE" }, token);
      setMessage("Vestimenta eliminada");
      await load();
    } catch (err) {
      setError(err instanceof HttpError ? err.message : "No se pudo eliminar");
    }
  }

  return (
    <Page>
      <PageHeader title="Vestimentas" subtitle="Inventario textil con una edición rápida y detalle operativo por recurso." />
      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
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
            <Message text={message} tone="success" />
            <Message text={error} />
            <div className="flex flex-wrap gap-3">
              <Button type="submit">{editingId ? "Guardar cambios" : "Crear vestimenta"}</Button>
              {editingId ? <Button variant="ghost" type="button" onClick={() => { setEditingId(null); setForm(initialForm); }}>Cancelar</Button> : null}
            </div>
          </form>
        </SectionCard>

        <SectionCard title="Catálogo actual" description="Búsqueda rápida, estado visible y acceso al detalle por prenda.">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SearchBox value={query} onChange={setQuery} placeholder="Buscar por identificador, talla o estado" />
          </div>
          {filtered.length === 0 ? (
            <EmptyState text="No hay vestimentas registradas todavía." />
          ) : (
            <DataTable headers={["Identificador", "Tipo", "Estado", "Talla", "Compra", "Actualizado", "Acciones"]}>
              {filtered.map((item) => (
                <tr key={item.id} className="text-slate-200">
                  <td className="px-4 py-4 font-medium text-white">{item.identifier}</td>
                  <td className="px-4 py-4">{labelize(item.type)}</td>
                  <td className="px-4 py-4"><StatusBadge value={item.status} /></td>
                  <td className="px-4 py-4">{item.size}</td>
                  <td className="px-4 py-4 text-slate-400">{formatDate(item.purchaseDate)}</td>
                  <td className="px-4 py-4 text-slate-400">{formatDateTime(item.updatedAt)}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Link className="inline-flex rounded-2xl bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/15" href={`/vestimentas/${item.id}`}>Detalle</Link>
                      <Button variant="ghost" onClick={() => { setEditingId(item.id); setForm({ type: item.type, size: item.size, status: item.status, purchaseDate: item.purchaseDate ?? "", notes: item.notes ?? "" }); }}>
                        Editar
                      </Button>
                      <ConfirmButton label="Eliminar" onConfirm={() => handleDelete(item.id)} />
                    </div>
                  </td>
                </tr>
              ))}
            </DataTable>
          )}
        </SectionCard>
      </div>
    </Page>
  );
}
