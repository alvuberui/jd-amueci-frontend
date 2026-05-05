"use client";

import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useFeedback } from "@/components/feedback-provider";
import { Button, ConfirmButton, EmptyState, Field, FilterableDataTable, Input, LoadingState, Message, Page, PageHeader, SearchBox, SectionCard, useSearch } from "@/components/ui";
import { HttpError, apiRequest } from "@/lib/api";
import type { Room } from "@/lib/types";

const initialForm = { name: "", description: "", capacity: "", active: true };

export function RoomsPage() {
  const { token } = useAuth();
  const { notify } = useFeedback();
  const [items, setItems] = useState<Room[]>([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!token) return;
    const rooms = await apiRequest<Room[]>("/api/aulas", {}, token);
    setItems(rooms);
  }

  useEffect(() => {
    setLoading(true);
    load().catch((err) => {
      const message = err instanceof HttpError ? err.message : "No se pudieron cargar las aulas";
      setError(message);
      notify({ title: "No se pudieron cargar las aulas", description: message, tone: "error" });
    }).finally(() => setLoading(false));
  }, [notify, token]);

  const { query, setQuery, filtered } = useSearch(items, (item) => [item.name, item.description ?? ""]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      const payload = {
        name: form.name,
        description: form.description,
        capacity: form.capacity ? Number(form.capacity) : null,
        active: form.active,
      };
      if (editingId) {
        await apiRequest<Room>(`/api/aulas/${editingId}`, { method: "PUT", body: JSON.stringify(payload) }, token);
        notify({ title: "Aula actualizada", tone: "success" });
      } else {
        await apiRequest<Room>("/api/aulas", { method: "POST", body: JSON.stringify(payload) }, token);
        notify({ title: "Aula creada", tone: "success" });
      }
      setForm(initialForm);
      setEditingId(null);
      await load();
    } catch (err) {
      const message = err instanceof HttpError ? err.message : "No se pudo guardar el aula";
      setError(message);
      notify({ title: "No se pudo guardar el aula", description: message, tone: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(roomId: number) {
    try {
      setDeletingId(roomId);
      await apiRequest(`/api/aulas/${roomId}`, { method: "DELETE" }, token);
      notify({ title: "Aula eliminada", tone: "success" });
      await load();
    } catch (err) {
      const message = err instanceof HttpError ? err.message : "No se pudo eliminar el aula";
      setError(message);
      notify({ title: "No se pudo eliminar el aula", description: message, tone: "error" });
    } finally {
      setDeletingId(null);
    }
  }

  function startEdit(room: Room) {
    setEditingId(room.id);
    setForm({
      name: room.name,
      description: room.description ?? "",
      capacity: room.capacity ? String(room.capacity) : "",
      active: room.active,
    });
  }

  return (
    <Page>
      <PageHeader title="Aulas" subtitle="Administra las aulas de la sede para la banda y la escuela de música." />
      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <SectionCard title={editingId ? "Editar aula" : "Nueva aula"} description="Define el nombre, la capacidad y el estado operativo de cada aula.">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Field label="Nombre" required><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field>
            <Field label="Descripción" optional><Input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></Field>
            <Field label="Capacidad" optional><Input type="number" min="0" value={form.capacity} onChange={(event) => setForm({ ...form, capacity: event.target.value })} /></Field>
            <label className="flex items-center gap-3 rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-slate-300">
              <input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />
              Aula activa
            </label>
            <Message text={error} />
            <div className={`grid gap-3 ${editingId ? "md:grid-cols-2" : "grid-cols-1"}`}>
              <Button type="submit" loading={submitting}>{editingId ? "Guardar aula" : "Crear aula"}</Button>
              {editingId ? <Button type="button" variant="secondary" onClick={() => { setEditingId(null); setForm(initialForm); }}>Cancelar</Button> : null}
            </div>
          </form>
        </SectionCard>

        <SectionCard title="Listado de aulas" description="Consulta rápidamente qué aulas existen y su estado actual.">
          <SearchBox value={query} onChange={setQuery} placeholder="Buscar aula" />
          <div className="mt-4">
            {loading ? <LoadingState compact title="Cargando aulas" description="Estamos preparando la sede." /> : filtered.length === 0 ? (
              <EmptyState text="Todavía no hay aulas registradas." />
            ) : (
              <FilterableDataTable
                rows={filtered}
                getRowKey={(item) => item.id}
                columns={[
                  { header: "Aula", filterValue: (item) => item.name, render: (item) => <span className="font-medium text-white">{item.name}</span>, minWidth: 220 },
                  { header: "Capacidad", filterValue: (item) => item.capacity ?? "-", render: (item) => item.capacity ?? "-", minWidth: 130 },
                  { header: "Estado", filterValue: (item) => item.active ? "Activa" : "Inactiva", render: (item) => item.active ? "Activa" : "Inactiva", minWidth: 130 },
                  { header: "Descripción", filterValue: (item) => item.description || "Sin descripción", render: (item) => <span className="text-slate-400">{item.description || "Sin descripción"}</span>, minWidth: 280 },
                  { header: "Acciones", filterable: false, render: (item) => (
                    <div className="grid gap-2">
                      <Button variant="secondary" onClick={() => startEdit(item)}>Editar</Button>
                      <ConfirmButton label="Eliminar" loading={deletingId === item.id} onConfirm={() => handleDelete(item.id)} />
                    </div>
                  ), cellClassName: "min-w-[220px]", minWidth: 220 },
                ]}
              />
            )}
          </div>
        </SectionCard>
      </div>
    </Page>
  );
}
