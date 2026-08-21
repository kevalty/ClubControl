"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { reservarCupoPropio, cancelarReservaPropia } from "@/app/[orgSlug]/portal/clases/actions";

export function ReservaBoton({
  orgSlug,
  memberId,
  sessionId,
  bookingId,
  lleno,
}: {
  orgSlug: string;
  memberId: string;
  sessionId: string;
  bookingId: string | null;
  lleno: boolean;
}) {
  const [pending, startTransition] = useTransition();

  if (bookingId) {
    return (
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await cancelarReservaPropia(orgSlug, bookingId);
            if (result?.error) toast.error(result.error);
          })
        }
      >
        Cancelar reserva
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      disabled={pending || lleno}
      onClick={() =>
        startTransition(async () => {
          const result = await reservarCupoPropio(orgSlug, memberId, sessionId);
          if (result?.error) toast.error(result.error);
        })
      }
    >
      {lleno ? "Sin cupo" : "Reservar"}
    </Button>
  );
}
