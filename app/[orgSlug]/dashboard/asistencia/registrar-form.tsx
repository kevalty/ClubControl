"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function RegistrarAsistenciaForm({
  action,
  miembros,
}: {
  action: (
    prevState: { error?: string; ok?: boolean } | undefined,
    formData: FormData
  ) => Promise<{ error?: string; ok?: boolean } | undefined>;
  miembros: { id: string; full_name: string }[];
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      {state?.error ? (
        <Alert variant="destructive" className="w-full">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      {state?.ok ? (
        <Alert className="w-full">
          <AlertDescription>Asistencia registrada.</AlertDescription>
        </Alert>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="memberId">Miembro</Label>
        <Select name="memberId">
          <SelectTrigger id="memberId" className="w-64">
            <SelectValue placeholder="Buscar miembro" />
          </SelectTrigger>
          <SelectContent>
            {miembros.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Registrando..." : "Registrar asistencia manual"}
      </Button>
    </form>
  );
}
