"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useFeedback } from "@/components/feedback-provider";
import { EmptyState, FilterableDataTable, LoadingState, Page, PageHeader, SectionCard, StatusBadge } from "@/components/ui";
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
            <FilterableDataTable
              rows={data.garmentLoans}
              getRowKey={(loan) => loan.id}
              columns={[
                { header: "Vestimenta", filterValue: (loan) => loan.garmentIdentifier, render: (loan) => <span className="text-white">{loan.garmentIdentifier}</span>, minWidth: 200 },
                { header: "Inicio", filterValue: (loan) => formatDate(loan.startDate), render: (loan) => formatDate(loan.startDate), minWidth: 150 },
                { header: "Fin", filterValue: (loan) => formatDate(loan.endDate), render: (loan) => formatDate(loan.endDate), minWidth: 150 },
                { header: "Estado", filterValue: (loan) => !loan.endDate ? "Prestada" : "Disponible", render: (loan) => <StatusBadge value={!loan.endDate ? "PRESTADA" : "DISPONIBLE"} />, minWidth: 160 },
              ]}
            />
          )}
        </SectionCard>

        <SectionCard title="Instrumentos" description="Histórico de instrumentos vinculados a tu usuario.">
          {loading ? <LoadingState compact title="Cargando préstamos de instrumento" description="Un momento, estamos preparando la información." /> : data.instrumentLoans.length === 0 ? (
            <EmptyState text="No tienes préstamos de instrumento registrados." />
          ) : (
            <FilterableDataTable
              rows={data.instrumentLoans}
              getRowKey={(loan) => loan.id}
              columns={[
                { header: "Instrumento", filterValue: (loan) => loan.instrumentName, render: (loan) => <span className="text-white">{loan.instrumentName}</span>, minWidth: 220 },
                { header: "Inicio", filterValue: (loan) => formatDate(loan.startDate), render: (loan) => formatDate(loan.startDate), minWidth: 150 },
                { header: "Fin", filterValue: (loan) => formatDate(loan.endDate), render: (loan) => formatDate(loan.endDate), minWidth: 150 },
                { header: "Estado", filterValue: (loan) => !loan.endDate ? "Prestado" : "Disponible", render: (loan) => <StatusBadge value={!loan.endDate ? "PRESTADO" : "DISPONIBLE"} />, minWidth: 160 },
              ]}
            />
          )}
        </SectionCard>
      </div>
    </Page>
  );
}
