"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useFeedback } from "@/components/feedback-provider";
import { Button, EmptyState, Field, FilterableDataTable, Input, LoadingState, Message, Page, PageHeader, SectionCard, Select, StatusBadge, Textarea, TransitionLink } from "@/components/ui";
import { apiRequest, HttpError } from "@/lib/api";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import type { Instrument, InstrumentLoan, InstrumentRepair, Member } from "@/lib/types";

const loanInitial = { personName: "", memberId: "", responsibleMemberId: "", responsiblePersonName: "", startDate: "", endDate: "", notes: "" };
const repairInitial = { startDate: "", endDate: "", description: "", cost: "", provider: "", notes: "" };

export function InstrumentDetailPage({ id }: { id: number }) {
  const { token } = useAuth();
  const { notify } = useFeedback();
  const [instrument, setInstrument] = useState<Instrument | null>(null);
  const [loans, setLoans] = useState<InstrumentLoan[]>([]);
  const [repairs, setRepairs] = useState<InstrumentRepair[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const boardMembers = members.filter((member) => member.boardMember);
  const [loanForm, setLoanForm] = useState(loanInitial);
  const [repairForm, setRepairForm] = useState(repairInitial);
  const [error, setError] = useState<string | null>(null);
  const [loanFieldErrors, setLoanFieldErrors] = useState<Record<string, string>>({});
  const [repairFieldErrors, setRepairFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submittingLoan, setSubmittingLoan] = useState(false);
  const [submittingRepair, setSubmittingRepair] = useState(false);
  const [finalizingLoanId, setFinalizingLoanId] = useState<number | null>(null);

  async function load() {
    if (!token) return;
    const [instrumentData, loanData, repairData, memberData] = await Promise.all([
      apiRequest<Instrument>(`/api/instrumentos/${id}`, {}, token),
      apiRequest<InstrumentLoan[]>(`/api/instrumentos/${id}/prestamos`, {}, token),
      apiRequest<InstrumentRepair[]>(`/api/instrumentos/${id}/reparaciones`, {}, token),
      apiRequest<Member[]>("/api/socios", {}, token),
    ]);
    setInstrument(instrumentData);
    setLoans(loanData);
    setRepairs(repairData);
    setMembers(memberData);
  }

  useEffect(() => {
    setLoading(true);
    load()
      .catch((err) => {
        const message = err instanceof HttpError ? err.message : "No se pudo cargar el detalle";
        setError(message);
        notify({ title: "No se pudo cargar la ficha", description: message, tone: "error" });
      })
      .finally(() => setLoading(false));
  }, [id, notify, token]);

  async function createLoan(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    try {
      setSubmittingLoan(true);
      const selectedMember = members.find((item) => String(item.id) === loanForm.memberId);
      await apiRequest(`/api/instrumentos/${id}/prestamos`, {
        method: "POST",
        body: JSON.stringify({
          ...loanForm,
          memberId: loanForm.memberId ? Number(loanForm.memberId) : null,
          responsibleMemberId: loanForm.responsibleMemberId ? Number(loanForm.responsibleMemberId) : null,
          personName: selectedMember?.fullName ?? loanForm.personName,
          responsiblePersonName: null,
          endDate: loanForm.endDate || null,
        }),
      }, token);
      setLoanForm(loanInitial);
      setLoanFieldErrors({});
      notify({ title: "Préstamo registrado", tone: "success" });
      await load();
    } catch (err) {
      const message = err instanceof HttpError ? err.message : "No se pudo crear el prestamo";
      setError(message);
      setLoanFieldErrors(err instanceof HttpError ? (err.fieldErrors ?? {}) : {});
      notify({ title: "No se pudo registrar el préstamo", description: message, tone: "error" });
    } finally {
      setSubmittingLoan(false);
    }
  }

  async function createRepair(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    try {
      setSubmittingRepair(true);
      await apiRequest(`/api/instrumentos/${id}/reparaciones`, {
        method: "POST",
        body: JSON.stringify({ ...repairForm, endDate: repairForm.endDate || null, cost: repairForm.cost ? Number(repairForm.cost) : null }),
      }, token);
      setRepairForm(repairInitial);
      setRepairFieldErrors({});
      notify({ title: "Reparación registrada", tone: "success" });
      await load();
    } catch (err) {
      const message = err instanceof HttpError ? err.message : "No se pudo crear la reparacion";
      setError(message);
      setRepairFieldErrors(err instanceof HttpError ? (err.fieldErrors ?? {}) : {});
      notify({ title: "No se pudo registrar la reparación", description: message, tone: "error" });
    } finally {
      setSubmittingRepair(false);
    }
  }

  async function finalizeLoan(loanId: number) {
    if (!token) return;
    try {
      setFinalizingLoanId(loanId);
      await apiRequest(`/api/instrumentos/${id}/prestamos/${loanId}/finalizar`, { method: "POST" }, token);
      notify({ title: "Préstamo finalizado", tone: "success" });
      await load();
    } catch (err) {
      const message = err instanceof HttpError ? err.message : "No se pudo finalizar el prestamo";
      setError(message);
      notify({ title: "No se pudo finalizar el préstamo", description: message, tone: "error" });
    } finally {
      setFinalizingLoanId(null);
    }
  }

  if (loading || !instrument) return <div className="px-6 py-8"><LoadingState title="Cargando ficha de instrumento" description="Recuperando detalle, préstamos y reparaciones." /></div>;

  return (
    <Page>
      <PageHeader
        title={`Instrumento ${instrument.name}`}
        subtitle="Ficha tecnica, valor economico y ciclo operativo del instrumento."
        actions={<TransitionLink className="inline-flex w-full min-h-11 items-center justify-center rounded-[18px] border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/5 sm:w-auto" href="/instrumentos">Volver</TransitionLink>}
      />
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
              <Field label="Socio" optional>
                <Select value={loanForm.memberId} onChange={(event) => {
                  const value = event.target.value;
                  const selected = members.find((item) => String(item.id) === value);
                  setLoanForm({
                    ...loanForm,
                    memberId: value,
                    personName: selected?.fullName ?? loanForm.personName,
                  });
                }}>
                  <option value="">Sin vincular a socio</option>
                  {members.map((member) => <option key={member.id} value={member.id}>{member.fullName}</option>)}
                </Select>
              </Field>
              <Field label="Persona" required error={loanFieldErrors.personName}><Input value={loanForm.personName} onChange={(event) => setLoanForm({ ...loanForm, personName: event.target.value, memberId: "" })} /></Field>
              <Field label="Responsable" optional error={loanFieldErrors.responsibleMemberId ?? loanFieldErrors.responsiblePersonName}>
                <Select value={loanForm.responsibleMemberId} onChange={(event) => setLoanForm({ ...loanForm, responsibleMemberId: event.target.value })}>
                  <option value="">Sin asignar</option>
                  {boardMembers.map((member) => <option key={member.id} value={member.id}>{member.fullName}</option>)}
                </Select>
              </Field>
              <Field label="Inicio" required error={loanFieldErrors.startDate}><Input type="date" value={loanForm.startDate} onChange={(event) => setLoanForm({ ...loanForm, startDate: event.target.value })} /></Field>
              <Field label="Fin" optional error={loanFieldErrors.endDate}><Input type="date" value={loanForm.endDate} onChange={(event) => setLoanForm({ ...loanForm, endDate: event.target.value })} /></Field>
            </div>
            <Field label="Observaciones" optional error={loanFieldErrors.notes}><Textarea value={loanForm.notes} onChange={(event) => setLoanForm({ ...loanForm, notes: event.target.value })} /></Field>
            <Button type="submit" loading={submittingLoan}>Crear prestamo</Button>
          </form>
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard title="Historico de prestamos">
          {loans.length === 0 ? <EmptyState text="Sin prestamos registrados." /> : (
            <FilterableDataTable
              rows={loans}
              getRowKey={(loan) => loan.id}
              columns={[
                { header: "Persona", filterValue: (loan) => loan.personName, render: (loan) => <span className="text-white">{loan.personName}</span>, minWidth: 220 },
                { header: "Inicio", filterValue: (loan) => formatDate(loan.startDate), render: (loan) => <span className="text-slate-400">{formatDate(loan.startDate)}</span>, minWidth: 150 },
                { header: "Fin", filterValue: (loan) => formatDate(loan.endDate), render: (loan) => <span className="text-slate-400">{formatDate(loan.endDate)}</span>, minWidth: 150 },
                { header: "Responsable", filterValue: (loan) => loan.responsiblePersonName || "Sin dato", render: (loan) => <span className="text-slate-400">{loan.responsiblePersonName || "Sin dato"}</span>, minWidth: 220 },
                { header: "Acciones", filterable: false, render: (loan) => !loan.endDate ? <Button variant="secondary" loading={finalizingLoanId === loan.id} onClick={() => finalizeLoan(loan.id)}>Finalizar</Button> : null, minWidth: 160 },
              ]}
            />
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
            <Button type="submit" loading={submittingRepair}>Crear reparacion</Button>
          </form>
        </SectionCard>
      </div>

      <SectionCard title="Historico de reparaciones">
        {repairs.length === 0 ? <EmptyState text="Sin reparaciones registradas." /> : (
          <FilterableDataTable
            rows={repairs}
            getRowKey={(repair) => repair.id}
            columns={[
              { header: "Inicio", filterValue: (repair) => formatDate(repair.startDate), render: (repair) => <span className="text-slate-400">{formatDate(repair.startDate)}</span>, minWidth: 150 },
              { header: "Fin", filterValue: (repair) => formatDate(repair.endDate), render: (repair) => <span className="text-slate-400">{formatDate(repair.endDate)}</span>, minWidth: 150 },
              { header: "Descripcion", filterValue: (repair) => repair.description, render: (repair) => <span className="text-white">{repair.description}</span>, minWidth: 260 },
              { header: "Proveedor", filterValue: (repair) => repair.provider || "Sin dato", render: (repair) => <span className="text-slate-400">{repair.provider || "Sin dato"}</span>, minWidth: 200 },
              { header: "Coste", filterValue: (repair) => formatCurrency(repair.cost), render: (repair) => <span className="text-slate-400">{formatCurrency(repair.cost)}</span>, minWidth: 150 },
            ]}
          />
        )}
      </SectionCard>
    </Page>
  );
}
