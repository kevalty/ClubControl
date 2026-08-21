"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

type MemberFormValues = {
  full_name: string;
  email: string | null;
  phone: string;
  document_id: string | null;
  birth_date: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  notes: string | null;
};

export function MiembroForm({
  action,
  initialValues,
  submitLabel,
}: {
  action: (
    prevState: { error?: string } | undefined,
    formData: FormData
  ) => Promise<{ error?: string } | undefined>;
  initialValues?: MemberFormValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      {state?.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="fullName">Nombre completo</Label>
        <Input id="fullName" name="fullName" defaultValue={initialValues?.full_name} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono (WhatsApp)</Label>
          <Input id="phone" name="phone" type="tel" defaultValue={initialValues?.phone} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Correo (opcional)</Label>
          <Input id="email" name="email" type="email" defaultValue={initialValues?.email ?? ""} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="documentId">Cédula (opcional)</Label>
          <Input id="documentId" name="documentId" defaultValue={initialValues?.document_id ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="birthDate">Fecha de nacimiento</Label>
          <Input
            id="birthDate"
            name="birthDate"
            type="date"
            defaultValue={initialValues?.birth_date ?? ""}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="emergencyContactName">Contacto de emergencia</Label>
          <Input
            id="emergencyContactName"
            name="emergencyContactName"
            defaultValue={initialValues?.emergency_contact_name ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="emergencyContactPhone">Teléfono de emergencia</Label>
          <Input
            id="emergencyContactPhone"
            name="emergencyContactPhone"
            type="tel"
            defaultValue={initialValues?.emergency_contact_phone ?? ""}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notas (opcional)</Label>
        <Textarea id="notes" name="notes" defaultValue={initialValues?.notes ?? ""} />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Guardando..." : submitLabel}
      </Button>
    </form>
  );
}
