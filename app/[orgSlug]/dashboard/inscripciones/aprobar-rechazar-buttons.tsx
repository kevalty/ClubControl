"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { rechazarInscripcion } from "./actions";
import { AprobarModal } from "./aprobar-modal";

type FeeType = { id: string; name: string };
type Location = { id: string; name: string };
type Clase = { id: string; name: string };

export function AprobarRechazarButtons({
  orgSlug,
  memberId,
  feeTypes,
  locations,
  clases,
}: {
  orgSlug: string;
  memberId: string;
  feeTypes: FeeType[];
  locations: Location[];
  clases: Clase[];
}) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [pending, startTransition] = useTransition();

  const rechazar = () => {
    startTransition(async () => {
      const result = await rechazarInscripcion(orgSlug, memberId);
      if (result?.error) toast.error(result.error);
      else {
        toast.info("Inscripción rechazada.");
        router.refresh();
      }
    });
  };

  if (showModal) {
    return (
      <div className="w-full rounded-lg border border-[#1a1a2e] bg-[#0d0d1a] p-4">
        <p className="mb-3 text-sm font-medium">Completar antes de aprobar</p>
        <AprobarModal
          orgSlug={orgSlug}
          memberId={memberId}
          feeTypes={feeTypes}
          locations={locations}
          clases={clases}
          onDone={(ok) => {
            setShowModal(false);
            if (ok) {
              toast.success(
                "Inscripción aprobada. El miembro está ahora activo."
              );
              router.refresh();
            }
          }}
        />
      </div>
    );
  }

  return (
    <>
      <Button size="sm" disabled={pending} onClick={() => setShowModal(true)}>
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
