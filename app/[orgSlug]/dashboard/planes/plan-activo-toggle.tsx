"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { alternarActivoPlan } from "@/app/[orgSlug]/dashboard/planes/actions";
import { toast } from "sonner";

export function PlanActivoToggle({
  orgSlug,
  planId,
  activo,
}: {
  orgSlug: string;
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
          const result = await alternarActivoPlan(orgSlug, planId, !activo);
          if (result?.error) {
            toast.error(result.error);
          }
        })
      }
    >
      {activo ? "Desactivar" : "Activar"}
    </Button>
  );
}
