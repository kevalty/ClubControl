"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CopyInscripcionLink({ orgSlug }: { orgSlug: string }) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/${orgSlug}/inscripcion`;

  function copy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2 text-sm">
      <span className="text-muted-foreground">Link de inscripción:</span>
      <span className="font-mono text-xs truncate max-w-[240px] select-all">{url}</span>
      <Button size="sm" variant="outline" className="shrink-0 h-7 px-2" onClick={copy}>
        {copied ? "✓ Copiado" : "Copiar"}
      </Button>
    </div>
  );
}
