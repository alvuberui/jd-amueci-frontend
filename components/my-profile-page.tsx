"use client";

import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useFeedback } from "@/components/feedback-provider";
import { Button, Field, Input, LoadingState, Message, Page, PageHeader, SectionCard, Textarea } from "@/components/ui";
import { HttpError, apiRequest } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { MEMBER_INSTRUMENT_OPTIONS } from "@/lib/types";
import type { Member } from "@/lib/types";

export function MyProfilePage() {
  const { token, logout, user } = useAuth();
  const { notify } = useFeedback();
  const [profile, setProfile] = useState<Member | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordFieldErrors, setPasswordFieldErrors] = useState<Record<string, string>>({});
  const [submittingPassword, setSubmittingPassword] = useState(false);

  function formatInstrument(value: Member["instrument"]) {
    return MEMBER_INSTRUMENT_OPTIONS.find((item) => item.value === value)?.label ?? value;
  }

  function formatRole(role: string) {
    return {
      SOCIO: "Socio",
      DIRECTIVA: "Directiva",
      DIRECCION_ESCUELA: "Dirección de escuela",
      PROFESOR: "Profesor",
      ALUMNO: "Alumno",
    }[role] ?? role;
  }

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    apiRequest<Member>("/api/mi-perfil", {}, token)
      .then(setProfile)
      .catch((err) => {
        const message = err instanceof HttpError ? err.message : "No se pudo cargar tu perfil";
        setError(message);
        notify({ title: "No se pudo cargar tu perfil", description: message, tone: "error" });
      })
      .finally(() => setLoading(false));
  }, [notify, token]);

  async function handlePasswordSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      setSubmittingPassword(true);
      setPasswordError(null);
      setPasswordFieldErrors({});
      await apiRequest("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify(passwordForm),
      });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      notify({ title: "Contraseña actualizada", description: "Vuelve a iniciar sesión con tu nueva contraseña.", tone: "success" });
      await logout();
    } catch (err) {
      const fieldErrors = err instanceof HttpError ? (err.fieldErrors ?? {}) : {};
      const explicitFieldMessage = fieldErrors.currentPassword ?? fieldErrors.newPassword ?? fieldErrors.confirmPassword;
      const message = explicitFieldMessage || (err instanceof HttpError ? err.message : "No se pudo actualizar la contraseña");
      setPasswordError(message);
      setPasswordFieldErrors(fieldErrors);
      notify({ title: "No se pudo actualizar la contraseña", description: message, tone: "error" });
    } finally {
      setSubmittingPassword(false);
    }
  }

  if (loading) {
    return <div className="px-6 py-8"><LoadingState title="Cargando perfil" description="Estamos preparando tu información personal." /></div>;
  }

  return (
    <Page>
      <PageHeader
        title="Mi perfil"
        subtitle="Consulta de tus datos de socio. Esta información es solo de lectura."
      />

      <Message text={error} />

      {profile ? (
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <SectionCard title="Datos personales" description="Información asociada a tu cuenta de socio.">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nombre"><Input value={profile.firstName} readOnly /></Field>
              <Field label="Apellidos"><Input value={profile.lastName} readOnly /></Field>
              <Field label="NIF"><Input value={profile.nif} readOnly /></Field>
              <Field label="Teléfono"><Input value={profile.phone ?? ""} readOnly /></Field>
              <Field label="Localidad"><Input value={profile.city ?? ""} readOnly /></Field>
              <Field label="Instrumento"><Input value={formatInstrument(profile.instrument)} readOnly /></Field>
            </div>
            <Field label="Dirección">
              <Textarea value={profile.address} readOnly />
            </Field>
          </SectionCard>

          <SectionCard title="Acceso asociado" description="Resumen del perfil con el que estás dentro de la plataforma.">
            <div className="grid gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Tipo de acceso</p>
                <p className="mt-2 text-sm text-white">
                  {profile.socio ? (profile.boardMember ? "Socio con permisos de directiva" : "Socio") : "Usuario interno sin perfil de socio"}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Roles asignados</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(user?.roles ?? []).map((role) => (
                    <span key={role} className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-medium text-slate-200">
                      {formatRole(role)}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Alta en el sistema</p>
                <p className="mt-2 text-sm text-white">{formatDateTime(profile.createdAt)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Última actualización</p>
                <p className="mt-2 text-sm text-white">{formatDateTime(profile.updatedAt)}</p>
              </div>
            </div>
            <form className="mt-6 space-y-4" onSubmit={handlePasswordSubmit}>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm font-semibold text-white">Cambiar contraseña</p>
                <p className="mt-1 text-sm text-slate-400">
                  Por seguridad, al actualizarla se cerrará tu sesión actual.
                </p>
              </div>
              <Field label="Contraseña actual" required error={passwordFieldErrors.currentPassword}>
                <Input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(event) => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })}
                  autoComplete="current-password"
                />
              </Field>
              <Field label="Nueva contraseña" required error={passwordFieldErrors.newPassword}>
                <Input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })}
                  autoComplete="new-password"
                />
              </Field>
              <Field label="Confirmar nueva contraseña" required error={passwordFieldErrors.confirmPassword}>
                <Input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(event) => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })}
                  autoComplete="new-password"
                />
              </Field>
              <Message text={passwordError} />
              <Button type="submit" loading={submittingPassword}>Actualizar contraseña</Button>
            </form>
          </SectionCard>
        </div>
      ) : null}
    </Page>
  );
}
