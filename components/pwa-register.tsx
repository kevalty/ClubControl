"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // No es crítico si falla (ej. navegadores sin soporte); la app
        // sigue funcionando normal, solo sin instalación PWA.
      });
    }
  }, []);

  return null;
}
