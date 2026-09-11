"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

type SedeFormValues = { name: string; address?: string | null; phone?: string | null };

export function SedeForm({
  action,
  initialValues,
  submitLabel,
}: {
  action: (prev: { error?: string } | undefined, fd: FormData) => Promise<{ error?: string } | undefined>;
  initialValues?: SedeFormValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="max-w-md space-y-4">
      {state?.error ? (
        <Alert variant="destructive"><AlertDescription>{state.error}</AlertDescription></Alert>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="name">Nombre de la sede *</Label>
        <Input id="name" name="name" defaultValue={initialValues?.name} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Dirección</Label>
        <Input id="address" name="address" defaultValue={initialValues?.address ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Teléfono</Label>
        <Input id="phone" name="phone" type="tel" defaultValue={initialValues?.phone ?? ""} />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Guardando..." : submitLabel}
      </Button>
    </form>
  );
}
