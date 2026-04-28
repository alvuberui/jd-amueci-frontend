"use client";

import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useFeedback } from "@/components/feedback-provider";
import { Button, ConfirmButton, DataTable, EmptyState, Field, Input, LoadingState, Message, Page, PageHeader, SearchBox, SectionCard, Select, Textarea, useSearch } from "@/components/ui";
import { HttpError, apiRequest } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { MEMBER_INSTRUMENT_OPTIONS } from "@/lib/types";
import type { Member, MemberCredentialResponse, MemberImportResponse, MemberInstrument } from "@/lib/types";

const initialForm = {
  firstName: "",
  lastName: "",
  phone: "",
  nif: "",
  address: "",
  city: "",
  instrument: "",
  socio: true,
  boardMember: false,
  schoolDirector: false,
  teacher: false,
  student: false,
};

export function MembersPage() {
  const { token } = useAuth();
  const { notify } = useFeedback();
  const [items, setItems] = useState<Member[]>([]);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<number | null>(null);
  const [deletingMemberId, setDeletingMemberId] = useState<number | null>(null);
  const [createdCredentials, setCreatedCredentials] = useState<MemberCredentialResponse[]>([]);

  function formatInstrument(instrument: MemberInstrument) {
    return MEMBER_INSTRUMENT_OPTIONS.find((item) => item.value === instrument)?.label ?? instrument;
  }

  async function load() {
    if (!token) return;
    const data = await apiRequest<Member[]>("/api/socios", {}, token);
    setItems(data);
  }

  useEffect(() => {
    setLoading(true);
    load()
      .catch((err) => {
        const message = err instanceof HttpError ? err.message : "No se pudieron cargar los socios";
        setError(message);
        notify({ title: "No se pudieron cargar los socios", description: message, tone: "error" });
      })
      .finally(() => setLoading(false));
  }, [notify, token]);

  const { query, setQuery, filtered } = useSearch(items, (item) => [
    item.fullName,
    item.nif,
    item.phone ?? "",
    item.city ?? "",
    item.instrument ?? "",
  ]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    try {
      setSubmitting(true);
      setError(null);
      if (editingMemberId) {
        const response = await apiRequest<Member>(`/api/socios/${editingMemberId}`, {
          method: "PUT",
          body: JSON.stringify(form),
        }, token);
        setItems((current) => current.map((item) => item.id === response.id ? response : item));
        setEditingMemberId(null);
        setCreatedCredentials([]);
        notify({ title: "Socio actualizado", description: response.fullName, tone: "success" });
      } else {
        const response = await apiRequest<MemberCredentialResponse>("/api/socios", {
          method: "POST",
          body: JSON.stringify(form),
        }, token);
        setCreatedCredentials([response]);
        notify({ title: "Socio creado", description: `Usuario generado: ${response.username}`, tone: "success" });
      }
      setForm(initialForm);
      setFieldErrors({});
      await load();
    } catch (err) {
      const message = err instanceof HttpError ? err.message : editingMemberId ? "No se pudo actualizar el socio" : "No se pudo crear el socio";
      setError(message);
      setFieldErrors(err instanceof HttpError ? (err.fieldErrors ?? {}) : {});
      notify({ title: editingMemberId ? "No se pudo actualizar el socio" : "No se pudo crear el socio", description: message, tone: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(memberId: number) {
    if (!token) return;
    try {
      setDeletingMemberId(memberId);
      await apiRequest(`/api/socios/${memberId}`, { method: "DELETE" }, token);
      if (editingMemberId === memberId) {
        setEditingMemberId(null);
        setForm(initialForm);
      }
      notify({ title: "Socio eliminado", tone: "success" });
      await load();
    } catch (err) {
      const message = err instanceof HttpError ? err.message : "No se pudo eliminar el socio";
      setError(message);
      notify({ title: "No se pudo eliminar el socio", description: message, tone: "error" });
    } finally {
      setDeletingMemberId(null);
    }
  }

  function startEdit(member: Member) {
    setEditingMemberId(member.id);
    setCreatedCredentials([]);
    setFieldErrors({});
    setError(null);
    setForm({
      firstName: member.firstName,
      lastName: member.lastName,
      phone: member.phone ?? "",
      nif: member.nif,
      address: member.address ?? "",
      city: member.city ?? "",
      instrument: member.instrument ?? "",
      socio: member.socio,
      boardMember: member.boardMember,
      schoolDirector: member.schoolDirector,
      teacher: member.teacher,
      student: member.student,
    });
  }

  function cancelEdit() {
    setEditingMemberId(null);
    setFieldErrors({});
    setError(null);
    setForm(initialForm);
  }

  async function handleImport(file: File) {
    if (!token) return;
    const formData = new FormData();
    formData.append("file", file);

    try {
      setImporting(true);
      setError(null);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"}/api/socios/importar`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message ?? "No se pudo importar el Excel");
      }
      const result = payload as MemberImportResponse;
      setCreatedCredentials(result.createdMembers);
      notify({ title: "Importación completada", description: `${result.createdCount} socios añadidos`, tone: "success" });
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo importar el Excel";
      setError(message);
      notify({ title: "No se pudo importar el Excel", description: message, tone: "error" });
    } finally {
      setImporting(false);
    }
  }

  return (
    <Page>
      <PageHeader
        title="Socios"
        subtitle="Registro centralizado de socios, con creación de usuario automática y carga masiva desde Excel."
      />

      <div className="grid gap-6 xl:grid-cols-[430px_minmax(0,1fr)]">
        <SectionCard
          title={editingMemberId ? "Editar socio" : "Alta individual"}
          description={editingMemberId ? "Actualiza los datos del socio seleccionado. La contraseña no se modifica." : "La junta directiva puede registrar un socio y generar sus credenciales de acceso."}
        >
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <Field label="Nombre" required error={fieldErrors.firstName}><Input value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} /></Field>
              <Field label="Apellidos" required error={fieldErrors.lastName}><Input value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} /></Field>
              <Field label="Teléfono" required error={fieldErrors.phone}><Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></Field>
              <Field label="NIF" required error={fieldErrors.nif}><Input value={form.nif} onChange={(event) => setForm({ ...form, nif: event.target.value })} /></Field>
              <Field label="Localidad" required error={fieldErrors.city}><Input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} /></Field>
              <Field label="Instrumento" required error={fieldErrors.instrument}>
                <Select value={form.instrument} onChange={(event) => setForm({ ...form, instrument: event.target.value })}>
                  <option value="">Selecciona un instrumento</option>
                  {MEMBER_INSTRUMENT_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </Select>
              </Field>
              <Field label="Dirección" required error={fieldErrors.address}><Textarea value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /></Field>
              <label className="flex items-start gap-3 rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-slate-300">
                <input
                  type="checkbox"
                  className="mt-1 size-4 rounded border-white/20 bg-slate-950/70 text-brand-500 focus:ring-brand-400"
                  checked={form.socio}
                  onChange={(event) => setForm({ ...form, socio: event.target.checked })}
                />
                <span>
                  <span className="block font-medium text-white">Perfil de socio</span>
                  <span className="mt-1 block text-sm leading-6 text-slate-400">
                    Solo los usuarios con este perfil pueden reservar aulas para estudio y acceder a funciones propias de socio.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-3 rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-slate-300">
                <input
                  type="checkbox"
                  className="mt-1 size-4 rounded border-white/20 bg-slate-950/70 text-brand-500 focus:ring-brand-400"
                  checked={form.boardMember}
                  onChange={(event) => setForm({ ...form, boardMember: event.target.checked })}
                />
                <span>
                  <span className="block font-medium text-white">Permisos de junta directiva</span>
                  <span className="mt-1 block text-sm leading-6 text-slate-400">
                    Tendrá acceso completo a la gestión interna de la banda.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-3 rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-slate-300">
                <input
                  type="checkbox"
                  className="mt-1 size-4 rounded border-white/20 bg-slate-950/70 text-brand-500 focus:ring-brand-400"
                  checked={form.schoolDirector}
                  onChange={(event) => setForm({ ...form, schoolDirector: event.target.checked })}
                />
                <span>
                  <span className="block font-medium text-white">Dirección de escuela</span>
                  <span className="mt-1 block text-sm leading-6 text-slate-400">
                    Tendrá acceso exclusivo a cursos, trimestres, asignaturas, horarios e incidencias.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-3 rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-slate-300">
                <input
                  type="checkbox"
                  className="mt-1 size-4 rounded border-white/20 bg-slate-950/70 text-brand-500 focus:ring-brand-400"
                  checked={form.teacher}
                  onChange={(event) => setForm({ ...form, teacher: event.target.checked })}
                />
                <span>
                  <span className="block font-medium text-white">Perfil de profesor</span>
                  <span className="mt-1 block text-sm leading-6 text-slate-400">
                    Podrá consultar su agenda docente dentro del módulo de escuela.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-3 rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-slate-300">
                <input
                  type="checkbox"
                  className="mt-1 size-4 rounded border-white/20 bg-slate-950/70 text-brand-500 focus:ring-brand-400"
                  checked={form.student}
                  onChange={(event) => setForm({ ...form, student: event.target.checked })}
                />
                <span>
                  <span className="block font-medium text-white">Perfil de alumno</span>
                  <span className="mt-1 block text-sm leading-6 text-slate-400">
                    Tendrá acceso a su horario lectivo y a los cambios puntuales de clase.
                  </span>
                </span>
              </label>
            </div>
            <Message text={error} />
            <div className={`grid gap-3 ${editingMemberId ? "md:grid-cols-2" : "grid-cols-1"}`}>
              <Button type="submit" loading={submitting}>{editingMemberId ? "Guardar cambios" : "Crear socio"}</Button>
              {editingMemberId ? <Button type="button" variant="secondary" onClick={cancelEdit}>Cancelar edición</Button> : null}
            </div>
          </form>
        </SectionCard>

        <SectionCard title="Carga masiva y listado" description="Importa un Excel o consulta rápidamente el registro actual de socios.">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="space-y-4">
              <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm font-medium text-white">Importar Excel</p>
                <p className="mt-1 text-sm text-slate-400">Columnas esperadas y obligatorias: nombre, apellidos, telefono, nif, direccion, localidad, instrumento.</p>
                <div className="mt-4">
                  <Input type="file" accept=".xlsx,.xls" onChange={(event) => { const file = event.target.files?.[0]; if (file) void handleImport(file); }} />
                </div>
                {importing ? <p className="mt-3 text-sm text-slate-400">Importando archivo...</p> : null}
              </div>

              <SearchBox value={query} onChange={setQuery} placeholder="Buscar por nombre, NIF o instrumento" />

              {loading ? <LoadingState compact title="Cargando socios" description="Preparando el registro actual." /> : filtered.length === 0 ? (
                <EmptyState text="No hay socios registrados todavía." />
              ) : (
                <DataTable headers={["Nombre", "Acceso", "NIF", "Teléfono", "Instrumento", "Localidad", "Alta", "Acciones"]}>
                  {filtered.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-4 text-white">{item.fullName}</td>
                      <td className="px-4 py-4 text-slate-300">
                        {[item.socio ? "Socio" : null, item.boardMember ? "Directiva" : null, item.schoolDirector ? "Dirección escuela" : null, item.teacher ? "Profesor" : null, item.student ? "Alumno" : null].filter(Boolean).join(", ") || "Sin roles"}
                      </td>
                      <td className="px-4 py-4 text-slate-300">{item.nif}</td>
                      <td className="px-4 py-4 text-slate-300">{item.phone || "Sin dato"}</td>
                      <td className="px-4 py-4 text-slate-300">{formatInstrument(item.instrument)}</td>
                      <td className="px-4 py-4 text-slate-300">{item.city}</td>
                      <td className="px-4 py-4 text-slate-400">{formatDateTime(item.createdAt)}</td>
                      <td className="min-w-[220px] px-4 py-4">
                        <div className="grid gap-2">
                          <Button variant="secondary" onClick={() => startEdit(item)}>Editar</Button>
                          <ConfirmButton label="Eliminar" loading={deletingMemberId === item.id} onConfirm={() => handleDelete(item.id)} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </DataTable>
              )}
            </div>

            <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm font-medium text-white">Credenciales generadas</p>
              <p className="mt-1 text-sm text-slate-400">Muestra las credenciales creadas en la última operación.</p>
              {createdCredentials.length === 0 ? (
                <div className="mt-4 rounded-[18px] border border-dashed border-white/10 px-4 py-6 text-sm text-slate-400">
                  Aquí verás el usuario y la contraseña tras un alta individual o una importación.
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {createdCredentials.map((item) => (
                    <div key={`${item.username}-${item.member.id}`} className="rounded-[18px] border border-white/10 bg-slate-950/40 p-4">
                      <p className="text-sm font-semibold text-white">{item.member.fullName}</p>
                      <p className="mt-2 text-sm text-slate-300">Usuario: <span className="font-medium text-white">{item.username}</span></p>
                      <p className="mt-1 text-sm text-slate-300">Contraseña: <span className="font-medium text-white">{item.password}</span></p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </SectionCard>
      </div>
    </Page>
  );
}
