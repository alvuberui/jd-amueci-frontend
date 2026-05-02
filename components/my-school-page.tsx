"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useFeedback } from "@/components/feedback-provider";
import { EmptyState, FilterableDataTable, LoadingState, Page, PageHeader, SectionCard } from "@/components/ui";
import { HttpError, apiRequest } from "@/lib/api";
import type { MySchoolAgenda } from "@/lib/types";

export function MySchoolPage() {
  const { token, user } = useAuth();
  const { notify } = useFeedback();
  const [agenda, setAgenda] = useState<MySchoolAgenda | null>(null);
  const [loading, setLoading] = useState(true);
  const hasTeacherRole = user?.roles.includes("PROFESOR") ?? false;
  const hasStudentRole = user?.roles.includes("ALUMNO") ?? false;
  const canSeeClasses = hasTeacherRole || hasStudentRole;

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    apiRequest<MySchoolAgenda>("/api/escuela/mi-agenda")
      .then(setAgenda)
      .catch((err) => {
        const message = err instanceof HttpError ? err.message : "No se pudo cargar la agenda";
        notify({ title: "No se pudo cargar la agenda", description: message, tone: "error" });
      })
      .finally(() => setLoading(false));
  }, [notify, token]);

  if (loading || !agenda) {
    return <Page><LoadingState title="Cargando agenda" description="Estamos preparando tus próximas clases y reservas." /></Page>;
  }

  return (
    <Page>
      <PageHeader
        title="Mi agenda"
        subtitle={
          !canSeeClasses
            ? "Aquí tienes tus reservas y actividad personal dentro de la sede."
            : hasTeacherRole && hasStudentRole
            ? "Aquí tienes tu visión personal combinada de docencia, clases recibidas y reservas."
            : hasTeacherRole
              ? "Consulta tus próximas clases como profesor y tus reservas activas."
              : "Consulta tus próximas clases como alumno y tus reservas activas."
        }
      />

      {canSeeClasses ? (
        <SectionCard title="Próximas clases" description="Se muestran las sesiones programadas para los próximos 30 días, incluidas recuperaciones o reprogramaciones.">
          {agenda.classes.length === 0 ? <EmptyState text="No hay clases previstas en este periodo." /> : (
            <FilterableDataTable
              rows={agenda.classes}
              getRowKey={(item, index) => `${item.date}-${item.subjectName}-${index}`}
              columns={[
                { header: "Fecha", filterValue: (item) => item.date, render: (item) => <span className="text-white">{item.date}</span>, minWidth: 150 },
                { header: "Tipo", filterValue: (item) => item.type, render: (item) => item.type, minWidth: 150 },
                { header: "Asignatura", filterValue: (item) => item.subjectName, render: (item) => item.subjectName, minWidth: 190 },
                { header: "Aula", filterValue: (item) => item.roomName, render: (item) => item.roomName, minWidth: 170 },
                { header: "Horario", filterValue: (item) => item.startTime && item.endTime ? `${item.startTime} - ${item.endTime}` : "Por definir", render: (item) => item.startTime && item.endTime ? `${item.startTime} - ${item.endTime}` : "Por definir", minWidth: 160 },
                { header: "Profesor", filterValue: (item) => item.teacherName || "-", render: (item) => <span className="text-slate-400">{item.teacherName || "-"}</span>, minWidth: 200 },
                { header: "Alumnado", filterValue: (item) => item.studentNames || "-", render: (item) => <span className="text-slate-400">{item.studentNames || "-"}</span>, minWidth: 240 },
              ]}
            />
          )}
        </SectionCard>
      ) : null}

      <SectionCard title="Reservas de aula" description="Listado de tus reservas futuras dentro del módulo de aulas.">
        {agenda.reservations.length === 0 ? <EmptyState text="No tienes reservas activas ahora mismo." /> : (
          <FilterableDataTable
            rows={agenda.reservations}
            getRowKey={(item) => item.id}
            columns={[
              { header: "Fecha", filterValue: (item) => item.reservationDate, render: (item) => <span className="text-white">{item.reservationDate}</span>, minWidth: 150 },
              { header: "Aula", filterValue: (item) => item.roomName, render: (item) => item.roomName, minWidth: 180 },
              { header: "Tipo", filterValue: (item) => item.type, render: (item) => item.type, minWidth: 150 },
              { header: "Horario", filterValue: (item) => `${item.startTime} - ${item.endTime}`, render: (item) => `${item.startTime} - ${item.endTime}`, minWidth: 160 },
              { header: "Notas", filterValue: (item) => item.notes || "Sin notas", render: (item) => <span className="text-slate-400">{item.notes || "Sin notas"}</span>, minWidth: 260 },
            ]}
          />
        )}
      </SectionCard>
    </Page>
  );
}
