"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BILLING_CYCLE_LABELS } from "@/lib/validations/membership-plan";

type PlanFormValues = {
  name: string;
  description: string | null;
  price: number;
  billing_cycle: string;
  sessions_included: number | null;
  duration_days: number;
};

export function PlanForm({
  action,
  initialValues,
  submitLabel,
}: {
  action: (
    prevState: { error?: string } | undefined,
    formData: FormData
  ) => Promise<{ error?: string } | undefined>;
  initialValues?: PlanFormValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      {state?.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="name">Nombre del plan</Label>
        <Input id="name" name="name" defaultValue={initialValues?.name} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Descripción (opcional)</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={initialValues?.description ?? ""}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Precio (USD)</Label>
          <Input
            id="price"
            name="price"
            type="number"
            min="0"
            step="0.01"
            defaultValue={initialValues?.price}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="durationDays">Vigencia (días)</Label>
          <Input
            id="durationDays"
            name="durationDays"
            type="number"
            min="1"
            defaultValue={initialValues?.duration_days ?? 30}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="billingCycle">Tipo de plan</Label>
        <Select name="billingCycle" defaultValue={initialValues?.billing_cycle ?? "monthly"}>
          <SelectTrigger id="billingCycle" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(BILLING_CYCLE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="sessionsIncluded">
          Número de clases incluidas (solo para pack de clases)
        </Label>
        <Input
          id="sessionsIncluded"
          name="sessionsIncluded"
          type="number"
          min="1"
          defaultValue={initialValues?.sessions_included ?? ""}
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Guardando..." : submitLabel}
      </Button>
    </form>
  );
}
