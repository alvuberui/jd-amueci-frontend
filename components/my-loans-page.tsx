"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useFeedback } from "@/components/feedback-provider";
import { DataTable, EmptyState, LoadingState, Page, PageHeader, SectionCard, StatusBadge } from "@/components/ui";
import { HttpError, apiRequest } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { MyLoansResponse } from "@/lib/types";

const emptyData: MyLoansResponse = {
  garmentLoans: [],
  instrumentLoans: [],
};

export function MyLoansPage() {
  const { token, user } = useAuth();
  const { notify } = useFeedback();
  const [data, setData] = useState<MyLoansResponse>(emptyData);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    apiRequest<MyLoansResponse>("/api/mis-prestamos", {}, token)
      .then(setData)
      .catch((err) => {
        const message = err instanceof HttpError ? err.message : "No se pudieron cargar tus préstamos";
        setError(message);
        notify({ title: "No se pudieron cargar tus préstamos", description: message, tone: "error" });
      })
      .finally(() => setLoading(false));
  }, [notify, token]);

  return (
    <Page>
      <PageHeader
        title="Mis préstamos"
        subtitle={`Consulta de préstamos de vestimentas e instrumentos asociados a ${user?.displayName ?? "tu usuario"}.`}
      />

      {error ? <div className="rounded-[18px] border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-50">{error}</div> : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="Vestimentas" description="Histórico de prendas que tienes asociadas.">
          {loading ? <LoadingState compact title="Cargando préstamos de vestimenta" description="Un momento, estamos preparando la información." /> : data.garmentLoans.length === 0 ? (
            <EmptyState text="No tienes préstamos de vestimenta registrados." />
          ) : (
            <DataTable headers={["Vestimenta", "Inicio", "Fin", "Estado"]}>
              {data.garmentLoans.map((loan) => {
                const active = !loan.endDate;
                return (
                  <tr key={loan.id}>
                    <td className="px-4 py-4 text-white">{loan.garmentIdentifier}</td>
                    <td className="px-4 py-4 text-slate-300">{formatDate(loan.startDate)}</td>
                    <td className="px-4 py-4 text-slate-300">{formatDate(loan.endDate)}</td>
                    <td className="px-4 py-4"><StatusBadge value={active ? "PRESTADA" : "DISPONIBLE"} /></td>
                  </tr>
                );
              })}
            </DataTable>
          )}
        </SectionCard>

        <SectionCard title="Instrumentos" description="Histórico de instrumentos vinculados a tu usuario.">
          {loading ? <LoadingState compact title="Cargando préstamos de instrumento" description="Un momento, estamos preparando la información." /> : data.instrumentLoans.length === 0 ? (
            <EmptyState text="No tienes préstamos de instrumento registrados." />
          ) : (
            <DataTable headers={["Instrumento", "Inicio", "Fin", "Estado"]}>
              {data.instrumentLoans.map((loan) => {
                const active = !loan.endDate;
                return (
                  <tr key={loan.id}>
                    <td className="px-4 py-4 text-white">{loan.instrumentName}</td>
                    <td className="px-4 py-4 text-slate-300">{formatDate(loan.startDate)}</td>
                    <td className="px-4 py-4 text-slate-300">{formatDate(loan.endDate)}</td>
                    <td className="px-4 py-4"><StatusBadge value={active ? "PRESTADO" : "DISPONIBLE"} /></td>
                  </tr>
                );
              })}
            </DataTable>
          )}
        </SectionCard>
      </div>
    </Page>
  );
}
