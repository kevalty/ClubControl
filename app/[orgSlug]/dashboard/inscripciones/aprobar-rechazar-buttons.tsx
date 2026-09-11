"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { aprobarInscripcion, rechazarInscripcion } from "./actions";

export function AprobarRechazarButtons({
  orgSlug,
  memberId,
}: {
  orgSlug: string;
  memberId: string;
}) {
  const [pending, startTransition] = useTransition();

  const aprobar = () => {
    startTransition(async () => {
      const result = await aprobarInscripcion(orgSlug, memberId);
      if (result?.error) toast.error(result.error);
      else toast.success("Inscripción aprobada. El miembro está ahora activo.");
    });
  };

  const rechazar = () => {
    startTransition(async () => {
      const result = await rechazarInscripcion(orgSlug, memberId);
      if (result?.error) toast.error(result.error);
      else toast.info("Inscripción rechazada.");
    });
  };

  return (
    <>
      <Button size="sm" disabled={pending} onClick={aprobar}>
        Aprobar
      </Button>
      <Button
        size="sm"
        variant="destructive"
        disabled={pending}
        onClick={rechazar}
      >
        Rechazar
      </Button>
    </>
  );
}
