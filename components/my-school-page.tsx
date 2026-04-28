"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useFeedback } from "@/components/feedback-provider";
import { DataTable, EmptyState, LoadingState, Page, PageHeader, SectionCard } from "@/components/ui";
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
            <DataTable headers={["Fecha", "Tipo", "Asignatura", "Aula", "Horario", "Profesor", "Alumnado"]}>
              {agenda.classes.map((item, index) => (
                <tr key={`${item.date}-${item.subjectName}-${index}`}>
                  <td className="px-4 py-4 text-white">{item.date}</td>
                  <td className="px-4 py-4 text-slate-300">{item.type}</td>
                  <td className="px-4 py-4 text-slate-300">{item.subjectName}</td>
                  <td className="px-4 py-4 text-slate-300">{item.roomName}</td>
                  <td className="px-4 py-4 text-slate-300">{item.startTime && item.endTime ? `${item.startTime} - ${item.endTime}` : "Por definir"}</td>
                  <td className="px-4 py-4 text-slate-400">{item.teacherName || "-"}</td>
                  <td className="px-4 py-4 text-slate-400">{item.studentNames || "-"}</td>
                </tr>
              ))}
            </DataTable>
          )}
        </SectionCard>
      ) : null}

      <SectionCard title="Reservas de aula" description="Listado de tus reservas futuras dentro del módulo de aulas.">
        {agenda.reservations.length === 0 ? <EmptyState text="No tienes reservas activas ahora mismo." /> : (
          <DataTable headers={["Fecha", "Aula", "Tipo", "Horario", "Notas"]}>
            {agenda.reservations.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-4 text-white">{item.reservationDate}</td>
                <td className="px-4 py-4 text-slate-300">{item.roomName}</td>
                <td className="px-4 py-4 text-slate-300">{item.type}</td>
                <td className="px-4 py-4 text-slate-300">{item.startTime} - {item.endTime}</td>
                <td className="px-4 py-4 text-slate-400">{item.notes || "Sin notas"}</td>
              </tr>
            ))}
          </DataTable>
        )}
      </SectionCard>
    </Page>
  );
}
