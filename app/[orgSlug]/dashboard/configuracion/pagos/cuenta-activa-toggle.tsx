"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { alternarActivaCuentaBancaria } from "@/app/[orgSlug]/dashboard/configuracion/pagos/actions";

export function CuentaActivaToggle({
  orgSlug,
  accountId,
  activa,
}: {
  orgSlug: string;
  accountId: string;
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
          const result = await alternarActivaCuentaBancaria(orgSlug, accountId, !activa);
          if (result?.error) toast.error(result.error);
        })
      }
    >
      {activa ? "Desactivar" : "Activar"}
    </Button>
  );
}
