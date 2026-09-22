"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function NuevoEquipoForm({
  action,
  orgSlug,
}: {
  action: (
    prev: { error?: string; ok?: boolean } | undefined,
    fd: FormData
  ) => Promise<{ error?: string; ok?: boolean }>;
  orgSlug: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const router = useRouter();

  useEffect(() => {
    if (state?.ok) {
      router.push(`/${orgSlug}/dashboard/equipo`);
    }
  }, [state?.ok, orgSlug, router]);

  return (
    <form action={formAction} className="space-y-4 rounded-lg border p-4">
      {state?.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="name">
          Nombre del equipo <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          name="name"
          required
          placeholder="Ej: FENIX Sub-14"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sport">Deporte</Label>
          <Input
            id="sport"
            name="sport"
            placeholder="Ej: Baloncesto"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Categoría</Label>
          <Input
            id="category"
            name="category"
            placeholder="Ej: Sub-14"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tournament_name">Nombre del torneo</Label>
          <Input
            id="tournament_name"
            name="tournament_name"
            placeholder="Ej: Copa Riobamba 2026"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tournament_date">Fecha del torneo</Label>
          <Input
            id="tournament_date"
            name="tournament_date"
            type="date"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notas</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="Observaciones sobre el equipo o torneo"
          rows={3}
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={pending} className="flex-1">
          {pending ? "Creando..." : "Crear equipo"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/${orgSlug}/dashboard/equipo`)}
          disabled={pending}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
