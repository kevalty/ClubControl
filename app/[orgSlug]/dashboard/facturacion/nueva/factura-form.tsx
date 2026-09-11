"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function FacturaForm({
  action,
}: {
  action: (prev: { error?: string } | undefined, fd: FormData) => Promise<{ error?: string } | undefined>;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [subtotal, setSubtotal] = useState(0);
  const tax = Number((subtotal * 0.15).toFixed(2));
  const total = Number((subtotal + tax).toFixed(2));

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      {state?.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="recipient_name">Nombre / Razón social del receptor *</Label>
        <Input id="recipient_name" name="recipient_name" required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="recipient_document">Cédula / RUC *</Label>
          <Input id="recipient_document" name="recipient_document" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="recipient_address">Dirección</Label>
          <Input id="recipient_address" name="recipient_address" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="concept">Concepto *</Label>
        <Textarea id="concept" name="concept" required placeholder="Mensualidad octubre 2026, Pack 10 clases, etc." />
      </div>
      <div className="space-y-2">
        <Label htmlFor="subtotal">Subtotal (USD) *</Label>
        <Input
          id="subtotal"
          name="subtotal"
          type="number"
          min="0.01"
          step="0.01"
          required
          onChange={(e) => setSubtotal(Number(e.target.value) || 0)}
        />
      </div>
      <div className="rounded-lg bg-muted p-4 text-sm space-y-1">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>IVA 15%</span>
          <span>${tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-semibold">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Generando..." : "Generar factura"}
      </Button>
    </form>
  );
}
