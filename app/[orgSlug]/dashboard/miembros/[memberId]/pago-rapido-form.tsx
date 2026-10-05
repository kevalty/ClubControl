"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

export function PagoRapidoForm({
  action,
  planes,
  defaultPlanId,
}: {
  action: (
    prev: { error?: string } | undefined,
    fd: FormData
  ) => Promise<{ error?: string }>;
  planes: Plan[];
  defaultPlanId?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(action, undefined);
  const [planId, setPlanId] = useState(defaultPlanId ?? planes[0]?.id ?? "");
  const selectedPlan = planes.find((p) => p.id === planId);
  const [amount, setAmount] = useState(
    selectedPlan ? selectedPlan.price.toFixed(2) : ""
  );

  // Refresh and close on success
  useEffect(() => {
    if (state !== undefined && !state.error) {
      setOpen(false);
      router.refresh();
    }
  }, [state, router]);

  if (!open) {
    return (
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="mt-3"
        onClick={() => setOpen(true)}
      >
        + Registrar pago
      </Button>
    );
  }

  return (
    <form action={formAction} className="mt-4 space-y-3 border-t border-[#1a1a2e] pt-4">
      <p className="text-sm font-semibold text-white">
        Registrar pago — se aprueba y la membresía se activa al instante
      </p>

      {state?.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1 col-span-2 sm:col-span-1">
          <Label className="text-xs text-[#9ca3af]">Plan *</Label>
          <Select
            name="planId"
            value={planId}
            onValueChange={(v) => {
              setPlanId(v);
              const p = planes.find((x) => x.id === v);
              if (p) setAmount(p.price.toFixed(2));
            }}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Seleccionar plan" />
            </SelectTrigger>
            <SelectContent>
              {planes.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} — ${p.price.toFixed(2)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-[#9ca3af]">Monto USD *</Label>
          <Input
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            required
            className="h-9"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-[#9ca3af]">Método *</Label>
          <Select name="method" defaultValue="cash">
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Efectivo</SelectItem>
              <SelectItem value="bank_transfer">Transferencia bancaria</SelectItem>
              <SelectItem value="other">Otro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1 col-span-2 sm:col-span-1">
          <Label className="text-xs text-[#9ca3af]">Referencia</Label>
          <Input
            name="referenceNumber"
            placeholder="Nº de comprobante (opcional)"
            className="h-9"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending || planes.length === 0}>
          {pending ? "Procesando..." : "✓ Registrar y activar"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setOpen(false)}
          disabled={pending}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
