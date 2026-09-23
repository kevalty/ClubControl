"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
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
import { PAYMENT_METHOD_LABELS } from "@/lib/validations/payment";

type Rubro = { id: string; name: string; discount_percent: number };
type FamilyGroup = { id?: string; name: string; discount_amount: number | null; discount_percent: number | null };
type Miembro = { id: string; full_name: string; rubro: Rubro | null; familyGroup?: FamilyGroup | null };
type Plan = { id: string; name: string; price: number };
type Membresia = {
  id: string;
  member_id: string;
  end_date: string;
  status: string;
  plan_name: string;
  plan_price: number | null;
};

export function RegistrarPagoForm({
  action,
  miembros,
  planes,
  membresias,
  preselectedMemberId,
  familyGroupMap = {},
}: {
  action: (
    prevState: { error?: string } | undefined,
    formData: FormData
  ) => Promise<{ error?: string } | undefined>;
  miembros: Miembro[];
  planes: Plan[];
  membresias: Membresia[];
  preselectedMemberId?: string;
  familyGroupMap?: Record<string, FamilyGroup>;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [memberId, setMemberId] = useState<string>(preselectedMemberId ?? "");
  const [modo, setModo] = useState<"renovar" | "nuevo">("nuevo");
  const [planId, setPlanId] = useState<string>("");
  const [membershipId, setMembershipId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");

  const miembroSeleccionado = useMemo(
    () => miembros.find((m) => m.id === memberId) ?? null,
    [miembros, memberId]
  );

  const membresiasDelMiembro = useMemo(
    () => membresias.filter((m) => m.member_id === memberId),
    [membresias, memberId]
  );

  function applyDiscount(basePrice: number): string {
    const pct = miembroSeleccionado?.rubro?.discount_percent ?? 0;
    return (basePrice * (1 - pct / 100)).toFixed(2);
  }

  function handlePlanChange(value: string | null) {
    if (!value) return;
    setPlanId(value);
    const plan = planes.find((p) => p.id === value);
    if (plan) setAmount(applyDiscount(Number(plan.price)));
  }

  useEffect(() => {
    if (modo === "renovar" && membresiasDelMiembro.length > 0 && !membershipId) {
      const first = membresiasDelMiembro[0];
      setMembershipId(first.id);
      if (first.plan_price != null) setAmount(applyDiscount(Number(first.plan_price)));
    }
  }, [modo, memberId]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleMembershipChange(value: string | null) {
    if (!value) return;
    setMembershipId(value);
    const mem = membresiasDelMiembro.find((m) => m.id === value);
    if (mem?.plan_price != null) setAmount(applyDiscount(Number(mem.plan_price)));
  }

  function handleModoChange(nuevoModo: "renovar" | "nuevo") {
    setModo(nuevoModo);
    setPlanId("");
    setMembershipId("");
    setAmount("");
  }

  return (
    <form action={formAction} className="space-y-4">
      {state?.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="memberId">Estudiante / Miembro</Label>
        <Select
          name="memberId"
          value={memberId}
          onValueChange={(value: string | null) => {
            setMemberId(value ?? "");
            setMembershipId("");
            setPlanId("");
            setAmount("");
          }}
        >
          <SelectTrigger id="memberId" className="w-full">
            <SelectValue placeholder="Selecciona un miembro" />
          </SelectTrigger>
          <SelectContent>
            {miembros.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.full_name}
                {m.rubro ? ` (${m.rubro.name})` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Descuento familiar */}
      {miembroSeleccionado?.familyGroup ?? (memberId ? familyGroupMap[memberId] : null) ? (
        <p className="text-xs text-amber-400 mt-1">
          {(miembroSeleccionado?.familyGroup ?? familyGroupMap[memberId]).name}:{" "}
          {(miembroSeleccionado?.familyGroup ?? familyGroupMap[memberId]).discount_amount != null
            ? `descuento familiar -$${Number((miembroSeleccionado?.familyGroup ?? familyGroupMap[memberId]).discount_amount).toFixed(2)}`
            : (miembroSeleccionado?.familyGroup ?? familyGroupMap[memberId]).discount_percent != null
              ? `descuento familiar ${(miembroSeleccionado?.familyGroup ?? familyGroupMap[memberId]).discount_percent}%`
              : "sin descuento configurado"}
        </p>
      ) : null}

      {/* Mostrar rubro del miembro seleccionado */}
      {miembroSeleccionado?.rubro ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm">
          <span className="font-medium text-amber-400">Rubro: </span>
          <span className="text-amber-300">
            {miembroSeleccionado.rubro.name}
            {miembroSeleccionado.rubro.discount_percent > 0
              ? ` — ${miembroSeleccionado.rubro.discount_percent}% de descuento`
              : ""}
          </span>
        </div>
      ) : null}

      {memberId ? (
        <div className="space-y-2">
          <Label>¿Este pago es...?</Label>
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={modo === "renovar"}
                onChange={() => handleModoChange("renovar")}
                disabled={membresiasDelMiembro.length === 0}
              />
              Renovación de membresía existente
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={modo === "nuevo"}
                onChange={() => handleModoChange("nuevo")}
              />
              Plan nuevo
            </label>
          </div>
        </div>
      ) : null}

      {memberId && modo === "renovar" ? (
        <div className="space-y-2">
          <Label htmlFor="membershipId">Membresía a renovar</Label>
          <Select name="membershipId" value={membershipId} onValueChange={handleMembershipChange}>
            <SelectTrigger id="membershipId" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {membresiasDelMiembro.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.plan_name} (vence {m.end_date})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {memberId && modo === "nuevo" ? (
        <div className="space-y-2">
          <Label htmlFor="planId">Plan</Label>
          <Select name="planId" value={planId} onValueChange={handlePlanChange}>
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
      ) : null}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Monto (USD)</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          {miembroSeleccionado?.rubro?.discount_percent ? (
            <p className="text-xs text-muted-foreground">
              Precio con descuento de {miembroSeleccionado.rubro.discount_percent}% ya aplicado.
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="method">Método de pago</Label>
          <Select name="method" defaultValue="bank_transfer">
            <SelectTrigger id="method" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="referenceNumber">Número de referencia (opcional)</Label>
        <Input id="referenceNumber" name="referenceNumber" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="proof">Comprobante (opcional)</Label>
        <Input id="proof" name="proof" type="file" accept="image/*,application/pdf" />
      </div>

      <Button type="submit" disabled={pending || !memberId}>
        {pending ? "Registrando..." : "Registrar pago"}
      </Button>
    </form>
  );
}
