"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WEEKDAYS } from "@/lib/validations/class";

type ClaseFormValues = {
  name: string;
  description: string | null;
  trainer_user_id: string | null;
  capacity: number;
  location: string | null;
  recurrence_rule: { days: string[]; start_time: string; end_time: string };
};

export function ClaseForm({
  action,
  initialValues,
  entrenadores,
  submitLabel,
}: {
  action: (
    prevState: { error?: string } | undefined,
    formData: FormData
  ) => Promise<{ error?: string } | undefined>;
  initialValues?: ClaseFormValues;
  entrenadores: { userId: string; name: string }[];
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const diasSeleccionados = initialValues?.recurrence_rule.days ?? [];

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      {state?.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="name">Nombre de la clase</Label>
        <Input id="name" name="name" defaultValue={initialValues?.name} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Descripción (opcional)</Label>
        <Textarea id="description" name="description" defaultValue={initialValues?.description ?? ""} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="capacity">Cupo máximo</Label>
          <Input
            id="capacity"
            name="capacity"
            type="number"
            min="1"
            defaultValue={initialValues?.capacity ?? 20}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Lugar (opcional)</Label>
          <Input id="location" name="location" defaultValue={initialValues?.location ?? ""} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="trainerUserId">Entrenador (opcional)</Label>
        <Select name="trainerUserId" defaultValue={initialValues?.trainer_user_id ?? ""}>
          <SelectTrigger id="trainerUserId" className="w-full">
            <SelectValue placeholder="Sin asignar" />
          </SelectTrigger>
          <SelectContent>
            {entrenadores.map((e) => (
              <SelectItem key={e.userId} value={e.userId}>
                {e.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Días de la semana</Label>
        <div className="flex flex-wrap gap-3">
          {WEEKDAYS.map((d) => (
            <label key={d.value} className="flex items-center gap-1.5 text-sm">
              <Checkbox name="days" value={d.value} defaultChecked={diasSeleccionados.includes(d.value)} />
              {d.label}
            </label>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startTime">Hora de inicio</Label>
          <Input
            id="startTime"
            name="startTime"
            type="time"
            defaultValue={initialValues?.recurrence_rule.start_time ?? "18:00"}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endTime">Hora de fin</Label>
          <Input
            id="endTime"
            name="endTime"
            type="time"
            defaultValue={initialValues?.recurrence_rule.end_time ?? "19:00"}
            required
          />
        </div>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Guardando..." : submitLabel}
      </Button>
    </form>
  );
}
