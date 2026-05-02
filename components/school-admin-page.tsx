"use client";

import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useFeedback } from "@/components/feedback-provider";
import { Button, EmptyState, Field, FilterableDataTable, Input, LoadingState, Page, PageHeader, SectionCard, Select, Textarea } from "@/components/ui";
import { HttpError, apiRequest } from "@/lib/api";
import { QUARTER_HOUR_OPTIONS, todayIso } from "@/lib/time";
import type { SchoolOverview } from "@/lib/types";

const weekDays = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 7, label: "Domingo" },
];

export function SchoolAdminPage() {
  const { token } = useAuth();
  const { notify } = useFeedback();
  const [overview, setOverview] = useState<SchoolOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [yearForm, setYearForm] = useState({ name: "", startDate: "", endDate: "", active: true });
  const [termForm, setTermForm] = useState({ academicYearId: "", termNumber: "1", name: "", startDate: "", endDate: "" });
  const [subjectForm, setSubjectForm] = useState({ name: "", description: "", subjectType: "INDIVIDUAL", active: true });
  const [closureForm, setClosureForm] = useState({ academicYearId: "", closureDate: "", name: "", notes: "" });
  const [scheduleForm, setScheduleForm] = useState({
    academicYearId: "",
    teacherMemberId: "",
    studentMemberIds: [] as string[],
    subjectId: "",
    roomId: "",
    dayOfWeek: "1",
    startTime: "16:00",
    endTime: "17:00",
    startDate: "",
    endDate: "",
    notes: "",
  });
  const [exceptionForm, setExceptionForm] = useState({
    scheduleId: "",
    type: "CANCELADA",
    originalDate: "",
    replacementDate: "",
    replacementStartTime: "16:00",
    replacementEndTime: "17:00",
    replacementRoomId: "",
    notes: "",
  });
  const minToday = todayIso();

  async function load() {
    if (!token) return;
    setOverview(await apiRequest<SchoolOverview>("/api/escuela/overview"));
  }

  useEffect(() => {
    setLoading(true);
    load().catch((err) => {
      const message = err instanceof HttpError ? err.message : "No se pudo cargar la escuela";
      notify({ title: "No se pudo cargar la escuela", description: message, tone: "error" });
    }).finally(() => setLoading(false));
  }, [notify, token]);

  async function submit(key: string, fn: () => Promise<void>, success: string) {
    try {
      setSaving(key);
      await fn();
      await load();
      notify({ title: success, tone: "success" });
    } catch (err) {
      const message = err instanceof HttpError ? err.message : "No se pudo guardar";
      notify({ title: "No se pudo guardar", description: message, tone: "error" });
    } finally {
      setSaving(null);
    }
  }

  if (loading || !overview) {
    return <Page><LoadingState title="Cargando escuela" description="Estamos preparando el calendario académico." /></Page>;
  }

  return (
    <Page>
      <PageHeader title="Escuela" subtitle="Gestiona curso, trimestres, asignaturas, días no lectivos, horarios base y cambios puntuales del calendario." />

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="Curso y trimestres" description="Define el curso académico activo y los tres trimestres.">
          <form className="grid gap-4" onSubmit={(event: FormEvent) => {
            event.preventDefault();
            void submit("year", () => apiRequest("/api/escuela/cursos", { method: "POST", body: JSON.stringify(yearForm) }), "Curso guardado");
          }}>
            <Field label="Nombre del curso" required><Input value={yearForm.name} onChange={(event) => setYearForm({ ...yearForm, name: event.target.value })} /></Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Inicio" required><Input type="date" value={yearForm.startDate} onChange={(event) => setYearForm({ ...yearForm, startDate: event.target.value })} /></Field>
              <Field label="Fin" required><Input type="date" value={yearForm.endDate} onChange={(event) => setYearForm({ ...yearForm, endDate: event.target.value })} /></Field>
            </div>
            <label className="flex items-center gap-3 rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-slate-300">
              <input type="checkbox" checked={yearForm.active} onChange={(event) => setYearForm({ ...yearForm, active: event.target.checked })} />
              Marcar como curso activo
            </label>
            <Button type="submit" loading={saving === "year"}>Guardar curso</Button>
          </form>
          <form className="mt-6 grid gap-4" onSubmit={(event: FormEvent) => {
            event.preventDefault();
            void submit("term", () => apiRequest("/api/escuela/trimestres", {
              method: "POST",
              body: JSON.stringify({ ...termForm, academicYearId: Number(termForm.academicYearId), termNumber: Number(termForm.termNumber) }),
            }), "Trimestre guardado");
          }}>
            <Field label="Curso" required>
              <Select value={termForm.academicYearId} onChange={(event) => setTermForm({ ...termForm, academicYearId: event.target.value })}>
                <option value="">Selecciona un curso</option>
                {overview.academicYears.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </Select>
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Número" required>
                <Select value={termForm.termNumber} onChange={(event) => setTermForm({ ...termForm, termNumber: event.target.value })}>
                  <option value="1">Primer trimestre</option>
                  <option value="2">Segundo trimestre</option>
                  <option value="3">Tercer trimestre</option>
                </Select>
              </Field>
              <Field label="Nombre" required><Input value={termForm.name} onChange={(event) => setTermForm({ ...termForm, name: event.target.value })} /></Field>
              <Field label="Inicio" required><Input type="date" value={termForm.startDate} onChange={(event) => setTermForm({ ...termForm, startDate: event.target.value })} /></Field>
              <Field label="Fin" required><Input type="date" value={termForm.endDate} onChange={(event) => setTermForm({ ...termForm, endDate: event.target.value })} /></Field>
            </div>
            <Button type="submit" loading={saving === "term"}>Guardar trimestre</Button>
          </form>
          {overview.academicYears.length === 0 ? <EmptyState text="Aún no hay cursos registrados." /> : (
            <FilterableDataTable
              rows={overview.academicYears}
              getRowKey={(item) => item.id}
              columns={[
                { header: "Curso", filterValue: (item) => item.name, render: (item) => <span className="text-white">{item.name}</span>, minWidth: 220 },
                { header: "Fechas", filterValue: (item) => `${item.startDate} - ${item.endDate}`, render: (item) => `${item.startDate} - ${item.endDate}`, minWidth: 230 },
                { header: "Estado", filterValue: (item) => item.active ? "Activo" : "Inactivo", render: (item) => item.active ? "Activo" : "Inactivo", minWidth: 150 },
              ]}
            />
          )}
          {overview.terms.length === 0 ? <EmptyState text="Todavía no hay trimestres cargados." /> : (
            <FilterableDataTable
              rows={overview.terms}
              getRowKey={(item) => item.id}
              columns={[
                { header: "Trimestre", filterValue: (item) => item.name, render: (item) => <span className="text-white">{item.name}</span>, minWidth: 220 },
                { header: "Curso", filterValue: (item) => item.academicYearName, render: (item) => item.academicYearName, minWidth: 220 },
                { header: "Fechas", filterValue: (item) => `${item.startDate} - ${item.endDate}`, render: (item) => <span className="text-slate-400">{item.startDate} - {item.endDate}</span>, minWidth: 230 },
              ]}
            />
          )}
        </SectionCard>

        <SectionCard title="Asignaturas y cierres" description="Un cierre es un día no lectivo o una franja de calendario especial en la que la escuela no imparte clase.">
          <form className="grid gap-4" onSubmit={(event: FormEvent) => {
            event.preventDefault();
            void submit("subject", () => apiRequest("/api/escuela/asignaturas", { method: "POST", body: JSON.stringify(subjectForm) }), "Asignatura guardada");
          }}>
            <Field label="Asignatura" required><Input value={subjectForm.name} onChange={(event) => setSubjectForm({ ...subjectForm, name: event.target.value })} /></Field>
            <Field label="Tipo" required>
              <Select value={subjectForm.subjectType} onChange={(event) => setSubjectForm({ ...subjectForm, subjectType: event.target.value })}>
                <option value="INDIVIDUAL">Individual</option>
                <option value="COLECTIVA">Colectiva</option>
              </Select>
            </Field>
            <Field label="Descripción" optional><Textarea value={subjectForm.description} onChange={(event) => setSubjectForm({ ...subjectForm, description: event.target.value })} /></Field>
            <Button type="submit" loading={saving === "subject"}>Guardar asignatura</Button>
          </form>
          <form className="mt-6 grid gap-4" onSubmit={(event: FormEvent) => {
            event.preventDefault();
            void submit("closure", () => apiRequest("/api/escuela/cierres", { method: "POST", body: JSON.stringify({ ...closureForm, academicYearId: closureForm.academicYearId ? Number(closureForm.academicYearId) : null }) }), "Cierre guardado");
          }}>
            <Field label="Curso" optional>
              <Select value={closureForm.academicYearId} onChange={(event) => setClosureForm({ ...closureForm, academicYearId: event.target.value })}>
                <option value="">Sin curso asociado</option>
                {overview.academicYears.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </Select>
            </Field>
            <Field label="Fecha" required><Input type="date" min={minToday} value={closureForm.closureDate} onChange={(event) => setClosureForm({ ...closureForm, closureDate: event.target.value })} /></Field>
            <Field label="Nombre" required><Input value={closureForm.name} onChange={(event) => setClosureForm({ ...closureForm, name: event.target.value })} /></Field>
            <Field label="Notas" optional><Textarea value={closureForm.notes} onChange={(event) => setClosureForm({ ...closureForm, notes: event.target.value })} /></Field>
            <Button type="submit" loading={saving === "closure"}>Guardar cierre</Button>
          </form>
        </SectionCard>

        <SectionCard title="Horario fijo" description="Registra la planificación estable del curso. Las asignaturas individuales admiten un alumno y las colectivas permiten varios.">
          <form className="grid gap-4" onSubmit={(event: FormEvent) => {
            event.preventDefault();
            void submit("schedule", () => apiRequest("/api/escuela/horarios", {
              method: "POST",
              body: JSON.stringify({
                ...scheduleForm,
                academicYearId: Number(scheduleForm.academicYearId),
                teacherMemberId: Number(scheduleForm.teacherMemberId),
                studentMemberIds: scheduleForm.studentMemberIds.map(Number),
                subjectId: Number(scheduleForm.subjectId),
                roomId: Number(scheduleForm.roomId),
                dayOfWeek: Number(scheduleForm.dayOfWeek),
              }),
            }), "Horario guardado");
          }}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Curso" required>
                <Select value={scheduleForm.academicYearId} onChange={(event) => setScheduleForm({ ...scheduleForm, academicYearId: event.target.value })}>
                  <option value="">Selecciona un curso</option>
                  {overview.academicYears.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </Select>
              </Field>
              <Field label="Asignatura" required>
                <Select value={scheduleForm.subjectId} onChange={(event) => setScheduleForm({ ...scheduleForm, subjectId: event.target.value })}>
                  <option value="">Selecciona una asignatura</option>
                  {overview.subjects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </Select>
              </Field>
              <Field label="Profesor" required>
                <Select value={scheduleForm.teacherMemberId} onChange={(event) => setScheduleForm({ ...scheduleForm, teacherMemberId: event.target.value })}>
                  <option value="">Selecciona un profesor</option>
                  {overview.teachers.map((item) => <option key={item.id} value={item.id}>{item.fullName}</option>)}
                </Select>
              </Field>
              <Field label="Alumnado" required>
                <Select
                  multiple
                  className="min-h-[180px]"
                  value={scheduleForm.studentMemberIds}
                  onChange={(event) => setScheduleForm({ ...scheduleForm, studentMemberIds: Array.from(event.target.selectedOptions).map((option) => option.value) })}
                >
                  {overview.students.map((item) => <option key={item.id} value={item.id}>{item.fullName}</option>)}
                </Select>
              </Field>
              <Field label="Aula" required>
                <Select value={scheduleForm.roomId} onChange={(event) => setScheduleForm({ ...scheduleForm, roomId: event.target.value })}>
                  <option value="">Selecciona un aula</option>
                  {overview.rooms.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </Select>
              </Field>
              <Field label="Día" required>
                <Select value={scheduleForm.dayOfWeek} onChange={(event) => setScheduleForm({ ...scheduleForm, dayOfWeek: event.target.value })}>
                  {weekDays.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </Select>
              </Field>
              <Field label="Inicio" required>
                <Select value={scheduleForm.startTime} onChange={(event) => setScheduleForm({ ...scheduleForm, startTime: event.target.value })}>
                  {QUARTER_HOUR_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </Select>
              </Field>
              <Field label="Fin" required>
                <Select value={scheduleForm.endTime} onChange={(event) => setScheduleForm({ ...scheduleForm, endTime: event.target.value })}>
                  {QUARTER_HOUR_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </Select>
              </Field>
              <Field label="Fecha inicio" required><Input type="date" min={minToday} value={scheduleForm.startDate} onChange={(event) => setScheduleForm({ ...scheduleForm, startDate: event.target.value })} /></Field>
              <Field label="Fecha fin" required><Input type="date" min={scheduleForm.startDate || minToday} value={scheduleForm.endDate} onChange={(event) => setScheduleForm({ ...scheduleForm, endDate: event.target.value })} /></Field>
            </div>
            <Field label="Notas" optional><Textarea value={scheduleForm.notes} onChange={(event) => setScheduleForm({ ...scheduleForm, notes: event.target.value })} /></Field>
            <Button type="submit" loading={saving === "schedule"}>Guardar horario</Button>
          </form>
        </SectionCard>

        <SectionCard title="Incidencias y recuperaciones" description="Aquí gestionas excepciones sobre el horario fijo: cancelar una clase concreta, moverla a otra fecha o programar una recuperación.">
          <form className="grid gap-4" onSubmit={(event: FormEvent) => {
            event.preventDefault();
            void submit("exception", () => apiRequest("/api/escuela/incidencias", {
              method: "POST",
              body: JSON.stringify({
                ...exceptionForm,
                scheduleId: exceptionForm.scheduleId ? Number(exceptionForm.scheduleId) : null,
                replacementRoomId: exceptionForm.replacementRoomId ? Number(exceptionForm.replacementRoomId) : null,
              }),
            }), "Incidencia guardada");
          }}>
            <Field label="Horario afectado" optional>
              <Select value={exceptionForm.scheduleId} onChange={(event) => setExceptionForm({ ...exceptionForm, scheduleId: event.target.value })}>
                <option value="">Incidencia puntual</option>
                {overview.schedules.map((item) => <option key={item.id} value={item.id}>{item.subjectName} · {item.studentNames}</option>)}
              </Select>
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Tipo" required>
                <Select value={exceptionForm.type} onChange={(event) => setExceptionForm({ ...exceptionForm, type: event.target.value })}>
                  <option value="CANCELADA">Cancelada</option>
                  <option value="REPROGRAMADA">Reprogramada</option>
                  <option value="RECUPERACION">Recuperación</option>
                </Select>
              </Field>
              <Field label="Fecha original" required><Input type="date" min={minToday} value={exceptionForm.originalDate} onChange={(event) => setExceptionForm({ ...exceptionForm, originalDate: event.target.value })} /></Field>
              {exceptionForm.type !== "CANCELADA" ? <>
                <Field label="Fecha nueva" required><Input type="date" min={exceptionForm.originalDate || minToday} value={exceptionForm.replacementDate} onChange={(event) => setExceptionForm({ ...exceptionForm, replacementDate: event.target.value })} /></Field>
                <Field label="Aula nueva" required>
                  <Select value={exceptionForm.replacementRoomId} onChange={(event) => setExceptionForm({ ...exceptionForm, replacementRoomId: event.target.value })}>
                    <option value="">Selecciona un aula</option>
                    {overview.rooms.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </Select>
                </Field>
                <Field label="Inicio" required>
                  <Select value={exceptionForm.replacementStartTime} onChange={(event) => setExceptionForm({ ...exceptionForm, replacementStartTime: event.target.value })}>
                    {QUARTER_HOUR_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </Select>
                </Field>
                <Field label="Fin" required>
                  <Select value={exceptionForm.replacementEndTime} onChange={(event) => setExceptionForm({ ...exceptionForm, replacementEndTime: event.target.value })}>
                    {QUARTER_HOUR_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </Select>
                </Field>
              </> : null}
            </div>
            <Field label="Notas" optional><Textarea value={exceptionForm.notes} onChange={(event) => setExceptionForm({ ...exceptionForm, notes: event.target.value })} /></Field>
            <Button type="submit" loading={saving === "exception"}>Guardar incidencia</Button>
          </form>
        </SectionCard>
      </div>

      <SectionCard title="Resumen operativo" description="Visión rápida de horarios e incidencias ya cargados.">
        {overview.schedules.length === 0 ? <EmptyState text="Todavía no hay horarios definidos." /> : (
          <FilterableDataTable
            rows={overview.schedules}
            getRowKey={(item) => item.id}
            columns={[
              { header: "Asignatura", filterValue: (item) => item.subjectName, render: (item) => <span className="text-white">{item.subjectName}</span>, minWidth: 220 },
              { header: "Tipo", filterValue: (item) => overview.subjects.find((subject) => subject.id === item.subjectId)?.subjectType === "COLECTIVA" ? "Colectiva" : "Individual", render: (item) => overview.subjects.find((subject) => subject.id === item.subjectId)?.subjectType === "COLECTIVA" ? "Colectiva" : "Individual", minWidth: 150 },
              { header: "Profesor", filterValue: (item) => item.teacherName, render: (item) => item.teacherName, minWidth: 220 },
              { header: "Alumnado", filterValue: (item) => item.studentNames, render: (item) => item.studentNames, minWidth: 260 },
              { header: "Aula", filterValue: (item) => item.roomName, render: (item) => item.roomName, minWidth: 180 },
              { header: "Día", filterValue: (item) => weekDays.find((day) => day.value === item.dayOfWeek)?.label, render: (item) => weekDays.find((day) => day.value === item.dayOfWeek)?.label, minWidth: 150 },
              { header: "Horario", filterValue: (item) => `${item.startTime} - ${item.endTime}`, render: (item) => <span className="text-slate-400">{item.startTime} - {item.endTime}</span>, minWidth: 160 },
            ]}
          />
        )}
      </SectionCard>
    </Page>
  );
}
