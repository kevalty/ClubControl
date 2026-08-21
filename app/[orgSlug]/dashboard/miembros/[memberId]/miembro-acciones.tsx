"use client";

import { useTransition } from "react";
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
import {
  congelarMiembro,
  reactivarMiembro,
  generarAccesoPortal,
  eliminarMiembro,
} from "@/app/[orgSlug]/dashboard/miembros/actions";

export function MiembroAcciones({
  orgSlug,
  memberId,
  estado,
  tieneEmail,
  tieneAccesoPortal,
  puedeEliminar,
}: {
  orgSlug: string;
  memberId: string;
  estado: string;
  tieneEmail: boolean;
  tieneAccesoPortal: boolean;
  puedeEliminar: boolean;
}) {
  const [pending, startTransition] = useTransition();

  const congelarOReactivar = () => {
    startTransition(async () => {
      const result =
        estado === "frozen"
          ? await reactivarMiembro(orgSlug, memberId)
          : await congelarMiembro(orgSlug, memberId);
      if (result?.error) toast.error(result.error);
      else toast.success(estado === "frozen" ? "Membresía reactivada." : "Membresía congelada.");
    });
  };

  const generarAcceso = () => {
    startTransition(async () => {
      const result = await generarAccesoPortal(orgSlug, memberId);
      if (result?.error) toast.error(result.error);
      else toast.success(tieneAccesoPortal ? "Acceso reenviado." : "Invitación enviada.");
    });
  };

  const eliminar = () => {
    startTransition(async () => {
      const result = await eliminarMiembro(orgSlug, memberId);
      if (result?.error) toast.error(result.error);
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      {estado !== "expired" && estado !== "inactive" ? (
        <Button variant="outline" disabled={pending} onClick={congelarOReactivar}>
          {estado === "frozen" ? "Reactivar" : "Congelar membresía"}
        </Button>
      ) : null}
      <Button
        variant="outline"
        disabled={pending || !tieneEmail}
        onClick={generarAcceso}
        title={!tieneEmail ? "El miembro necesita un correo registrado" : undefined}
      >
        {tieneAccesoPortal ? "Reenviar acceso al portal" : "Generar acceso al portal"}
      </Button>
      {puedeEliminar ? (
        <Dialog>
          <DialogTrigger
            render={
              <Button variant="destructive" disabled={pending}>
                Eliminar
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Eliminar este miembro?</DialogTitle>
              <DialogDescription>
                Esta acción no se puede deshacer. Se borrará también su
                historial de membresías, pagos y asistencia asociados.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose render={<Button variant="ghost">Cancelar</Button>} />
              <Button variant="destructive" onClick={eliminar} disabled={pending}>
                Sí, eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}
