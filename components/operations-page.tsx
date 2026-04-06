"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { DataTable, EmptyState, Page, PageHeader, SearchBox, SectionCard } from "@/components/ui";
import { apiRequest, HttpError } from "@/lib/api";
import { formatDate, labelize } from "@/lib/format";
import type { Garment, GarmentLoan, GarmentWash, Instrument, InstrumentLoan, InstrumentRepair } from "@/lib/types";

type PageKind = "garmentLoans" | "garmentWashes" | "instrumentLoans" | "instrumentRepairs";

export function OperationsPage({ kind }: { kind: PageKind }) {
  const { token } = useAuth();
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<Array<Record<string, string | number | null>>>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!token) return;
      if (kind === "garmentLoans" || kind === "garmentWashes") {
        const garments = await apiRequest<Garment[]>("/api/vestimentas", {}, token);
        const nested = await Promise.all(garments.map((garment) =>
          apiRequest<GarmentLoan[] | GarmentWash[]>(`/api/vestimentas/${garment.id}/${kind === "garmentLoans" ? "prestamos" : "lavados"}`, {}, token)
        ));
        const flattened = nested.flat().map((item) => item as GarmentLoan | GarmentWash);
        if (kind === "garmentLoans") {
          setRows((flattened as GarmentLoan[]).map((item) => ({ id: item.id, recurso: item.garmentIdentifier, persona: item.personName, inicio: formatDate(item.startDate), fin: formatDate(item.endDate), responsable: item.responsiblePersonName || "Sin dato" })));
        } else {
          setRows((flattened as GarmentWash[]).map((item) => ({ id: item.id, recurso: item.garmentIdentifier, inicio: formatDate(item.startDate), fin: formatDate(item.endDate), descripcion: item.description, responsable: item.responsiblePersonName || "Sin dato", estado: item.inProgress ? "En proceso" : "Finalizado" })));
        }
      } else {
        const instruments = await apiRequest<Instrument[]>("/api/instrumentos", {}, token);
        const nested = await Promise.all(instruments.map((instrument) =>
          apiRequest<InstrumentLoan[] | InstrumentRepair[]>(`/api/instrumentos/${instrument.id}/${kind === "instrumentLoans" ? "prestamos" : "reparaciones"}`, {}, token)
        ));
        const flattened = nested.flat().map((item) => item as InstrumentLoan | InstrumentRepair);
        if (kind === "instrumentLoans") {
          setRows((flattened as InstrumentLoan[]).map((item) => ({ id: item.id, recurso: item.instrumentName, persona: item.personName, inicio: formatDate(item.startDate), fin: formatDate(item.endDate), responsable: item.responsiblePersonName || "Sin dato" })));
        } else {
          setRows((flattened as InstrumentRepair[]).map((item) => ({ id: item.id, recurso: item.instrumentName, inicio: formatDate(item.startDate), fin: formatDate(item.endDate), descripcion: item.description, proveedor: item.provider || "Sin dato" })));
        }
      }
    }

    load().catch((err) => setError(err instanceof HttpError ? err.message : "No se pudo cargar la informacion"));
  }, [kind, token]);

  const filtered = useMemo(() => {
    const normalized = query.toLowerCase();
    return rows.filter((row) => Object.values(row).some((value) => String(value ?? "").toLowerCase().includes(normalized)));
  }, [query, rows]);

  const titles = {
    garmentLoans: ["Prestamos de vestimentas", "Vista consolidada de todos los prestamos registrados."],
    garmentWashes: ["Lavados", "Historico unificado de lavados de vestimentas."],
    instrumentLoans: ["Prestamos de instrumentos", "Vista consolidada de prestamos de instrumentos."],
    instrumentRepairs: ["Reparaciones", "Seguimiento de reparaciones por instrumento."],
  } as const;

  const headers = filtered[0] ? Object.keys(filtered[0]).filter((key) => key !== "id") : [];

  return (
    <Page>
      <PageHeader title={titles[kind][0]} subtitle={titles[kind][1]} />
      {error ? <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</div> : null}
      <SectionCard title="Listado">
        <SearchBox value={query} onChange={setQuery} placeholder="Buscar en el historico" />
        {filtered.length === 0 ? (
          <EmptyState text="No hay registros disponibles todavia." />
        ) : (
          <DataTable headers={headers.map(labelize)}>
            {filtered.map((row) => (
              <tr key={String(row.id)}>
                {headers.map((header) => <td key={header} className="px-4 py-4 text-sm text-slate-300">{row[header] as string}</td>)}
              </tr>
            ))}
          </DataTable>
        )}
      </SectionCard>
    </Page>
  );
}
