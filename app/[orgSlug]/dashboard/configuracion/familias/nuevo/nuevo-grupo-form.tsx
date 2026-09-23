"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

type ActionState = { error?: string; ok?: boolean } | undefined;

export function NuevoGrupoForm({
  action,
  backHref,
}: {
  action: (prev: unknown, formData: FormData) => Promise<{ error?: string; ok?: boolean }>;
  backHref: string;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, undefined);

  if (state?.ok) {
    return (
      <div className="space-y-4">
        <p className="text-green-400 font-medium">Grupo creado correctamente.</p>
        <Link href={backHref} className="text-sm text-[#818cf8] hover:underline">
          Volver a grupos familiares
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {state?.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="name">Nombre del grupo</Label>
        <Input id="name" name="name" placeholder="Ej. Familia García" required />
      </div>

      <p className="text-xs text-muted-foreground">
        Ingresa monto fijo en USD o porcentaje (o ambos)
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="discount_amount">Descuento fijo (USD)</Label>
          <Input
            id="discount_amount"
            name="discount_amount"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
          />
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
            placeholder="0"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Creando..." : "Crear grupo"}
        </Button>
        <Link
          href={backHref}
          className="inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-[#6b7280] hover:text-white"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
