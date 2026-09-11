"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

type RubroFormValues = { name: string; description?: string | null; discount_percent: number };

export function RubroForm({
  action,
  initialValues,
  submitLabel,
}: {
  action: (prev: { error?: string } | undefined, fd: FormData) => Promise<{ error?: string } | undefined>;
  initialValues?: RubroFormValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="max-w-md space-y-4">
      {state?.error ? (
        <Alert variant="destructive"><AlertDescription>{state.error}</AlertDescription></Alert>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="name">Nombre del rubro *</Label>
        <Input id="name" name="name" defaultValue={initialValues?.name} required
          placeholder="Ej: Becado, Solo 3 días, Tiempo completo" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea id="description" name="description" defaultValue={initialValues?.description ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="discount_percent">Descuento (%)</Label>
        <Input
          id="discount_percent"
          name="discount_percent"
          type="number"
          min="0"
          max="100"
          step="0.01"
          defaultValue={initialValues?.discount_percent ?? 0}
        />
        <p className="text-xs text-muted-foreground">
          0 = sin descuento. 100 = totalmente becado. El precio final = precio del plan × (1 - descuento/100).
        </p>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Guardando..." : submitLabel}
      </Button>
    </form>
  );
}
