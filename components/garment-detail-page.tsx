"use client";

import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useFeedback } from "@/components/feedback-provider";
import { Button, EmptyState, Field, FilterableDataTable, Input, LoadingState, Message, Page, PageHeader, SectionCard, Select, StatusBadge, Textarea, TransitionLink } from "@/components/ui";
import { apiRequest, HttpError } from "@/lib/api";
import { formatDate, formatDateTime, labelize } from "@/lib/format";
import type { Garment, GarmentLoan, GarmentWash, Member } from "@/lib/types";

const loanInitial = { personName: "", memberId: "", responsibleMemberId: "", responsiblePersonName: "", startDate: "", endDate: "", notes: "" };
const washInitial = { startDate: "", description: "", responsiblePersonName: "", inProgress: false, notes: "" };

export function GarmentDetailPage({ id }: { id: number }) {
  const { token } = useAuth();
  const { notify } = useFeedback();
  const [garment, setGarment] = useState<Garment | null>(null);
  const [loans, setLoans] = useState<GarmentLoan[]>([]);
  const [washes, setWashes] = useState<GarmentWash[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const boardMembers = members.filter((member) => member.boardMember);
  const [loanForm, setLoanForm] = useState(loanInitial);
  const [washForm, setWashForm] = useState(washInitial);
  const [error, setError] = useState<string | null>(null);
  const [loanFieldErrors, setLoanFieldErrors] = useState<Record<string, string>>({});
  const [washFieldErrors, setWashFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submittingLoan, setSubmittingLoan] = useState(false);
  const [submittingWash, setSubmittingWash] = useState(false);
  const [finalizingLoanId, setFinalizingLoanId] = useState<number | null>(null);
  const [finalizingWashId, setFinalizingWashId] = useState<number | null>(null);

  async function load() {
    if (!token) return;
    const [garmentData, loanData, washData, memberData] = await Promise.all([
      apiRequest<Garment>(`/api/vestimentas/${id}`, {}, token),
      apiRequest<GarmentLoan[]>(`/api/vestimentas/${id}/prestamos`, {}, token),
      apiRequest<GarmentWash[]>(`/api/vestimentas/${id}/lavados`, {}, token),
      apiRequest<Member[]>("/api/socios", {}, token),
    ]);
    setGarment(garmentData);
    setLoans(loanData);
    setWashes(washData);
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
      await apiRequest(`/api/vestimentas/${id}/prestamos`, {
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

  async function createWash(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    try {
      setSubmittingWash(true);
      await apiRequest(`/api/vestimentas/${id}/lavados`, {
        method: "POST",
        body: JSON.stringify({ ...washForm, startDate: washForm.startDate || null, endDate: null }),
      }, token);
      setWashForm(washInitial);
      setWashFieldErrors({});
      notify({ title: "Lavado registrado", tone: "success" });
      await load();
    } catch (err) {
      const message = err instanceof HttpError ? err.message : "No se pudo crear el lavado";
      setError(message);
      setWashFieldErrors(err instanceof HttpError ? (err.fieldErrors ?? {}) : {});
      notify({ title: "No se pudo registrar el lavado", description: message, tone: "error" });
    } finally {
      setSubmittingWash(false);
    }
  }

  async function finalizeLoan(loanId: number) {
    if (!token) return;
    try {
      setFinalizingLoanId(loanId);
      await apiRequest(`/api/vestimentas/${id}/prestamos/${loanId}/finalizar`, { method: "POST" }, token);
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

  async function finalizeWash(washId: number) {
    if (!token) return;
    try {
      setFinalizingWashId(washId);
      await apiRequest(`/api/vestimentas/${id}/lavados/${washId}/finalizar`, { method: "POST" }, token);
      notify({ title: "Lavado finalizado", tone: "success" });
      await load();
    } catch (err) {
      const message = err instanceof HttpError ? err.message : "No se pudo finalizar el lavado";
      setError(message);
      notify({ title: "No se pudo finalizar el lavado", description: message, tone: "error" });
    } finally {
      setFinalizingWashId(null);
    }
  }

  if (loading || !garment) return <div className="px-6 py-8"><LoadingState title="Cargando ficha de vestimenta" description="Recuperando detalle, préstamos y lavados." /></div>;

  return (
    <Page>
      <PageHeader
        title={`Vestimenta ${garment.identifier}`}
        subtitle="Ficha completa, prestamos y ciclo de lavado en una sola vista."
        actions={<TransitionLink className="inline-flex w-full min-h-11 items-center justify-center rounded-[18px] border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/5 sm:w-auto" href="/vestimentas">Volver</TransitionLink>}
      />
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

        <SectionCard title="Nuevo lavado">
          <form className="space-y-4" onSubmit={createWash}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Fecha inicio" required error={washFieldErrors.startDate}><Input type="date" value={washForm.startDate} onChange={(event) => setWashForm({ ...washForm, startDate: event.target.value })} /></Field>
              <Field label="Descripcion" required error={washFieldErrors.description}><Input value={washForm.description} onChange={(event) => setWashForm({ ...washForm, description: event.target.value })} /></Field>
              <Field label="Responsable" optional error={washFieldErrors.responsiblePersonName}><Input value={washForm.responsiblePersonName} onChange={(event) => setWashForm({ ...washForm, responsiblePersonName: event.target.value })} /></Field>
              <Field label="En proceso" optional><Select value={washForm.inProgress ? "si" : "no"} onChange={(event) => setWashForm({ ...washForm, inProgress: event.target.value === "si" })}><option value="no">No</option><option value="si">Si</option></Select></Field>
            </div>
            <Field label="Observaciones" optional error={washFieldErrors.notes}><Textarea value={washForm.notes} onChange={(event) => setWashForm({ ...washForm, notes: event.target.value })} /></Field>
            <Button type="submit" loading={submittingWash}>Crear lavado</Button>
          </form>
        </SectionCard>
      </div>

      <SectionCard title="Historico de lavados">
        {washes.length === 0 ? <EmptyState text="Sin lavados registrados." /> : (
          <FilterableDataTable
            rows={washes}
            getRowKey={(wash) => wash.id}
            columns={[
              { header: "Inicio", filterValue: (wash) => formatDate(wash.startDate), render: (wash) => <span className="text-slate-400">{formatDate(wash.startDate)}</span>, minWidth: 150 },
              { header: "Fin", filterValue: (wash) => formatDate(wash.endDate), render: (wash) => <span className="text-slate-400">{formatDate(wash.endDate)}</span>, minWidth: 150 },
              { header: "Descripcion", filterValue: (wash) => wash.description, render: (wash) => <span className="text-white">{wash.description}</span>, minWidth: 260 },
              { header: "Responsable", filterValue: (wash) => wash.responsiblePersonName || "Sin dato", render: (wash) => <span className="text-slate-400">{wash.responsiblePersonName || "Sin dato"}</span>, minWidth: 220 },
              { header: "Estado", filterValue: (wash) => wash.inProgress ? "En proceso" : "Finalizado", render: (wash) => <span className="text-slate-400">{wash.inProgress ? "En proceso" : "Finalizado"}</span>, minWidth: 150 },
              { header: "Acciones", filterable: false, render: (wash) => wash.inProgress ? <Button variant="secondary" loading={finalizingWashId === wash.id} onClick={() => finalizeWash(wash.id)}>Finalizar</Button> : null, minWidth: 160 },
            ]}
          />
        )}
      </SectionCard>
    </Page>
  );
}
