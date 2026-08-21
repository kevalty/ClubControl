"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function PlantillaForm({
  action,
  defaultContent,
}: {
  action: (
    prevState: { error?: string; ok?: boolean } | undefined,
    formData: FormData
  ) => Promise<{ error?: string; ok?: boolean } | undefined>;
  defaultContent: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-3">
      {state?.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      <Textarea name="content" defaultValue={defaultContent} rows={3} />
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Guardando..." : "Guardar"}
        </Button>
        {state?.ok ? (
          <span className="text-xs text-muted-foreground">Guardado.</span>
        ) : null}
      </div>
    </form>
  );
}
