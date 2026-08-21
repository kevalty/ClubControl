"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ReservarForm({
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
      <Select name="memberId">
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Selecciona un miembro" />
        </SelectTrigger>
        <SelectContent>
          {miembros.map((m) => (
            <SelectItem key={m.id} value={m.id}>
              {m.full_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button type="submit" disabled={pending}>
        {pending ? "Reservando..." : "Reservar cupo"}
      </Button>
    </form>
  );
}
