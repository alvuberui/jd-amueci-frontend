"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { Button, DataTable, EmptyState, Field, Input, Message, Page, PageHeader, SectionCard, StatusBadge, Textarea } from "@/components/ui";
import { apiRequest, HttpError } from "@/lib/api";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import type { Instrument, InstrumentLoan, InstrumentRepair } from "@/lib/types";

const loanInitial = { personName: "", responsiblePersonName: "", startDate: "", endDate: "", notes: "" };
const repairInitial = { startDate: "", endDate: "", description: "", cost: "", provider: "", notes: "" };

export function InstrumentDetailPage({ id }: { id: number }) {
  const { token } = useAuth();
  const [instrument, setInstrument] = useState<Instrument | null>(null);
  const [loans, setLoans] = useState<InstrumentLoan[]>([]);
  const [repairs, setRepairs] = useState<InstrumentRepair[]>([]);
  const [loanForm, setLoanForm] = useState(loanInitial);
  const [repairForm, setRepairForm] = useState(repairInitial);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loanFieldErrors, setLoanFieldErrors] = useState<Record<string, string>>({});
  const [repairFieldErrors, setRepairFieldErrors] = useState<Record<string, string>>({});

  async function load() {
    if (!token) return;
    const [instrumentData, loanData, repairData] = await Promise.all([
      apiRequest<Instrument>(`/api/instrumentos/${id}`, {}, token),
      apiRequest<InstrumentLoan[]>(`/api/instrumentos/${id}/prestamos`, {}, token),
      apiRequest<InstrumentRepair[]>(`/api/instrumentos/${id}/reparaciones`, {}, token),
    ]);
    setInstrument(instrumentData);
    setLoans(loanData);
    setRepairs(repairData);
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof HttpError ? err.message : "No se pudo cargar el detalle"));
  }, [id, token]);

  async function createLoan(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    try {
      await apiRequest(`/api/instrumentos/${id}/prestamos`, {
        method: "POST",
        body: JSON.stringify({ ...loanForm, endDate: loanForm.endDate || null }),
      }, token);
      setLoanForm(loanInitial);
      setLoanFieldErrors({});
      setMessage("Prestamo registrado");
      await load();
    } catch (err) {
      setError(err instanceof HttpError ? err.message : "No se pudo crear el prestamo");
      setLoanFieldErrors(err instanceof HttpError ? (err.fieldErrors ?? {}) : {});
    }
  }

  async function createRepair(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    try {
      await apiRequest(`/api/instrumentos/${id}/reparaciones`, {
        method: "POST",
        body: JSON.stringify({ ...repairForm, endDate: repairForm.endDate || null, cost: repairForm.cost ? Number(repairForm.cost) : null }),
      }, token);
      setRepairForm(repairInitial);
      setRepairFieldErrors({});
      setMessage("Reparacion registrada");
      await load();
    } catch (err) {
      setError(err instanceof HttpError ? err.message : "No se pudo crear la reparacion");
      setRepairFieldErrors(err instanceof HttpError ? (err.fieldErrors ?? {}) : {});
    }
  }

  async function finalizeLoan(loanId: number) {
    if (!token) return;
    await apiRequest(`/api/instrumentos/${id}/prestamos/${loanId}/finalizar`, { method: "POST" }, token);
    setMessage("Prestamo finalizado");
    await load();
  }

  if (!instrument) return <div className="px-6 py-8 text-sm text-slate-400">Cargando...</div>;

  return (
    <Page>
      <PageHeader
        title={`Instrumento ${instrument.name}`}
        subtitle="Ficha tecnica, valor economico y ciclo operativo del instrumento."
        actions={<Link className="inline-flex rounded-2xl border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/5" href="/instrumentos">Volver</Link>}
      />
      <Message text={message} tone="success" />
      <Message text={error} />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionCard title="Ficha principal">
          {instrument.photoUrl ? (
            <Image src={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"}${instrument.photoUrl}`} alt={instrument.name} width={220} height={160} style={{ borderRadius: 18, objectFit: "cover" }} />
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["Familia", instrument.family],
              ["Marca / modelo", `${instrument.brand || "Sin marca"} ${instrument.model || ""}`.trim()],
              ["N. serie", instrument.serialNumber || "Sin dato"],
              ["Fecha compra", formatDate(instrument.purchaseDate)],
              ["Precio compra", formatCurrency(instrument.purchasePrice)],
              ["Precio actual", formatCurrency(instrument.currentPrice)],
              ["Actualizado", formatDateTime(instrument.updatedAt)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
                <p className="mt-2 text-sm text-white">{value}</p>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Estado</p>
            <div className="mt-3"><StatusBadge value={instrument.status} /></div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Observaciones</p>
            <p className="mt-3 text-sm text-slate-300">{instrument.notes || "Sin observaciones"}</p>
          </div>
        </SectionCard>

        <SectionCard title="Nuevo prestamo">
          <form className="space-y-4" onSubmit={createLoan}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Persona" required error={loanFieldErrors.personName}><Input value={loanForm.personName} onChange={(event) => setLoanForm({ ...loanForm, personName: event.target.value })} /></Field>
              <Field label="Responsable" optional error={loanFieldErrors.responsiblePersonName}><Input value={loanForm.responsiblePersonName} onChange={(event) => setLoanForm({ ...loanForm, responsiblePersonName: event.target.value })} /></Field>
              <Field label="Inicio" required error={loanFieldErrors.startDate}><Input type="date" value={loanForm.startDate} onChange={(event) => setLoanForm({ ...loanForm, startDate: event.target.value })} /></Field>
              <Field label="Fin" optional error={loanFieldErrors.endDate}><Input type="date" value={loanForm.endDate} onChange={(event) => setLoanForm({ ...loanForm, endDate: event.target.value })} /></Field>
            </div>
            <Field label="Observaciones" optional error={loanFieldErrors.notes}><Textarea value={loanForm.notes} onChange={(event) => setLoanForm({ ...loanForm, notes: event.target.value })} /></Field>
            <Button type="submit">Crear prestamo</Button>
          </form>
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard title="Historico de prestamos">
          {loans.length === 0 ? <EmptyState text="Sin prestamos registrados." /> : (
            <DataTable headers={["Persona", "Inicio", "Fin", "Responsable", "Acciones"]}>
              {loans.map((loan) => (
                <tr key={loan.id}>
                  <td className="px-4 py-4 text-white">{loan.personName}</td>
                  <td className="px-4 py-4 text-slate-400">{formatDate(loan.startDate)}</td>
                  <td className="px-4 py-4 text-slate-400">{formatDate(loan.endDate)}</td>
                  <td className="px-4 py-4 text-slate-400">{loan.responsiblePersonName || "Sin dato"}</td>
                  <td className="px-4 py-4">{!loan.endDate ? <Button variant="secondary" onClick={() => finalizeLoan(loan.id)}>Finalizar</Button> : null}</td>
                </tr>
              ))}
            </DataTable>
          )}
        </SectionCard>

        <SectionCard title="Nueva reparacion">
          <form className="space-y-4" onSubmit={createRepair}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Inicio" required error={repairFieldErrors.startDate}><Input type="date" value={repairForm.startDate} onChange={(event) => setRepairForm({ ...repairForm, startDate: event.target.value })} /></Field>
              <Field label="Fin" optional error={repairFieldErrors.endDate}><Input type="date" value={repairForm.endDate} onChange={(event) => setRepairForm({ ...repairForm, endDate: event.target.value })} /></Field>
              <Field label="Descripcion" required error={repairFieldErrors.description}><Input value={repairForm.description} onChange={(event) => setRepairForm({ ...repairForm, description: event.target.value })} /></Field>
              <Field label="Coste" optional error={repairFieldErrors.cost}><Input type="number" value={repairForm.cost} onChange={(event) => setRepairForm({ ...repairForm, cost: event.target.value })} /></Field>
              <Field label="Proveedor" optional error={repairFieldErrors.provider}><Input value={repairForm.provider} onChange={(event) => setRepairForm({ ...repairForm, provider: event.target.value })} /></Field>
            </div>
            <Field label="Observaciones" optional error={repairFieldErrors.notes}><Textarea value={repairForm.notes} onChange={(event) => setRepairForm({ ...repairForm, notes: event.target.value })} /></Field>
            <Button type="submit">Crear reparacion</Button>
          </form>
        </SectionCard>
      </div>

      <SectionCard title="Historico de reparaciones">
        {repairs.length === 0 ? <EmptyState text="Sin reparaciones registradas." /> : (
          <DataTable headers={["Inicio", "Fin", "Descripcion", "Proveedor", "Coste"]}>
            {repairs.map((repair) => <tr key={repair.id}><td className="px-4 py-4 text-slate-400">{formatDate(repair.startDate)}</td><td className="px-4 py-4 text-slate-400">{formatDate(repair.endDate)}</td><td className="px-4 py-4 text-white">{repair.description}</td><td className="px-4 py-4 text-slate-400">{repair.provider || "Sin dato"}</td><td className="px-4 py-4 text-slate-400">{formatCurrency(repair.cost)}</td></tr>)}
          </DataTable>
        )}
      </SectionCard>
    </Page>
  );
}
