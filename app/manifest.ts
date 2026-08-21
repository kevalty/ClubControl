import type { MetadataRoute } from "next";

// CLAUDE.md §10: manifest.json con ícono, nombre y color de tema, para que
// la PWA sea instalable. Los iconos son un placeholder sólido (#0EA5E9,
// el primary_color por defecto de organizations) — reemplazar por el logo
// real de marca cuando el cliente lo tenga (mismo placeholder "GestorClub"
// del resto del proyecto, ver CLAUDE.md §0.2).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GestorClub",
    short_name: "GestorClub",
    description:
      "Gestión de miembros, pagos y asistencia para clubes deportivos en Ecuador.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0EA5E9",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
