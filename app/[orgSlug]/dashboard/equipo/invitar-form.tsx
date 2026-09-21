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

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  staff: "Recepción / Staff",
  trainer: "Entrenador",
};

export function InvitarForm({
  action,
}: {
  action: (
    prev: { error?: string; ok?: boolean } | undefined,
    fd: FormData
  ) => Promise<{ error?: string; ok?: boolean } | undefined>;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      {state?.ok ? (
        <Alert>
          <AlertDescription>Invitación registrada correctamente.</AlertDescription>
        </Alert>
      ) : null}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1 space-y-2">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="persona@ejemplo.com"
            required
          />
        </div>
        <div className="w-full space-y-2 sm:w-52">
          <Label htmlFor="role">Rol</Label>
          <Select name="role" defaultValue="staff">
            <SelectTrigger id="role" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ROLE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button type="submit" disabled={pending} className="w-full sm:w-auto">
            {pending ? "Enviando..." : "Agregar al equipo"}
          </Button>
        </div>
      </div>
    </form>
  );
}
