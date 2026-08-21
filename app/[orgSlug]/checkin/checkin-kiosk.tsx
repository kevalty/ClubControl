"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Resultado = { ok: boolean; message: string; memberName?: string } | null;

// Modo kiosco (CLAUDE.md §8.7): pensado para una tablet en la entrada.
// Escanea el QR del miembro con la cámara y llama al endpoint público
// /api/checkin/[orgSlug] (sin sesión — el propio QR es la credencial).
export function CheckinKiosk({ orgSlug, orgName }: { orgSlug: string; orgName: string }) {
  const [resultado, setResultado] = useState<Resultado>(null);
  const [scannerListo, setScannerListo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const procesandoRef = useRef(false);
  const scannerRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);

  useEffect(() => {
    let cancelado = false;

    import("html5-qrcode").then(({ Html5Qrcode }) => {
      if (cancelado) return;
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      scanner
        .start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 250 },
          (decodedText) => handleScan(decodedText),
          () => {
            /* frames sin QR detectado: ignorar, es el caso normal */
          }
        )
        .then(() => setScannerListo(true))
        .catch(() => setError("No se pudo acceder a la cámara. Revisa los permisos del navegador."));
    });

    return () => {
      cancelado = true;
      scannerRef.current
        ?.stop()
        .then(() => scannerRef.current?.clear())
        .catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function beep(exito: boolean) {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = exito ? 880 : 220;
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
      osc.onended = () => ctx.close();
    } catch {
      // Web Audio no disponible: silencioso, no es crítico.
    }
  }

  async function handleScan(qrCode: string) {
    if (procesandoRef.current) return;
    procesandoRef.current = true;

    try {
      const response = await fetch(`/api/checkin/${orgSlug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrCode }),
      });
      const data = await response.json();
      setResultado(data);
      beep(!!data.ok);
    } catch {
      setResultado({ ok: false, message: "Error de conexión. Intenta de nuevo." });
      beep(false);
    }

    setTimeout(() => {
      setResultado(null);
      procesandoRef.current = false;
    }, 3000);
  }

  return (
    <main className="flex min-h-screen flex-1 flex-col items-center justify-center gap-6 bg-background p-6 text-center">
      <h1 className="text-xl font-semibold text-muted-foreground">{orgName}</h1>

      {resultado ? (
        <div
          className={cn(
            "flex h-80 w-full max-w-md flex-col items-center justify-center gap-4 rounded-2xl p-8 text-white",
            resultado.ok ? "bg-green-600" : "bg-red-600"
          )}
        >
          <span className="text-6xl">{resultado.ok ? "✓" : "✗"}</span>
          <p className="text-2xl font-bold">
            {resultado.ok ? `¡Bienvenido/a, ${resultado.memberName}!` : resultado.message}
          </p>
        </div>
      ) : (
        <div className="w-full max-w-md">
          <div id="qr-reader" className="overflow-hidden rounded-2xl" />
          {!scannerListo && !error ? (
            <p className="mt-4 text-muted-foreground">Iniciando cámara...</p>
          ) : null}
          {error ? <p className="mt-4 text-destructive">{error}</p> : null}
          <p className="mt-4 text-muted-foreground">
            Acerca tu código QR a la cámara para registrar tu ingreso.
          </p>
        </div>
      )}
    </main>
  );
}
