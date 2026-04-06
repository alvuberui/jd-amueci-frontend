"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { Button, DataTable, EmptyState, Field, Input, Message, Page, PageHeader, SectionCard, Select, StatusBadge, Textarea } from "@/components/ui";
import { apiRequest, HttpError } from "@/lib/api";
import { formatDate, formatDateTime, labelize } from "@/lib/format";
import type { Garment, GarmentLoan, GarmentWash } from "@/lib/types";

const loanInitial = { personName: "", responsiblePersonName: "", startDate: "", endDate: "", notes: "" };
const washInitial = { startDate: "", description: "", responsiblePersonName: "", inProgress: false, notes: "" };

export function GarmentDetailPage({ id }: { id: number }) {
  const { token } = useAuth();
  const [garment, setGarment] = useState<Garment | null>(null);
  const [loans, setLoans] = useState<GarmentLoan[]>([]);
  const [washes, setWashes] = useState<GarmentWash[]>([]);
  const [loanForm, setLoanForm] = useState(loanInitial);
  const [washForm, setWashForm] = useState(washInitial);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loanFieldErrors, setLoanFieldErrors] = useState<Record<string, string>>({});
  const [washFieldErrors, setWashFieldErrors] = useState<Record<string, string>>({});

  async function load() {
    if (!token) return;
    const [garmentData, loanData, washData] = await Promise.all([
      apiRequest<Garment>(`/api/vestimentas/${id}`, {}, token),
      apiRequest<GarmentLoan[]>(`/api/vestimentas/${id}/prestamos`, {}, token),
      apiRequest<GarmentWash[]>(`/api/vestimentas/${id}/lavados`, {}, token),
    ]);
    setGarment(garmentData);
    setLoans(loanData);
    setWashes(washData);
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof HttpError ? err.message : "No se pudo cargar el detalle"));
  }, [id, token]);

  async function createLoan(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    try {
      await apiRequest(`/api/vestimentas/${id}/prestamos`, {
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

  async function createWash(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    try {
      await apiRequest(`/api/vestimentas/${id}/lavados`, {
        method: "POST",
        body: JSON.stringify({ ...washForm, startDate: washForm.startDate || null, endDate: null }),
      }, token);
      setWashForm(washInitial);
      setWashFieldErrors({});
      setMessage("Lavado registrado");
      await load();
    } catch (err) {
      setError(err instanceof HttpError ? err.message : "No se pudo crear el lavado");
      setWashFieldErrors(err instanceof HttpError ? (err.fieldErrors ?? {}) : {});
    }
  }

  async function finalizeLoan(loanId: number) {
    if (!token) return;
    await apiRequest(`/api/vestimentas/${id}/prestamos/${loanId}/finalizar`, { method: "POST" }, token);
    setMessage("Prestamo finalizado");
    await load();
  }

  async function finalizeWash(washId: number) {
    if (!token) return;
    await apiRequest(`/api/vestimentas/${id}/lavados/${washId}/finalizar`, { method: "POST" }, token);
    setMessage("Lavado finalizado");
    await load();
  }

  if (!garment) return <div className="px-6 py-8 text-sm text-slate-400">Cargando...</div>;

  return (
    <Page>
      <PageHeader
        title={`Vestimenta ${garment.identifier}`}
        subtitle="Ficha completa, prestamos y ciclo de lavado en una sola vista."
        actions={<Link className="inline-flex rounded-2xl border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/5" href="/vestimentas">Volver</Link>}
      />
      <Message text={message} tone="success" />
      <Message text={error} />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionCard title="Ficha principal">
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["Tipo", labelize(garment.type)],
              ["Talla", garment.size],
              ["Compra", formatDate(garment.purchaseDate)],
              ["Creada", formatDateTime(garment.createdAt)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
                <p className="mt-2 text-sm text-white">{value}</p>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Estado</p>
            <div className="mt-3"><StatusBadge value={garment.status} /></div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Observaciones</p>
            <p className="mt-3 text-sm text-slate-300">{garment.notes || "Sin observaciones"}</p>
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

        <SectionCard title="Nuevo lavado">
          <form className="space-y-4" onSubmit={createWash}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Fecha inicio" required error={washFieldErrors.startDate}><Input type="date" value={washForm.startDate} onChange={(event) => setWashForm({ ...washForm, startDate: event.target.value })} /></Field>
              <Field label="Descripcion" required error={washFieldErrors.description}><Input value={washForm.description} onChange={(event) => setWashForm({ ...washForm, description: event.target.value })} /></Field>
              <Field label="Responsable" optional error={washFieldErrors.responsiblePersonName}><Input value={washForm.responsiblePersonName} onChange={(event) => setWashForm({ ...washForm, responsiblePersonName: event.target.value })} /></Field>
              <Field label="En proceso" optional><Select value={washForm.inProgress ? "si" : "no"} onChange={(event) => setWashForm({ ...washForm, inProgress: event.target.value === "si" })}><option value="no">No</option><option value="si">Si</option></Select></Field>
            </div>
            <Field label="Observaciones" optional error={washFieldErrors.notes}><Textarea value={washForm.notes} onChange={(event) => setWashForm({ ...washForm, notes: event.target.value })} /></Field>
            <Button type="submit">Crear lavado</Button>
          </form>
        </SectionCard>
      </div>

      <SectionCard title="Historico de lavados">
        {washes.length === 0 ? <EmptyState text="Sin lavados registrados." /> : (
          <DataTable headers={["Inicio", "Fin", "Descripcion", "Responsable", "Estado", "Acciones"]}>
            {washes.map((wash) => (
              <tr key={wash.id}>
                <td className="px-4 py-4 text-slate-400">{formatDate(wash.startDate)}</td>
                <td className="px-4 py-4 text-slate-400">{formatDate(wash.endDate)}</td>
                <td className="px-4 py-4 text-white">{wash.description}</td>
                <td className="px-4 py-4 text-slate-400">{wash.responsiblePersonName || "Sin dato"}</td>
                <td className="px-4 py-4 text-slate-400">{wash.inProgress ? "En proceso" : "Finalizado"}</td>
                <td className="px-4 py-4">{wash.inProgress ? <Button variant="secondary" onClick={() => finalizeWash(wash.id)}>Finalizar</Button> : null}</td>
              </tr>
            ))}
          </DataTable>
        )}
      </SectionCard>
    </Page>
  );
}
