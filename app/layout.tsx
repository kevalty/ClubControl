import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GestorClub — Gestión de clubes deportivos",
  description:
    "Software de gestión para clubes deportivos, academias y gimnasios en Ecuador: miembros, pagos, recordatorios por WhatsApp y control de acceso.",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "GestorClub" },
};

export const viewport: Viewport = {
  themeColor: "#0EA5E9",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster />
        <PwaRegister />
      </body>
    </html>
  );
}
