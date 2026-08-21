"use client";

import { useActionState, useState } from "react";
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

type Plan = { id: string; name: string; price: number };
type Membresia = { id: string; end_date: string; plan_name: string };

export function PagarForm({
  action,
  planes,
  membresias,
  cuentaBancaria,
}: {
  action: (
    prevState: { error?: string; ok?: boolean } | undefined,
    formData: FormData
  ) => Promise<{ error?: string; ok?: boolean } | undefined>;
  planes: Plan[];
  membresias: Membresia[];
  cuentaBancaria: {
    bank_name: string;
    account_type: string;
    account_number: string;
    account_holder_name: string;
    account_holder_document: string;
  } | null;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [modo, setModo] = useState<"renovar" | "nuevo">(
    membresias.length > 0 ? "renovar" : "nuevo"
  );

  if (state?.ok) {
    return (
      <Alert>
        <AlertDescription>
          Pago registrado. Un miembro del staff revisará tu comprobante pronto.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {cuentaBancaria ? (
        <Alert>
          <AlertDescription>
            Transfiere a: <strong>{cuentaBancaria.bank_name}</strong> — cuenta{" "}
            {cuentaBancaria.account_type} N.º {cuentaBancaria.account_number}, a
            nombre de {cuentaBancaria.account_holder_name} (
            {cuentaBancaria.account_holder_document}). Luego sube tu comprobante abajo.
          </AlertDescription>
        </Alert>
      ) : null}

      <form action={formAction} className="space-y-4">
        {state?.error ? (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        ) : null}

        {membresias.length > 0 ? (
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={modo === "renovar"}
                onChange={() => setModo("renovar")}
              />
              Renovar mi membresía
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" checked={modo === "nuevo"} onChange={() => setModo("nuevo")} />
              Comprar otro plan
            </label>
          </div>
        ) : null}

        {modo === "renovar" && membresias.length > 0 ? (
          <div className="space-y-2">
            <Label htmlFor="membershipId">Membresía</Label>
            <Select name="membershipId" defaultValue={membresias[0].id}>
              <SelectTrigger id="membershipId" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {membresias.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.plan_name} (vence {m.end_date})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="planId">Plan</Label>
            <Select name="planId">
              <SelectTrigger id="planId" className="w-full">
                <SelectValue placeholder="Selecciona un plan" />
              </SelectTrigger>
              <SelectContent>
                {planes.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} (${Number(p.price).toFixed(2)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="amount">Monto transferido (USD)</Label>
          <Input id="amount" name="amount" type="number" min="0" step="0.01" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="referenceNumber">Número de comprobante (opcional)</Label>
          <Input id="referenceNumber" name="referenceNumber" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="proof">Foto o PDF del comprobante</Label>
          <Input id="proof" name="proof" type="file" accept="image/*,application/pdf" required />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Enviando..." : "Enviar comprobante"}
        </Button>
      </form>
    </div>
  );
}
