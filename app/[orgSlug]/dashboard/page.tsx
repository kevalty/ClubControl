import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import {
  Users,
  CreditCard,
  Calendar,
  Tag,
  ClipboardCheck,
  BarChart2,
  UserCog,
  Settings,
  QrCode,
  Smartphone,
  LayoutDashboard,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default async function DashboardHomePage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .maybeSingle();

  if (!org) notFound();
  const orgId = org.id;

  const { data: authData } = await supabase.auth.getUser();
  const { data: myMembership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", orgId)
    .eq("user_id", authData.user?.id ?? "")
    .maybeSingle();

  const userRole = myMembership?.role ?? "staff";

  const pendingRes = userRole === "trainer"
    ? { count: 0 }
    : await supabase
        .from("payments")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", orgId)
        .eq("status", "pending_review");

  const pendingPayments = pendingRes.count ?? 0;

  const now = new Date();
  const roleLabel: Record<string, string> = {
    owner: "Administrador",
    admin: "Administrador",
    staff: "Recepcionista",
    trainer: "Entrenador",
  };
  const displayName =
    authData.user?.user_metadata?.full_name ??
    authData.user?.email?.split("@")[0] ??
    roleLabel[userRole] ??
    "Usuario";

  type Tile = {
    label: string;
    href: string;
    icon: LucideIcon;
    color: string;
    badge?: number;
    roles: string[];
  };
  type ComingSoonTile = { label: string; icon: LucideIcon; soon: true };

  const tiles: (Tile | ComingSoonTile)[] = [
    {
      label: "Dashboard",
      href: `/${orgSlug}/dashboard/metricas`,
      icon: LayoutDashboard,
      color: "indigo",
      roles: ["owner", "admin", "staff"],
    },
    {
      label: "Miembros",
      href: `/${orgSlug}/dashboard/miembros`,
      icon: Users,
      color: "violet",
      roles: ["owner", "admin", "staff"],
    },
    {
      label: "Pagos",
      href: `/${orgSlug}/dashboard/pagos`,
      icon: CreditCard,
      color: "emerald",
      badge: pendingPayments > 0 ? pendingPayments : undefined,
      roles: ["owner", "admin", "staff"],
    },
    {
      label: "Clases",
      href: `/${orgSlug}/dashboard/clases`,
      icon: Calendar,
      color: "sky",
      roles: ["owner", "admin", "staff", "trainer"],
    },
    {
      label: "Planes",
      href: `/${orgSlug}/dashboard/planes`,
      icon: Tag,
      color: "amber",
      roles: ["owner", "admin"],
    },
    {
      label: "Asistencia",
      href: `/${orgSlug}/dashboard/asistencia`,
      icon: ClipboardCheck,
      color: "teal",
      roles: ["owner", "admin", "staff", "trainer"],
    },
    {
      label: "Reportes",
      href: `/${orgSlug}/dashboard/reportes`,
      icon: BarChart2,
      color: "rose",
      roles: ["owner", "admin"],
    },
    {
      label: "Equipo",
      href: `/${orgSlug}/dashboard/staff`,
      icon: UserCog,
      color: "orange",
      roles: ["owner", "admin"],
    },
    {
      label: "Configuración",
      href: `/${orgSlug}/dashboard/configuracion`,
      icon: Settings,
      color: "slate",
      roles: ["owner", "admin"],
    },
    {
      label: "Acceso QR",
      href: `/${orgSlug}/checkin`,
      icon: QrCode,
      color: "cyan",
      roles: ["owner", "admin", "staff"],
    },
    { label: "Portal miembro", icon: Smartphone, soon: true },
  ];

  const tileColors: Record<string, { bg: string; icon: string }> = {
    indigo:  { bg: "bg-[rgba(99,102,241,0.12)]  group-hover:bg-[rgba(99,102,241,0.22)]",  icon: "text-[#818cf8]" },
    violet:  { bg: "bg-[rgba(139,92,246,0.12)]  group-hover:bg-[rgba(139,92,246,0.22)]",  icon: "text-[#a78bfa]" },
    emerald: { bg: "bg-[rgba(16,185,129,0.12)]  group-hover:bg-[rgba(16,185,129,0.22)]",  icon: "text-[#34d399]" },
    sky:     { bg: "bg-[rgba(14,165,233,0.12)]  group-hover:bg-[rgba(14,165,233,0.22)]",  icon: "text-[#38bdf8]" },
    amber:   { bg: "bg-[rgba(245,158,11,0.12)]  group-hover:bg-[rgba(245,158,11,0.22)]",  icon: "text-[#fbbf24]" },
    teal:    { bg: "bg-[rgba(20,184,166,0.12)]  group-hover:bg-[rgba(20,184,166,0.22)]",  icon: "text-[#2dd4bf]" },
    rose:    { bg: "bg-[rgba(244,63,94,0.12)]   group-hover:bg-[rgba(244,63,94,0.22)]",   icon: "text-[#fb7185]" },
    orange:  { bg: "bg-[rgba(249,115,22,0.12)]  group-hover:bg-[rgba(249,115,22,0.22)]",  icon: "text-[#fb923c]" },
    slate:   { bg: "bg-[rgba(100,116,139,0.12)] group-hover:bg-[rgba(100,116,139,0.22)]", icon: "text-[#94a3b8]" },
    cyan:    { bg: "bg-[rgba(6,182,212,0.12)]   group-hover:bg-[rgba(6,182,212,0.22)]",   icon: "text-[#22d3ee]" },
  };

  const visibleTiles = tiles.filter((t) =>
    "soon" in t ? true : t.roles.includes(userRole)
  );

  return (
    <div className="flex flex-col gap-8 py-2">
      {/* Greeting */}
      <div>
        <h1 className="text-3xl font-bold text-white capitalize">
          Hola, {displayName}
        </h1>
        <p className="mt-1 text-sm text-[#6b7280] capitalize">
          {now.toLocaleDateString("es-EC", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
            timeZone: "America/Guayaquil",
          })}
        </p>
      </div>

      {/* Module tiles */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {visibleTiles.map((tile) => {
          if ("soon" in tile) {
            const Icon = tile.icon;
            return (
              <div
                key={tile.label}
                className="relative flex flex-col items-center gap-4 rounded-3xl border border-[#1a1a2e] bg-[#0d0d1a] px-4 py-8 opacity-40 select-none"
              >
                <span className="absolute right-3 top-3 rounded-full bg-[#1a1a2e] px-2.5 py-1 text-[10px] font-bold text-[#6b7280]">
                  Pronto
                </span>
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[rgba(107,114,128,0.1)]">
                  <Icon className="size-8 text-[#4b5563]" />
                </div>
                <span className="text-sm font-semibold text-[#6b7280]">{tile.label}</span>
              </div>
            );
          }
          const colors = tileColors[tile.color] ?? tileColors.indigo;
          const Icon = tile.icon;
          return (
            <div key={tile.label} className="relative">
              <Link
                href={tile.href}
                className="group flex flex-col items-center gap-4 rounded-3xl border border-[#1a1a2e] bg-[#111120] px-4 py-8 transition-all hover:border-[#2a2a4e] hover:bg-[#14142a] hover:shadow-lg hover:shadow-black/20"
              >
                <div
                  className={cn(
                    "flex h-16 w-16 items-center justify-center rounded-2xl transition-colors",
                    colors.bg
                  )}
                >
                  <Icon className={cn("size-8", colors.icon)} />
                </div>
                <span className="text-sm font-semibold text-[#e5e7eb] group-hover:text-white">
                  {tile.label}
                </span>
              </Link>
              {tile.badge !== undefined && tile.badge > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ef4444] px-1 text-[10px] font-bold text-white shadow-md">
                  {tile.badge > 99 ? "99+" : tile.badge}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
