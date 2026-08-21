"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { marcarAsistenciaClase } from "@/app/[orgSlug]/dashboard/clases/sesiones/[sessionId]/actions";

export function BookingActions({
  orgSlug,
  sessionId,
  bookingId,
}: {
  orgSlug: string;
  sessionId: string;
  bookingId: string;
}) {
  const [pending, startTransition] = useTransition();

  const marcar = (status: "attended" | "no_show" | "cancelled") => {
    startTransition(async () => {
      const result = await marcarAsistenciaClase(orgSlug, sessionId, bookingId, status);
      if (result?.error) toast.error(result.error);
    });
  };

  return (
    <div className="flex gap-2">
      <Button size="sm" disabled={pending} onClick={() => marcar("attended")}>
        Asistió
      </Button>
      <Button size="sm" variant="outline" disabled={pending} onClick={() => marcar("no_show")}>
        No asistió
      </Button>
      <Button size="sm" variant="ghost" disabled={pending} onClick={() => marcar("cancelled")}>
        Cancelar reserva
      </Button>
    </div>
  );
}
