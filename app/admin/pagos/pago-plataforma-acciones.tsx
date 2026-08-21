"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  aprobarPagoPlataforma,
  rechazarPagoPlataforma,
  obtenerUrlComprobantePlataforma,
} from "@/app/admin/pagos/actions";

export function PagoPlataformaAcciones({
  paymentId,
  proofPath,
}: {
  paymentId: string;
  proofPath: string | null;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap justify-end gap-2">
      {proofPath ? (
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await obtenerUrlComprobantePlataforma(proofPath);
              if (result.error) toast.error(result.error);
              else window.open(result.url, "_blank", "noopener,noreferrer");
            })
          }
        >
          Ver comprobante
        </Button>
      ) : null}
      <Button
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await aprobarPagoPlataforma(paymentId);
            if (result?.error) toast.error(result.error);
            else toast.success("Pago aprobado.");
          })
        }
      >
        Aprobar
      </Button>
      <Button
        size="sm"
        variant="destructive"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await rechazarPagoPlataforma(paymentId);
            if (result?.error) toast.error(result.error);
            else toast.success("Pago rechazado.");
          })
        }
      >
        Rechazar
      </Button>
    </div>
  );
}
