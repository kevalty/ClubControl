"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2 } from "lucide-react";

type Plan = { id: string; name: string; price_monthly: number };

export function PagarSuscripcionForm({
  action,
  planes,
}: {
  action: (
    prevState: { error?: string; ok?: boolean } | undefined,
    formData: FormData
  ) => Promise<{ error?: string; ok?: boolean } | undefined>;
  planes: Plan[];
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  if (state?.ok) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-[#4ade80]/20 bg-[#4ade80]/5 p-4 text-sm text-[#4ade80]">
        <CheckCircle2 className="size-5 shrink-0" />
        Pago registrado. El equipo de GestorClub lo revisará pronto.
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <p className="rounded-lg bg-[rgba(239,68,68,0.1)] px-4 py-3 text-sm text-[#f87171]">
          {state.error}
        </p>
      )}

      <div className="space-y-2">
        <Label className="text-sm text-[#9ca3af]">Plan</Label>
        <select
          name="planId"
          required
          className="w-full rounded-lg border border-[#1a1a2e] bg-[#14142a] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50"
        >
          <option value="">Selecciona un plan…</option>
          {planes.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — ${Number(p.price_monthly).toFixed(2)}/mes
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount" className="text-sm text-[#9ca3af]">Monto transferido (USD)</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          min="0"
          step="0.01"
          required
          className="border-[#1a1a2e] bg-[#14142a] text-white placeholder:text-[#3d3d5c]"
          placeholder="0.00"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="referenceNumber" className="text-sm text-[#9ca3af]">
          Número de comprobante <span className="text-[#3d3d5c]">(opcional)</span>
        </Label>
        <Input
          id="referenceNumber"
          name="referenceNumber"
          className="border-[#1a1a2e] bg-[#14142a] text-white placeholder:text-[#3d3d5c]"
          placeholder="Ej. 123456789"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="proof" className="text-sm text-[#9ca3af]">
          Comprobante <span className="text-[#3d3d5c]">(opcional)</span>
        </Label>
        <Input
          id="proof"
          name="proof"
          type="file"
          accept="image/*,application/pdf"
          className="border-[#1a1a2e] bg-[#14142a] text-white file:mr-3 file:rounded-md file:border-0 file:bg-[#6366f1]/20 file:px-3 file:py-1 file:text-xs file:font-medium file:text-[#818cf8]"
        />
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="w-full bg-[#6366f1] text-white hover:bg-[#5254cc]"
      >
        {pending ? "Enviando…" : "Registrar pago"}
      </Button>
    </form>
  );
}
