"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { useFeedback } from "@/components/feedback-provider";
import { Button, EmptyState, Field, FilterableDataTable, Input, LoadingState, Page, PageHeader, SectionCard, Select } from "@/components/ui";
import { HttpError, apiRequest } from "@/lib/api";
import { QUARTER_HOUR_OPTIONS, todayIso } from "@/lib/time";
import type { BandRecurringReservation, BandRecurringReservationException, RoomAvailability, RoomReservation } from "@/lib/types";

const initialForm = {
  roomId: "",
  type: "ESTUDIO",
  reservationDate: "",
  startTime: "17:00",
  endTime: "18:00",
  notes: "",
};

const initialRecurringForm = { roomId: "", dayOfWeek: "1", startTime: "21:00", endTime: "22:00", startDate: "", endDate: "", notes: "", active: true };
const initialRecurringExceptionForm = { reservationId: "", exceptionDate: "", notes: "" };
const dayNames = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export function RoomAvailabilityPage() {
  const { token, user } = useAuth();
  const { notify } = useFeedback();
  const router = useRouter();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [availability, setAvailability] = useState<RoomAvailability | null>(null);
  const [myReservations, setMyReservations] = useState<RoomReservation[]>([]);
  const [recurringReservations, setRecurringReservations] = useState<BandRecurringReservation[]>([]);
  const [recurringExceptionsByReservation, setRecurringExceptionsByReservation] = useState<Record<number, BandRecurringReservationException[]>>({});
  const [form, setForm] = useState(initialForm);
  const [recurringForm, setRecurringForm] = useState(initialRecurringForm);
  const [recurringExceptionForm, setRecurringExceptionForm] = useState(initialRecurringExceptionForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittingRecurring, setSubmittingRecurring] = useState(false);
  const [submittingRecurringException, setSubmittingRecurringException] = useState(false);
  const [editingRecurringId, setEditingRecurringId] = useState<number | null>(null);
  const isBoard = user?.roles.includes("DIRECTIVA") ?? false;
  const isTeacher = user?.roles.includes("PROFESOR") ?? false;
  const isSocio = user?.roles.includes("SOCIO") ?? false;
  const canReserve = isSocio || isTeacher || isBoard;
  const minReservationDate = todayIso();

  async function load(selectedDate = date) {
    if (!token) return;
    const [availabilityResponse, reservationsResponse, recurringResponse] = await Promise.all([
      apiRequest<RoomAvailability>(`/api/aulas/disponibilidad?date=${selectedDate}`),
      apiRequest<RoomReservation[]>("/api/aulas/mis-reservas"),
      isBoard ? apiRequest<BandRecurringReservation[]>("/api/aulas/reservas-recurrentes-banda") : Promise.resolve([]),
    ]);
    const recurringExceptionsResponse = isBoard
      ? Object.fromEntries(await Promise.all(recurringResponse.map(async (reservation) => [
          reservation.id,
          await apiRequest<BandRecurringReservationException[]>(`/api/aulas/reservas-recurrentes-banda/${reservation.id}/excepciones`),
        ])))
      : {};
    setAvailability(availabilityResponse);
    setMyReservations(reservationsResponse);
    setRecurringReservations(recurringResponse);
    setRecurringExceptionsByReservation(recurringExceptionsResponse);
  }

  useEffect(() => {
    if (!token || canReserve) return;
    router.replace("/mi-agenda");
  }, [canReserve, router, token]);

  useEffect(() => {
    setLoading(true);
    load().catch((err) => {
      const message = err instanceof HttpError ? err.message : "No se pudo cargar la disponibilidad";
      notify({ title: "No se pudo cargar la disponibilidad", description: message, tone: "error" });
    }).finally(() => setLoading(false));
  }, [date, notify, token]);

  if (!canReserve) {
    return null;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      setSubmitting(true);
      await apiRequest<RoomReservation>("/api/aulas/reservas", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          roomId: Number(form.roomId),
          reservationDate: form.reservationDate || minReservationDate,
        }),
      });
      notify({ title: "Reserva guardada", tone: "success" });
      setForm({ ...initialForm, reservationDate: minReservationDate });
      await load();
    } catch (err) {
      const message = err instanceof HttpError ? err.message : "No se pudo registrar la reserva";
      notify({ title: "No se pudo registrar la reserva", description: message, tone: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  function startEditRecurring(item: BandRecurringReservation) {
    setEditingRecurringId(item.id);
    setRecurringForm({
      roomId: String(item.roomId),
      dayOfWeek: String(item.dayOfWeek),
      startTime: item.startTime.slice(0, 5),
      endTime: item.endTime.slice(0, 5),
      startDate: item.startDate,
      endDate: item.endDate,
      notes: item.notes ?? "",
      active: item.active,
    });
  }

  function startRecurringException(item: BandRecurringReservation) {
    setRecurringExceptionForm({ ...initialRecurringExceptionForm, reservationId: String(item.id) });
  }

  async function deactivateRecurring(reservationId: number) {
    try {
      await apiRequest(`/api/aulas/reservas-recurrentes-banda/${reservationId}`, { method: "DELETE" });
      notify({ title: "Recurrencia desactivada", tone: "success" });
      if (editingRecurringId === reservationId) {
        setEditingRecurringId(null);
        setRecurringForm(initialRecurringForm);
      }
      await load();
    } catch (err) {
      const message = err instanceof HttpError ? err.message : "No se pudo desactivar la recurrencia";
      notify({ title: "No se pudo desactivar la recurrencia", description: message, tone: "error" });
    }
  }

  async function cancelReservation(reservationId: number) {
    try {
      await apiRequest(`/api/aulas/reservas/${reservationId}`, { method: "DELETE" });
      notify({ title: "Reserva cancelada", tone: "success" });
      await load();
    } catch (err) {
      const message = err instanceof HttpError ? err.message : "No se pudo cancelar la reserva";
      notify({ title: "No se pudo cancelar la reserva", description: message, tone: "error" });
    }
  }

  const selectedRecurringExceptions = recurringExceptionForm.reservationId
    ? recurringExceptionsByReservation[Number(recurringExceptionForm.reservationId)] ?? []
    : [];

  return (
    <Page>
      <PageHeader title="Disponibilidad de aulas" subtitle="Consulta la ocupación diaria y reserva un hueco libre para estudio o actividad de banda." />
      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        {canReserve ? (
          <SectionCard title="Nueva reserva" description="El sistema bloqueará automáticamente cualquier solape con escuela o reservas ya confirmadas.">
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <Field label="Fecha de reserva" required><Input type="date" min={minReservationDate} value={form.reservationDate || minReservationDate} onChange={(event) => setForm({ ...form, reservationDate: event.target.value })} /></Field>
              <Field label="Aula" required>
                <Select value={form.roomId} onChange={(event) => setForm({ ...form, roomId: event.target.value })}>
                  <option value="">Selecciona un aula</option>
                  {availability?.rooms.map((item) => <option key={item.roomId} value={item.roomId}>{item.roomName}</option>)}
                </Select>
              </Field>
              <Field label="Tipo" required>
                <Select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
                  {isSocio ? <option value="ESTUDIO">Estudio individual</option> : null}
                  {isBoard ? <option value="BANDA">Actividad de banda</option> : null}
                  {isTeacher ? <option value="RECUPERACION">Recuperación de clase</option> : null}
                </Select>
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Inicio" required>
                  <Select value={form.startTime} onChange={(event) => setForm({ ...form, startTime: event.target.value })}>
                    {QUARTER_HOUR_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </Select>
                </Field>
                <Field label="Fin" required>
                  <Select value={form.endTime} onChange={(event) => setForm({ ...form, endTime: event.target.value })}>
                    {QUARTER_HOUR_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </Select>
                </Field>
              </div>
              <Field label="Notas" optional><Input value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></Field>
              <Button type="submit" loading={submitting}>Reservar aula</Button>
            </form>
          </SectionCard>
        ) : null}

        <SectionCard title="Agenda del día" description="Aquí ves todas las ocupaciones previstas para la fecha seleccionada.">
          <div className="space-y-4">
            <Field label="Fecha de consulta" required>
              <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </Field>
            {loading || !availability ? <LoadingState compact title="Cargando disponibilidad" description="Calculando horarios y reservas del día." /> : (
              <>
              {availability.rooms.map((room) => (
                <div key={room.roomId} className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-white">{room.roomName}</h3>
                    <span className="text-sm text-slate-400">{room.events.length} bloque(s)</span>
                  </div>
                  {room.events.length === 0 ? <p className="mt-3 text-sm text-emerald-300">Sin ocupaciones registradas para este día.</p> : (
                    <div className="mt-4 space-y-3">
                      {room.events.map((event, index) => (
                        <div key={`${room.roomId}-${index}`} className="rounded-[18px] border border-white/10 bg-slate-950/40 px-4 py-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-medium text-white">{event.title}</p>
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{event.source}</p>
                          </div>
                          <p className="mt-1 text-sm text-slate-300">{event.startTime && event.endTime ? `${event.startTime} - ${event.endTime}` : "Todo el día"}</p>
                          {event.detail ? <p className="mt-1 text-sm text-slate-400">{event.detail}</p> : null}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              </>
            )}
          </div>
        </SectionCard>
      </div>

      {isBoard ? (
        <SectionCard title="Reservas recurrentes de banda" description="La directiva puede programar ensayos estables, desactivarlos más adelante y cancelar una sesión concreta sin romper toda la serie.">
          <form className="grid gap-4 lg:grid-cols-4" onSubmit={async (event: FormEvent) => {
            event.preventDefault();
            try {
              setSubmittingRecurring(true);
              await apiRequest(editingRecurringId ? `/api/aulas/reservas-recurrentes-banda/${editingRecurringId}` : "/api/aulas/reservas-recurrentes-banda", {
                method: editingRecurringId ? "PUT" : "POST",
                body: JSON.stringify({
                  ...recurringForm,
                  roomId: Number(recurringForm.roomId),
                  dayOfWeek: Number(recurringForm.dayOfWeek),
                }),
              });
              notify({ title: editingRecurringId ? "Recurrencia actualizada" : "Reserva recurrente guardada", tone: "success" });
              setEditingRecurringId(null);
              setRecurringForm(initialRecurringForm);
              await load();
            } catch (err) {
              const message = err instanceof HttpError ? err.message : "No se pudo guardar la reserva recurrente";
              notify({ title: "No se pudo guardar la reserva recurrente", description: message, tone: "error" });
            } finally {
              setSubmittingRecurring(false);
            }
          }}>
            <Field label="Aula" required>
              <Select value={recurringForm.roomId} onChange={(event) => setRecurringForm({ ...recurringForm, roomId: event.target.value })}>
                <option value="">Selecciona un aula</option>
                {availability?.rooms.map((item) => <option key={item.roomId} value={item.roomId}>{item.roomName}</option>)}
              </Select>
            </Field>
            <Field label="Día" required>
              <Select value={recurringForm.dayOfWeek} onChange={(event) => setRecurringForm({ ...recurringForm, dayOfWeek: event.target.value })}>
                <option value="1">Lunes</option><option value="2">Martes</option><option value="3">Miércoles</option><option value="4">Jueves</option><option value="5">Viernes</option><option value="6">Sábado</option><option value="7">Domingo</option>
              </Select>
            </Field>
            <Field label="Inicio" required>
              <Select value={recurringForm.startTime} onChange={(event) => setRecurringForm({ ...recurringForm, startTime: event.target.value })}>
                {QUARTER_HOUR_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </Select>
            </Field>
            <Field label="Fin" required>
              <Select value={recurringForm.endTime} onChange={(event) => setRecurringForm({ ...recurringForm, endTime: event.target.value })}>
                {QUARTER_HOUR_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </Select>
            </Field>
            <Field label="Fecha inicio" required><Input type="date" min={minReservationDate} value={recurringForm.startDate} onChange={(event) => setRecurringForm({ ...recurringForm, startDate: event.target.value })} /></Field>
            <Field label="Fecha fin" required><Input type="date" min={recurringForm.startDate || minReservationDate} value={recurringForm.endDate} onChange={(event) => setRecurringForm({ ...recurringForm, endDate: event.target.value })} /></Field>
            <Field label="Notas" optional><Input value={recurringForm.notes} onChange={(event) => setRecurringForm({ ...recurringForm, notes: event.target.value })} /></Field>
            <div className="flex items-end"><Button type="submit" loading={submittingRecurring}>{editingRecurringId ? "Guardar cambios" : "Guardar recurrente"}</Button></div>
            {editingRecurringId ? <div className="flex items-end"><Button type="button" variant="secondary" onClick={() => { setEditingRecurringId(null); setRecurringForm(initialRecurringForm); }}>Cancelar edición</Button></div> : null}
          </form>
          {recurringReservations.length === 0 ? <EmptyState text="Aún no hay reservas recurrentes de banda." /> : (
            <FilterableDataTable
              rows={recurringReservations}
              getRowKey={(item) => item.id}
              columns={[
                { header: "Aula", filterValue: (item) => item.roomName, render: (item) => <span className="text-white">{item.roomName}</span>, minWidth: 180 },
                { header: "Día", filterValue: (item) => dayNames[item.dayOfWeek], render: (item) => dayNames[item.dayOfWeek], minWidth: 140 },
                { header: "Horario", filterValue: (item) => `${item.startTime} - ${item.endTime}`, render: (item) => `${item.startTime} - ${item.endTime}`, minWidth: 150 },
                { header: "Rango", filterValue: (item) => `${item.startDate} - ${item.endDate}`, render: (item) => `${item.startDate} - ${item.endDate}`, minWidth: 220 },
                { header: "Estado", filterValue: (item) => item.active ? "Activa" : "Inactiva", render: (item) => item.active ? "Activa" : "Inactiva", minWidth: 130 },
                { header: "Notas", filterValue: (item) => item.notes || "Sin notas", render: (item) => <span className="text-slate-400">{item.notes || "Sin notas"}</span>, minWidth: 220 },
                { header: "Excepciones", filterValue: (item) => (recurringExceptionsByReservation[item.id] ?? []).map((exception) => `${exception.exceptionDate} ${exception.notes ?? ""}`).join(" "), render: (item) => (
                  (recurringExceptionsByReservation[item.id] ?? []).length === 0 ? (
                    <span className="text-slate-500">Sin excepciones</span>
                  ) : (
                    <div className="grid gap-2">
                      {(recurringExceptionsByReservation[item.id] ?? []).map((exception) => (
                        <div key={exception.id} className="rounded-[14px] border border-white/10 bg-white/[0.03] px-3 py-2">
                          <p className="text-sm font-medium text-white">{exception.exceptionDate}</p>
                          <p className="mt-1 text-xs text-slate-400">{exception.notes || "Sin motivo indicado"}</p>
                        </div>
                      ))}
                    </div>
                  )
                ), cellClassName: "min-w-[240px]", minWidth: 280 },
                { header: "Acciones", filterable: false, render: (item) => (
                  <div className="grid gap-2">
                    <Button variant="secondary" onClick={() => startEditRecurring(item)}>Editar</Button>
                    {item.active ? <Button variant="secondary" onClick={() => startRecurringException(item)}>Añadir excepción</Button> : null}
                    {item.active ? <Button variant="danger" onClick={() => deactivateRecurring(item.id)}>Desactivar</Button> : null}
                  </div>
                ), cellClassName: "min-w-[220px]", minWidth: 220 },
              ]}
            />
          )}
          {recurringReservations.length > 0 ? (
            <form className="mt-6 grid gap-4 lg:grid-cols-4" onSubmit={async (event: FormEvent) => {
              event.preventDefault();
              try {
                setSubmittingRecurringException(true);
                const response = await apiRequest<BandRecurringReservationException>(`/api/aulas/reservas-recurrentes-banda/${Number(recurringExceptionForm.reservationId)}/excepciones`, {
                  method: "POST",
                  body: JSON.stringify({ exceptionDate: recurringExceptionForm.exceptionDate, notes: recurringExceptionForm.notes }),
                });
                notify({ title: "Sesión puntual cancelada", description: `Se ha cancelado la fecha ${response.exceptionDate}`, tone: "success" });
                setRecurringExceptionForm({ ...initialRecurringExceptionForm, reservationId: recurringExceptionForm.reservationId });
                await load();
              } catch (err) {
                const message = err instanceof HttpError ? err.message : "No se pudo cancelar la sesión puntual";
                notify({ title: "No se pudo cancelar la sesión puntual", description: message, tone: "error" });
              } finally {
                setSubmittingRecurringException(false);
              }
            }}>
              <Field label="Recurrencia" required>
                <Select value={recurringExceptionForm.reservationId} onChange={(event) => setRecurringExceptionForm({ ...recurringExceptionForm, reservationId: event.target.value })}>
                  <option value="">Selecciona una recurrencia</option>
                  {recurringReservations.filter((item) => item.active).map((item) => (
                    <option key={item.id} value={item.id}>{item.roomName} · {dayNames[item.dayOfWeek]} · {item.startTime}-{item.endTime}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Fecha a cancelar" required><Input type="date" min={minReservationDate} value={recurringExceptionForm.exceptionDate} onChange={(event) => setRecurringExceptionForm({ ...recurringExceptionForm, exceptionDate: event.target.value })} /></Field>
              <Field label="Motivo" optional><Input value={recurringExceptionForm.notes} onChange={(event) => setRecurringExceptionForm({ ...recurringExceptionForm, notes: event.target.value })} /></Field>
              <div className="flex items-end"><Button type="submit" loading={submittingRecurringException}>Cancelar solo esa sesión</Button></div>
              {recurringExceptionForm.reservationId ? (
                <div className="lg:col-span-4">
                  <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-sm font-semibold text-white">Excepciones registradas para esta recurrencia</p>
                    {selectedRecurringExceptions.length === 0 ? (
                      <p className="mt-2 text-sm text-slate-400">Todavía no hay sesiones puntuales canceladas.</p>
                    ) : (
                      <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                        {selectedRecurringExceptions.map((exception) => (
                          <div key={exception.id} className="rounded-[14px] border border-white/10 bg-slate-950/40 px-3 py-2">
                            <p className="text-sm font-medium text-white">{exception.exceptionDate}</p>
                            <p className="mt-1 text-xs text-slate-400">{exception.notes || "Sin motivo indicado"}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </form>
          ) : null}
        </SectionCard>
      ) : null}

      <SectionCard title="Mis reservas" description="Puedes cancelar una reserva si ya no necesitas el aula.">
        {myReservations.length === 0 ? <EmptyState text="Todavía no tienes reservas registradas." /> : (
          <FilterableDataTable
            rows={myReservations}
            getRowKey={(item) => item.id}
            columns={[
              { header: "Fecha", filterValue: (item) => item.reservationDate, render: (item) => <span className="text-white">{item.reservationDate}</span>, minWidth: 150 },
              { header: "Aula", filterValue: (item) => item.roomName, render: (item) => item.roomName, minWidth: 180 },
              { header: "Tipo", filterValue: (item) => item.type, render: (item) => item.type, minWidth: 150 },
              { header: "Horario", filterValue: (item) => `${item.startTime} - ${item.endTime}`, render: (item) => `${item.startTime} - ${item.endTime}`, minWidth: 150 },
              { header: "Notas", filterValue: (item) => item.notes || "Sin notas", render: (item) => <span className="text-slate-400">{item.notes || "Sin notas"}</span>, minWidth: 240 },
              { header: "Acciones", filterable: false, render: (item) => !item.cancelled ? <Button variant="secondary" onClick={() => cancelReservation(item.id)}>Cancelar</Button> : <span className="text-sm text-slate-500">Cancelada</span>, minWidth: 160 },
            ]}
          />
        )}
      </SectionCard>
    </Page>
  );
}
