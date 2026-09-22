"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  QrCode,
  CalendarDays,
  UserPlus,
  Landmark,
  MessageCircle,
  Settings,
  Menu,
  X,
  LogOut,
  Megaphone,
  ClipboardList,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/app/auth/actions";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
};

type NavGroup = { label: string; items: NavItem[] };

function buildGroups(
  orgSlug: string,
  pendingPayments: number,
  pendingInscripciones: number
): NavGroup[] {
  return [
    {
      label: "General",
      items: [
        { href: `/${orgSlug}/dashboard`, label: "Dashboard", icon: LayoutDashboard },
        { href: `/${orgSlug}/dashboard/miembros`, label: "Miembros", icon: Users },
        {
          href: `/${orgSlug}/dashboard/pagos`,
          label: "Pagos",
          icon: CreditCard,
          badge: pendingPayments > 0 ? pendingPayments : undefined,
        },
        {
          href: `/${orgSlug}/dashboard/inscripciones`,
          label: "Inscripciones",
          icon: ClipboardList,
          badge: pendingInscripciones > 0 ? pendingInscripciones : undefined,
        },
      ],
    },
    {
      label: "Operaciones",
      items: [
        { href: `/${orgSlug}/dashboard/asistencia`, label: "Asistencia", icon: QrCode },
        { href: `/${orgSlug}/dashboard/clases`, label: "Clases", icon: CalendarDays },
        { href: `/${orgSlug}/dashboard/equipo`, label: "Equipos de torneo", icon: Trophy },
        { href: `/${orgSlug}/dashboard/staff`, label: "Staff / Equipo", icon: UserPlus },
      ],
    },
    {
      label: "Configuración",
      items: [
        { href: `/${orgSlug}/dashboard/configuracion/pagos`, label: "Cuentas bancarias", icon: Landmark },
        { href: `/${orgSlug}/dashboard/configuracion/whatsapp`, label: "WhatsApp", icon: MessageCircle },
        { href: `/${orgSlug}/dashboard/whatsapp/anuncio`, label: "Enviar anuncio", icon: Megaphone },
        { href: `/${orgSlug}/dashboard/configuracion/suscripcion`, label: "Suscripción", icon: Settings },
        { href: `/${orgSlug}/dashboard/configuracion/sedes`, label: "Sedes", icon: Landmark },
        { href: `/${orgSlug}/dashboard/configuracion/rubros`, label: "Rubros", icon: Landmark },
        { href: `/${orgSlug}/dashboard/facturacion`, label: "Facturación", icon: CreditCard },
      ],
    },
  ];
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive =
    item.href.endsWith("/dashboard")
      ? pathname === item.href
      : pathname.startsWith(item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-[rgba(99,102,241,0.15)] text-[#818cf8]"
          : "text-[#6b7280] hover:bg-[rgba(99,102,241,0.08)] hover:text-[#a5b4fc]"
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="truncate">{item.label}</span>
      {item.badge ? (
        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[#6366f1] px-1.5 text-[10px] font-bold text-white">
          {item.badge}
        </span>
      ) : null}
    </Link>
  );
}

function buildTrainerGroups(orgSlug: string): NavGroup[] {
  return [
    {
      label: "Mi trabajo",
      items: [
        { href: `/${orgSlug}/dashboard/clases`, label: "Mis clases", icon: CalendarDays },
        { href: `/${orgSlug}/dashboard/asistencia`, label: "Asistencia", icon: QrCode },
      ],
    },
    {
      label: "Consulta",
      items: [
        { href: `/${orgSlug}/dashboard/miembros`, label: "Miembros", icon: Users },
        { href: `/${orgSlug}/dashboard/equipo`, label: "Equipos de torneo", icon: Trophy },
        { href: `/${orgSlug}/dashboard/staff`, label: "Staff / Equipo", icon: UserPlus },
      ],
    },
  ];
}

export function DashboardSidebar({
  orgSlug,
  orgName,
  pendingPayments = 0,
  pendingInscripciones = 0,
  userRole = "staff",
}: {
  orgSlug: string;
  orgName: string;
  pendingPayments?: number;
  pendingInscripciones?: number;
  userRole?: string;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const groups =
    userRole === "trainer"
      ? buildTrainerGroups(orgSlug)
      : buildGroups(orgSlug, pendingPayments, pendingInscripciones);

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#6366f1] to-[#8b5cf6]">
          <svg className="size-4 fill-white" viewBox="0 0 24 24">
            <path d="M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span className="text-sm font-bold tracking-wide text-white truncate">{orgName}</span>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {groups.map((group) => (
          <div key={group.label} className="mb-4">
            <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-widest text-[#3d3d5c]">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink key={item.href} item={item} pathname={pathname} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="border-t border-[#1a1a2e] px-3 py-3">
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#6b7280] transition-colors hover:bg-[rgba(239,68,68,0.08)] hover:text-[#f87171]"
          >
            <LogOut className="size-4 shrink-0" />
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-[220px] shrink-0 border-r border-[#1a1a2e] bg-[#0d0d1a] md:flex md:flex-col">
        {sidebarContent}
      </aside>

      {/* Mobile topbar + drawer */}
      <div className="flex items-center justify-between border-b border-[#1a1a2e] bg-[#0d0d1a] px-4 py-3 md:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-[#6366f1] to-[#8b5cf6]">
            <svg className="size-3.5 fill-white" viewBox="0 0 24 24">
              <path d="M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-sm font-bold text-white">{orgName}</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menú"
          className="rounded-lg p-1.5 text-[#6b7280] hover:bg-[#1a1a2e] hover:text-white"
        >
          <Menu className="size-5" />
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-[240px] border-r border-[#1a1a2e] bg-[#0d0d1a]">
            <div className="flex items-center justify-between px-4 py-4">
              <span className="text-sm font-bold text-white">{orgName}</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-1 text-[#6b7280] hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="h-[calc(100%-60px)]">{sidebarContent}</div>
          </aside>
        </div>
      )}
    </>
  );
}
