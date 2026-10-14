"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { NotificationBell } from "@/components/dashboard/notification-bell";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyNotification = any;

export function DashboardShell({
  children,
  orgSlug,
  orgName,
  orgLogoUrl,
  primaryColor,
  pendingPayments,
  pendingInscripciones,
  userRole,
  initialNotifications,
}: {
  children: React.ReactNode;
  orgSlug: string;
  orgName: string;
  orgLogoUrl: string | null;
  primaryColor: string;
  pendingPayments: number;
  pendingInscripciones: number;
  userRole: string;
  initialNotifications: AnyNotification[];
}) {
  const [desktopOpen, setDesktopOpen] = useState(false);

  return (
    <div className="flex h-full min-h-screen flex-col bg-[#08080f] md:flex-row">
      <DashboardSidebar
        orgSlug={orgSlug}
        orgName={orgName}
        orgLogoUrl={orgLogoUrl}
        primaryColor={primaryColor}
        pendingPayments={pendingPayments}
        pendingInscripciones={pendingInscripciones}
        userRole={userRole}
        desktopOpen={desktopOpen}
        onDesktopClose={() => setDesktopOpen(false)}
      />

      <div className="flex flex-1 flex-col min-h-0">
        {/* Desktop topbar */}
        <div className="hidden md:flex items-center justify-between border-b border-[#1a1a2e] bg-[#08080f] px-4 py-2 print:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDesktopOpen((v) => !v)}
              aria-label="Abrir menú"
              className="rounded-lg p-1.5 text-[#6b7280] hover:bg-[#1a1a2e] hover:text-white transition-colors"
            >
              <Menu className="size-5" />
            </button>
            {orgLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={orgLogoUrl}
                alt={orgName}
                className="h-7 w-7 rounded-md object-contain"
              />
            ) : (
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white"
                style={{ backgroundColor: primaryColor }}
              >
                {orgName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-sm font-semibold text-white">{orgName}</span>
          </div>
          <NotificationBell initialNotifications={initialNotifications} />
        </div>

        <main id="main-content" className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
