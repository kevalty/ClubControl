"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Plan = { id: string; name: string; price_monthly: number };

export function PagarSuscripcionForm({
  action,
  planes,
  planActualId,
}: {
  action: (
    prevState: { error?: string; ok?: boolean } | undefined,
    formData: FormData
  ) => Promise<{ error?: string; ok?: boolean } | undefined>;
  planes: Plan[];
  planActualId?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  // Solo usar defaultValue si el plan actual está en la lista disponible
  const planEnLista = planes.some((p) => p.id === planActualId);
  const defaultPlanId = planEnLista ? planActualId : undefined;

  if (state?.ok) {
    return (
      <Alert>
        <AlertDescription>
          Pago registrado. El equipo de GestorClub lo revisará pronto.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form action={formAction} className="max-w-md space-y-4">
      {state?.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="planId">Plan</Label>
        <Select name="planId" defaultValue={defaultPlanId}>
          <SelectTrigger id="planId" className="w-full">
            <SelectValue placeholder="Selecciona un plan" />
          </SelectTrigger>
          <SelectContent>
            {planes.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name} (${Number(p.price_monthly).toFixed(2)}/mes)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="amount">Monto transferido (USD)</Label>
        <Input id="amount" name="amount" type="number" min="0" step="0.01" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="referenceNumber">Número de comprobante (opcional)</Label>
        <Input id="referenceNumber" name="referenceNumber" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="proof">Comprobante (opcional)</Label>
        <Input id="proof" name="proof" type="file" accept="image/*,application/pdf" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Enviando..." : "Registrar pago"}
      </Button>
    </form>
  );
}
