"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

type PerfilValues = {
  phone: string;
  email: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
};

export function PerfilForm({
  action,
  initialValues,
}: {
  action: (
    prevState: { error?: string; ok?: boolean } | undefined,
    formData: FormData
  ) => Promise<{ error?: string; ok?: boolean } | undefined>;
  initialValues: PerfilValues;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="max-w-md space-y-4">
      {state?.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      {state?.ok ? (
        <Alert>
          <AlertDescription>Datos actualizados.</AlertDescription>
        </Alert>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="phone">Teléfono (WhatsApp)</Label>
        <Input id="phone" name="phone" type="tel" defaultValue={initialValues.phone} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Correo</Label>
        <Input id="email" name="email" type="email" defaultValue={initialValues.email ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="emergencyContactName">Contacto de emergencia</Label>
        <Input
          id="emergencyContactName"
          name="emergencyContactName"
          defaultValue={initialValues.emergency_contact_name ?? ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="emergencyContactPhone">Teléfono de emergencia</Label>
        <Input
          id="emergencyContactPhone"
          name="emergencyContactPhone"
          type="tel"
          defaultValue={initialValues.emergency_contact_phone ?? ""}
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Guardando..." : "Guardar cambios"}
      </Button>
    </form>
  );
}
