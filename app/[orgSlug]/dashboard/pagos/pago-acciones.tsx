"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { aprobarPago, rechazarPago, obtenerUrlComprobante } from "@/app/[orgSlug]/dashboard/pagos/actions";

export function PagoAcciones({
  orgSlug,
  paymentId,
  proofPath,
  soloVerComprobante = false,
}: {
  orgSlug: string;
  paymentId: string;
  proofPath: string | null;
  soloVerComprobante?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [motivo, setMotivo] = useState("");

  const aprobar = () => {
    startTransition(async () => {
      const result = await aprobarPago(orgSlug, paymentId);
      if (result?.error) toast.error(result.error);
      else toast.success("Pago aprobado. Membresía actualizada.");
    });
  };

  const rechazar = () => {
    startTransition(async () => {
      const result = await rechazarPago(orgSlug, paymentId, motivo);
      if (result?.error) toast.error(result.error);
      else toast.success("Pago rechazado.");
    });
  };

  const verComprobante = () => {
    if (!proofPath) return;
    startTransition(async () => {
      const result = await obtenerUrlComprobante(proofPath);
      if (result.error) toast.error(result.error);
      else window.open(result.url, "_blank", "noopener,noreferrer");
    });
  };

  if (soloVerComprobante) {
    return proofPath ? (
      <Button variant="outline" size="sm" disabled={pending} onClick={verComprobante}>
        Ver comprobante
      </Button>
    ) : null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {proofPath ? (
        <Button variant="outline" size="sm" disabled={pending} onClick={verComprobante}>
          Ver comprobante
        </Button>
      ) : null}
      <Button size="sm" disabled={pending} onClick={aprobar}>
        Aprobar
      </Button>
      <Dialog>
        <DialogTrigger
          render={
            <Button variant="destructive" size="sm" disabled={pending}>
              Rechazar
            </Button>
          }
        />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar comprobante</DialogTitle>
            <DialogDescription>
              Se notificará al miembro para que vuelva a subir el comprobante correcto.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo (opcional)</Label>
            <Textarea
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: el monto no coincide con el plan"
            />
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost">Cancelar</Button>} />
            <DialogClose
              render={
                <Button variant="destructive" onClick={rechazar} disabled={pending}>
                  Sí, rechazar
                </Button>
              }
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
