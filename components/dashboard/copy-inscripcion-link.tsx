"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CopyInscripcionLink({ orgSlug }: { orgSlug: string }) {
  const [origin, setOrigin] = useState("");
  const [copiedGeneral, setCopiedGeneral] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [personalLink, setPersonalLink] = useState("");
  const [copiedPersonal, setCopiedPersonal] = useState(false);

  useEffect(() => { setOrigin(window.location.origin); }, []);

  const generalUrl = origin ? `${origin}/${orgSlug}/inscripcion` : "";

  function copyGeneral() {
    navigator.clipboard.writeText(generalUrl).then(() => {
      setCopiedGeneral(true);
      setTimeout(() => setCopiedGeneral(false), 2000);
    });
  }

  function generatePersonal() {
    if (!studentName.trim() || !origin) return;
    const ref = crypto.randomUUID().slice(0, 8);
    const url = `${origin}/${orgSlug}/inscripcion?para=${encodeURIComponent(studentName.trim())}&ref=${ref}`;
    setPersonalLink(url);
  }

  function copyPersonal() {
    navigator.clipboard.writeText(personalLink).then(() => {
      setCopiedPersonal(true);
      setTimeout(() => setCopiedPersonal(false), 2000);
    });
  }

  return (
    <div className="space-y-2 rounded-lg border bg-muted/50 p-3 text-sm">
      {/* Link general */}
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground shrink-0">Link general:</span>
        <span className="font-mono text-xs truncate flex-1 select-all">{generalUrl}</span>
        <Button size="sm" variant="outline" className="shrink-0 h-7 px-2" onClick={copyGeneral}>
          {copiedGeneral ? "✓ Copiado" : "Copiar"}
        </Button>
      </div>

      {/* Invitación personalizada */}
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground shrink-0">Invitar a:</span>
        <Input
          value={studentName}
          onChange={(e) => { setStudentName(e.target.value); setPersonalLink(""); }}
          onKeyDown={(e) => e.key === "Enter" && generatePersonal()}
          placeholder="Nombre del estudiante"
          className="h-8 text-sm flex-1"
        />
        <Button size="sm" variant="outline" className="shrink-0 h-7 px-2" onClick={generatePersonal}>
          Generar
        </Button>
      </div>

      {personalLink ? (
        <div className="flex items-center gap-2 rounded border bg-background px-2 py-1.5">
          <span className="font-mono text-xs truncate flex-1 select-all text-primary">{personalLink}</span>
          <Button size="sm" className="shrink-0 h-7 px-3" onClick={copyPersonal}>
            {copiedPersonal ? "✓ Copiado" : "Copiar para WhatsApp"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
