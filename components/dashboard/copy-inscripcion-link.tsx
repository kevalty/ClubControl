"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CopyInscripcionLink({ orgSlug }: { orgSlug: string }) {
  const [origin, setOrigin] = useState("");
  const [copiedGeneral, setCopiedGeneral] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [repPhone, setRepPhone] = useState("");
  const [personalLink, setPersonalLink] = useState("");
  const [copiedPersonal, setCopiedPersonal] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const generalUrl = origin ? `${origin}/${orgSlug}/inscripcion` : "";

  function copyGeneral() {
    navigator.clipboard.writeText(generalUrl).then(() => {
      setCopiedGeneral(true);
      setTimeout(() => setCopiedGeneral(false), 2000);
    });
  }

  function generatePersonal() {
    const name = studentName.trim();
    if (!name) return;
    const base = window.location.origin;
    const ref = crypto.randomUUID().slice(0, 8);
    const url = `${base}/${orgSlug}/inscripcion?para=${encodeURIComponent(name)}&ref=${ref}`;
    setPersonalLink(url);
    if (!origin) setOrigin(base);
  }

  function copyPersonal() {
    navigator.clipboard.writeText(personalLink).then(() => {
      setCopiedPersonal(true);
      setTimeout(() => setCopiedPersonal(false), 2000);
    });
  }

  function sendWhatsApp() {
    if (!personalLink) return;
    // Normalize Ecuadorian number: 09XXXXXXXX → 5939XXXXXXXX
    const raw = repPhone.trim().replace(/\s+/g, "");
    const normalized = raw.startsWith("0") ? "593" + raw.slice(1) : raw.replace(/^\+/, "");
    const name = studentName.trim();
    const message =
      `Hola! Te compartimos el formulario de inscripción` +
      (name ? ` para ${name}` : "") +
      `. Por favor completa los datos haciendo clic en el siguiente link:\n\n${personalLink}\n\nGracias 🙏`;
    window.open(`https://wa.me/${normalized}?text=${encodeURIComponent(message)}`, "_blank");
  }

  return (
    <div className="space-y-3 rounded-lg border bg-muted/50 p-3 text-sm">
      {/* Link general */}
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground shrink-0 text-xs">Link general:</span>
        <span className="font-mono text-xs truncate flex-1 select-all">{generalUrl}</span>
        <Button size="sm" variant="outline" className="shrink-0 h-7 px-2" onClick={copyGeneral}>
          {copiedGeneral ? "✓ Copiado" : "Copiar"}
        </Button>
      </div>

      {/* Invitación personalizada */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground shrink-0 text-xs">Estudiante:</span>
          <Input
            value={studentName}
            onChange={(e) => {
              setStudentName(e.target.value);
              setPersonalLink("");
            }}
            onKeyDown={(e) => e.key === "Enter" && generatePersonal()}
            placeholder="Nombre del estudiante"
            className="h-8 text-sm flex-1"
          />
          <Button size="sm" variant="outline" className="shrink-0 h-7 px-2" onClick={generatePersonal}>
            Generar link
          </Button>
        </div>

        {personalLink ? (
          <>
            {/* Link generado */}
            <div className="flex items-center gap-2 rounded border bg-background px-2 py-1.5">
              <span className="font-mono text-xs truncate flex-1 select-all text-primary">
                {personalLink}
              </span>
              <Button size="sm" variant="outline" className="shrink-0 h-7 px-2" onClick={copyPersonal}>
                {copiedPersonal ? "✓" : "Copiar"}
              </Button>
            </div>

            {/* Enviar por WhatsApp */}
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground shrink-0 text-xs">WhatsApp:</span>
              <Input
                value={repPhone}
                onChange={(e) => setRepPhone(e.target.value)}
                placeholder="Ej: 0987654321"
                className="h-8 text-sm flex-1"
                type="tel"
              />
              <Button
                size="sm"
                className="shrink-0 h-7 px-2 bg-[#25D366] hover:bg-[#1ebe57] text-white"
                onClick={sendWhatsApp}
                disabled={!repPhone.trim()}
                title="Abrir WhatsApp con el mensaje pre-cargado"
              >
                Enviar
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Se abrirá WhatsApp con el link y un mensaje listo para enviar.
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}
