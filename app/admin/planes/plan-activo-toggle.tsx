"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { alternarActivoPlanPlataforma } from "@/app/admin/planes/actions";

export function PlanActivoTogglePlataforma({
  planId,
  activo,
}: {
  planId: string;
  activo: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await alternarActivoPlanPlataforma(planId, !activo);
          if (result?.error) toast.error(result.error);
        })
      }
    >
      {activo ? "Desactivar" : "Activar"}
    </Button>
  );
}
