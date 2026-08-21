"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { alternarSuspensionClub } from "@/app/admin/clubes/actions";

export function SuspensionToggle({
  orgId,
  suspendido,
}: {
  orgId: string;
  suspendido: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant={suspendido ? "default" : "destructive"}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await alternarSuspensionClub(orgId, !suspendido);
          if (result?.error) toast.error(result.error);
        })
      }
    >
      {suspendido ? "Reactivar" : "Suspender"}
    </Button>
  );
}
