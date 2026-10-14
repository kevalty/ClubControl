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
  BarChart2,
  Home,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/app/auth/actions";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
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
        { href: `/${orgSlug}/dashboard/metricas`, label: "Dashboard", icon: LayoutDashboard },
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
        { href: `/${orgSlug}/dashboard/reportes`, label: "Reportes", icon: BarChart2 },
      ],
    },
    {
      label: "Operaciones",
      items: [
        { href: `/${orgSlug}/dashboard/asistencia`, label: "Asistencia", icon: QrCode },
        { href: `/${orgSlug}/dashboard/clases`, label: "Clases", icon: CalendarDays },
        { href: `/${orgSlug}/dashboard/planes`, label: "Planes", icon: CreditCard },
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
        { href: `/${orgSlug}/dashboard/configuracion/familias`, label: "Grupos familiares", icon: Users },
        { href: `/${orgSlug}/dashboard/facturacion`, label: "Facturación", icon: CreditCard },
      ],
    },
  ];
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

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive =
    item.href.includes("/metricas")
      ? pathname === item.href
      : pathname.startsWith(item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
        isActive
          ? "bg-gradient-to-r from-[rgba(99,102,241,0.2)] to-[rgba(99,102,241,0.04)] text-white"
          : "text-[#6b7280] hover:bg-white/[0.04] hover:text-[#c4c4d4]"
      )}
    >
      {/* Active left indicator */}
      {isActive && (
        <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[#6366f1]" />
      )}
      <Icon
        className={cn(
          "size-[18px] shrink-0 transition-colors",
          isActive ? "text-[#818cf8]" : "text-[#4b5563] group-hover:text-[#818cf8]"
        )}
      />
      <span className="truncate">{item.label}</span>
      {item.badge ? (
        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[#6366f1] px-1.5 text-[10px] font-bold text-white shadow-sm shadow-indigo-500/30">
          {item.badge}
        </span>
      ) : null}
    </Link>
  );
}

function SidebarBody({
  orgSlug,
  orgName,
  orgLogoUrl,
  primaryColor,
  groups,
  pathname,
  onClose,
}: {
  orgSlug: string;
  orgName: string;
  orgLogoUrl: string | null;
  primaryColor: string;
  groups: NavGroup[];
  pathname: string;
  onClose: () => void;
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4">
        <Link
          href={`/${orgSlug}/dashboard`}
          onClick={onClose}
          className="flex items-center gap-3 min-w-0"
        >
          {orgLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={orgLogoUrl}
              alt={orgName}
              className="h-9 w-9 shrink-0 rounded-xl object-contain ring-1 ring-white/10"
            />
          ) : (
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-lg"
              style={{
                backgroundColor: primaryColor,
                boxShadow: `0 4px 14px ${primaryColor}40`,
              }}
            >
              {orgName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white leading-tight">{orgName}</p>
            <p className="text-[10px] text-[#4b5563] font-medium">GestorClub</p>
          </div>
        </Link>
        <button
          onClick={onClose}
          className="ml-2 shrink-0 rounded-lg p-1.5 text-[#4b5563] hover:bg-white/[0.05] hover:text-white transition-colors"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-[#1e1e3a] to-transparent" />

      {/* Home button */}
      <div className="px-3 pt-3 pb-1">
        <Link
          href={`/${orgSlug}/dashboard`}
          onClick={onClose}
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all",
            pathname === `/${orgSlug}/dashboard`
              ? "bg-gradient-to-r from-[rgba(99,102,241,0.25)] to-[rgba(99,102,241,0.05)] text-white"
              : "text-[#6b7280] hover:bg-white/[0.04] hover:text-[#c4c4d4]"
          )}
        >
          <Home className="size-[18px] shrink-0 text-[#818cf8]" />
          Inicio
        </Link>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto px-3 pb-3 scrollbar-none">
        {groups.map((group) => (
          <div key={group.label} className="mt-4">
            <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#2d2d4a]">
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

      {/* Footer */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-[#1e1e3a] to-transparent" />
      <div className="px-3 py-3">
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#4b5563] transition-all hover:bg-[rgba(239,68,68,0.08)] hover:text-[#f87171]"
          >
            <LogOut className="size-[18px] shrink-0" />
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );
}

export function DashboardSidebar({
  orgSlug,
  orgName,
  orgLogoUrl = null,
  primaryColor = "#6366f1",
  pendingPayments = 0,
  pendingInscripciones = 0,
  userRole = "staff",
  desktopOpen = false,
  onDesktopClose,
}: {
  orgSlug: string;
  orgName: string;
  orgLogoUrl?: string | null;
  primaryColor?: string;
  pendingPayments?: number;
  pendingInscripciones?: number;
  userRole?: string;
  desktopOpen?: boolean;
  onDesktopClose?: () => void;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const groups =
    userRole === "trainer"
      ? buildTrainerGroups(orgSlug)
      : buildGroups(orgSlug, pendingPayments, pendingInscripciones);

  const overlayClasses =
    "fixed inset-0 z-50 flex";

  return (
    <>
      {/* Desktop overlay */}
      {desktopOpen && (
        <div className={cn(overlayClasses, "hidden md:flex")}>
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onDesktopClose}
          />
          <aside className="relative z-10 flex h-full w-[260px] flex-col border-r border-[#1a1a2e]/80 bg-[#09090f]"
            style={{ background: "linear-gradient(180deg, #0d0d1e 0%, #09090f 100%)" }}
          >
            <SidebarBody
              orgSlug={orgSlug}
              orgName={orgName}
              orgLogoUrl={orgLogoUrl}
              primaryColor={primaryColor}
              groups={groups}
              pathname={pathname}
              onClose={onDesktopClose ?? (() => {})}
            />
          </aside>
        </div>
      )}

      {/* Mobile topbar */}
      <div className="flex items-center justify-between border-b border-[#1a1a2e] bg-[#09090f] px-4 py-3 md:hidden">
        <div className="flex items-center gap-2.5">
          {orgLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={orgLogoUrl} alt={orgName} className="h-7 w-7 rounded-lg object-contain" />
          ) : (
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
              style={{ backgroundColor: primaryColor }}
            >
              {orgName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-sm font-bold text-white">{orgName}</span>
        </div>
        <div className="flex items-center gap-1">
          <Link
            href={`/${orgSlug}/dashboard`}
            className="rounded-lg p-1.5 text-[#6b7280] hover:bg-[#1a1a2e] hover:text-white"
            aria-label="Inicio"
          >
            <Home className="size-5" />
          </Link>
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú"
            className="rounded-lg p-1.5 text-[#6b7280] hover:bg-[#1a1a2e] hover:text-white"
          >
            <Menu className="size-5" />
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className={cn(overlayClasses, "md:hidden")}>
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside
            className="relative z-10 flex h-full w-[260px] flex-col border-r border-[#1a1a2e]/80"
            style={{ background: "linear-gradient(180deg, #0d0d1e 0%, #09090f 100%)" }}
          >
            <SidebarBody
              orgSlug={orgSlug}
              orgName={orgName}
              orgLogoUrl={orgLogoUrl}
              primaryColor={primaryColor}
              groups={groups}
              pathname={pathname}
              onClose={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}
    </>
  );
}
