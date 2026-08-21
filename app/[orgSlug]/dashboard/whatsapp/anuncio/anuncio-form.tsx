"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
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

export function AnuncioForm({
  action,
  planes,
}: {
  action: (
    prevState: { error?: string; resultado?: string } | undefined,
    formData: FormData
  ) => Promise<{ error?: string; resultado?: string } | undefined>;
  planes: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      {state?.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      {state?.resultado ? (
        <Alert>
          <AlertDescription>{state.resultado}</AlertDescription>
        </Alert>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="planId">Destinatarios</Label>
        <Select name="planId" defaultValue="todos">
          <SelectTrigger id="planId" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los miembros activos</SelectItem>
            {planes.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                Solo plan: {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="mensaje">Mensaje</Label>
        <Textarea id="mensaje" name="mensaje" rows={5} required />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Enviando..." : "Enviar anuncio"}
      </Button>
    </form>
  );
}
