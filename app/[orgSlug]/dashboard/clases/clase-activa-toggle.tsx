"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { alternarActivaClase } from "@/app/[orgSlug]/dashboard/clases/actions";

export function ClaseActivaToggle({
  orgSlug,
  classId,
  activa,
}: {
  orgSlug: string;
  classId: string;
  activa: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await alternarActivaClase(orgSlug, classId, !activa);
          if (result?.error) toast.error(result.error);
        })
      }
    >
      {activa ? "Desactivar" : "Activar"}
    </Button>
  );
}
