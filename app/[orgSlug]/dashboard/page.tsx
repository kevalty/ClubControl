import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import {
  TrendingUp,
  TrendingDown,
  Users,
  CreditCard,
  Clock,
  ArrowRight,
  Calendar,
  Tag,
  ClipboardCheck,
  BarChart2,
  UserCog,
  Settings,
  QrCode,
  Smartphone,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

function toDateStr(d: Date) {
  return d.toLocaleDateString("en-CA", { timeZone: "America/Guayaquil" });
}

export default async function DashboardHomePage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name")
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
  const isTrainer = myMembership?.role === "trainer";

  // Rangos de fecha
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const startOfMonth = new Date(y, m, 1).toISOString();
  const startOfNextMonth = new Date(y, m + 1, 1).toISOString();
  const startOfLastMonth = new Date(y, m - 1, 1).toISOString();
  const today = toDateStr(now);
  const in7days = toDateStr(new Date(y, m, now.getDate() + 7));

  const [
    activeMembersRes,
    revenueRes,
    lastMonthRevenueRes,
    pendingRes,
    expiringRes,
    recentMembersRes,
  ] = await Promise.all([
    supabase
      .from("members")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("status", "active"),

    isTrainer
      ? Promise.resolve({ data: [] })
      : supabase
          .from("payments")
          .select("amount")
          .eq("organization_id", orgId)
          .eq("status", "approved")
          .gte("paid_at", startOfMonth)
          .lt("paid_at", startOfNextMonth),

    isTrainer
      ? Promise.resolve({ data: [] })
      : supabase
          .from("payments")
          .select("amount")
          .eq("organization_id", orgId)
          .eq("status", "approved")
          .gte("paid_at", startOfLastMonth)
          .lt("paid_at", startOfMonth),

    isTrainer
      ? Promise.resolve({ count: 0, data: null })
      : supabase
          .from("payments")
          .select("*", { count: "exact", head: true })
          .eq("organization_id", orgId)
          .eq("status", "pending_review"),

    supabase
      .from("memberships")
      .select("id, end_date, member_id, membership_plans(name), members(full_name)")
      .eq("organization_id", orgId)
      .eq("status", "active")
      .gte("end_date", today)
      .lte("end_date", in7days)
      .order("end_date")
      .limit(6),

    supabase
      .from("members")
      .select("id, full_name, phone, status")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  // Fetch first active class enrollment for each recent member
  const recentMemberIds = (recentMembersRes.data ?? []).map((m) => m.id);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: enrollmentRows } = recentMemberIds.length > 0
    ? await (supabase as any)
        .from("class_enrollments")
        .select("member_id, classes(name)")
        .in("member_id", recentMemberIds)
        .eq("status", "active")
    : { data: [] };

  // Map member_id -> first class name
  const memberClassMap: Record<string, string> = {};
  for (const row of (enrollmentRows ?? []) as Array<{ member_id: string; classes: { name: string } | null }>) {
    if (row.classes && !memberClassMap[row.member_id]) {
      memberClassMap[row.member_id] = row.classes.name;
    }
  }

  const activeMembers = activeMembersRes.count ?? 0;
  const pendingPayments = pendingRes.count ?? 0;

  const revenue = (revenueRes.data ?? []).reduce(
    (s, p) => s + Number(p.amount),
    0
  );
  const lastRevenue = (lastMonthRevenueRes.data ?? []).reduce(
    (s, p) => s + Number(p.amount),
    0
  );
  const revenueDelta =
    lastRevenue > 0 ? Math.round(((revenue - lastRevenue) / lastRevenue) * 100) : null;

  const expiringList = (expiringRes.data ?? []) as Array<{
    id: string;
    end_date: string;
    member_id: string;
    membership_plans: { name: string } | null;
    members: { full_name: string } | null;
  }>;

  const recentMembers = recentMembersRes.data ?? [];

  const monthName = now.toLocaleString("es-EC", { month: "long", timeZone: "America/Guayaquil" });

  const userRole = myMembership?.role ?? "staff";
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
      label: "Miembros",
      href: `/${orgSlug}/dashboard/miembros`,
      icon: Users,
      color: "indigo",
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
      color: "violet",
      roles: ["owner", "admin", "staff", "trainer"],
    },
    {
      label: "Planes",
      href: `/${orgSlug}/dashboard/planes`,
      icon: Tag,
      color: "sky",
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
      color: "amber",
      roles: ["owner", "admin"],
    },
    {
      label: "Equipo",
      href: `/${orgSlug}/dashboard/staff`,
      icon: UserCog,
      color: "rose",
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
    indigo: { bg: "bg-[rgba(99,102,241,0.12)] group-hover:bg-[rgba(99,102,241,0.2)]",  icon: "text-[#818cf8]" },
    emerald:{ bg: "bg-[rgba(16,185,129,0.12)] group-hover:bg-[rgba(16,185,129,0.2)]",  icon: "text-[#34d399]" },
    violet: { bg: "bg-[rgba(139,92,246,0.12)] group-hover:bg-[rgba(139,92,246,0.2)]",  icon: "text-[#a78bfa]" },
    sky:    { bg: "bg-[rgba(14,165,233,0.12)] group-hover:bg-[rgba(14,165,233,0.2)]",  icon: "text-[#38bdf8]" },
    teal:   { bg: "bg-[rgba(20,184,166,0.12)] group-hover:bg-[rgba(20,184,166,0.2)]",  icon: "text-[#2dd4bf]" },
    amber:  { bg: "bg-[rgba(245,158,11,0.12)] group-hover:bg-[rgba(245,158,11,0.2)]",  icon: "text-[#fbbf24]" },
    rose:   { bg: "bg-[rgba(244,63,94,0.12)]  group-hover:bg-[rgba(244,63,94,0.2)]",   icon: "text-[#fb7185]" },
    slate:  { bg: "bg-[rgba(100,116,139,0.12)] group-hover:bg-[rgba(100,116,139,0.2)]",icon: "text-[#94a3b8]" },
    cyan:   { bg: "bg-[rgba(6,182,212,0.12)]  group-hover:bg-[rgba(6,182,212,0.2)]",   icon: "text-[#22d3ee]" },
  };

  const visibleTiles = tiles.filter((t) =>
    "soon" in t ? true : t.roles.includes(userRole)
  );

  function daysUntil(dateStr: string) {
    const diff =
      new Date(dateStr).getTime() - new Date(today).getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-white capitalize">
          Hola, {displayName}
        </h1>
        <p className="mt-0.5 text-sm text-[#6b7280] capitalize">
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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {visibleTiles.map((tile) => {
          if ("soon" in tile) {
            const Icon = tile.icon;
            return (
              <div
                key={tile.label}
                className="relative flex flex-col items-center gap-3 rounded-2xl border border-[#1a1a2e] bg-[#0d0d1a] p-5 opacity-50 select-none"
              >
                <span className="absolute right-2.5 top-2.5 rounded-full bg-[#1a1a2e] px-2 py-0.5 text-[10px] font-bold text-[#6b7280]">
                  Pronto
                </span>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(107,114,128,0.1)]">
                  <Icon className="size-7 text-[#4b5563]" />
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
                className="group flex flex-col items-center gap-3 rounded-2xl border border-[#1a1a2e] bg-[#111120] p-5 transition-all hover:border-[#2a2a4e] hover:bg-[#14142a]"
              >
                <div
                  className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-2xl transition-colors",
                    colors.bg
                  )}
                >
                  <Icon className={cn("size-7", colors.icon)} />
                </div>
                <span className="text-sm font-semibold text-[#e5e7eb] group-hover:text-white">
                  {tile.label}
                </span>
              </Link>
              {tile.badge !== undefined && tile.badge > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ef4444] px-1 text-[10px] font-bold text-white">
                  {tile.badge > 99 ? "99+" : tile.badge}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Revenue — oculto para entrenadores */}
        {!isTrainer ? <div className="relative overflow-hidden rounded-xl bg-[#111120] p-5">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6]" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#6b7280]">
            Recaudo — {monthName}
          </p>
          <p className="mt-2 text-3xl font-extrabold text-white">
            ${revenue.toLocaleString("es-EC", { minimumFractionDigits: 2 })}
          </p>
          {revenueDelta !== null ? (
            <p
              className={cn(
                "mt-1.5 flex items-center gap-1 text-xs font-medium",
                revenueDelta >= 0 ? "text-[#4ade80]" : "text-[#f87171]"
              )}
            >
              {revenueDelta >= 0 ? (
                <TrendingUp className="size-3.5" />
              ) : (
                <TrendingDown className="size-3.5" />
              )}
              {revenueDelta >= 0 ? "+" : ""}
              {revenueDelta}% vs mes anterior
            </p>
          ) : (
            <p className="mt-1.5 text-xs text-[#6b7280]">Sin datos del mes anterior</p>
          )}
        </div> : null}

        {/* Active members */}
        <div className="relative overflow-hidden rounded-xl bg-[#111120] p-5">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-[#8b5cf6] to-[#a78bfa]" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#6b7280]">
            Miembros activos
          </p>
          <p className="mt-2 text-3xl font-extrabold text-white">{activeMembers}</p>
          <p className="mt-1.5 flex items-center gap-1 text-xs text-[#6b7280]">
            <Users className="size-3.5" />
            afiliados con membresía vigente
          </p>
        </div>

        {/* Pending payments — oculto para entrenadores */}
        {!isTrainer ? <Link href={`/${orgSlug}/dashboard/pagos`} className="group">
          <div
            className={cn(
              "relative overflow-hidden rounded-xl bg-[#111120] p-5 transition-colors group-hover:bg-[#14142a]",
              pendingPayments > 0 && "ring-1 ring-[#ef4444]/20"
            )}
          >
            <div
              className={cn(
                "absolute inset-x-0 top-0 h-0.5",
                pendingPayments > 0
                  ? "bg-gradient-to-r from-[#ef4444] to-[#f87171]"
                  : "bg-gradient-to-r from-[#22c55e] to-[#4ade80]"
              )}
            />
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#6b7280]">
              Pagos pendientes
            </p>
            <p className="mt-2 text-3xl font-extrabold text-white">{pendingPayments}</p>
            <p
              className={cn(
                "mt-1.5 flex items-center gap-1 text-xs font-medium",
                pendingPayments > 0 ? "text-[#f87171]" : "text-[#4ade80]"
              )}
            >
              <CreditCard className="size-3.5" />
              {pendingPayments > 0 ? "Requieren revisión →" : "Todo al día"}
            </p>
          </div>
        </Link> : null}

        {/* Expiring soon */}
        <div
          className={cn(
            "relative overflow-hidden rounded-xl bg-[#111120] p-5",
            expiringList.length > 0 && "ring-1 ring-[#fbbf24]/20"
          )}
        >
          <div
            className={cn(
              "absolute inset-x-0 top-0 h-0.5",
              expiringList.length > 0
                ? "bg-gradient-to-r from-[#f59e0b] to-[#fbbf24]"
                : "bg-gradient-to-r from-[#22c55e] to-[#4ade80]"
            )}
          />
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#6b7280]">
            Vencen en 7 días
          </p>
          <p className="mt-2 text-3xl font-extrabold text-white">{expiringList.length}</p>
          <p
            className={cn(
              "mt-1.5 flex items-center gap-1 text-xs font-medium",
              expiringList.length > 0 ? "text-[#fbbf24]" : "text-[#4ade80]"
            )}
          >
            <Clock className="size-3.5" />
            {expiringList.length > 0 ? "membresías por vencer" : "Sin vencimientos próximos"}
          </p>
        </div>
      </div>

      {/* Content grid */}
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Recent members table */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#e5e7eb]">Miembros recientes</h2>
            <Link
              href={`/${orgSlug}/dashboard/miembros`}
              className="flex items-center gap-1 text-xs font-medium text-[#818cf8] hover:text-[#a5b4fc]"
            >
              Ver todos <ArrowRight className="size-3" />
            </Link>
          </div>
          <div className="overflow-hidden rounded-xl bg-[#111120]">
            {recentMembers.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-[#6b7280]">
                Aún no tienes miembros. <Link href={`/${orgSlug}/dashboard/miembros`} className="text-[#818cf8] hover:underline">Crea el primero</Link>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1a1a2e] bg-[#0d0d1a]">
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#4b5563]">Nombre</th>
                    <th className="hidden px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#4b5563] sm:table-cell">Teléfono</th>
                    <th className="hidden px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#4b5563] md:table-cell">Clase</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#4b5563]">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {recentMembers.map((member) => (
                    <tr
                      key={member.id}
                      className="border-b border-[#0f0f1e] last:border-0 hover:bg-[rgba(99,102,241,0.04)]"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/${orgSlug}/dashboard/miembros/${member.id}`}
                          className="font-semibold text-white hover:text-[#a5b4fc]"
                        >
                          {member.full_name}
                        </Link>
                      </td>
                      <td className="hidden px-4 py-3 text-[#6b7280] sm:table-cell">{member.phone}</td>
                      <td className="hidden px-4 py-3 text-[#6b7280] md:table-cell">
                        {memberClassMap[member.id] ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={member.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Expiring memberships panel */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#e5e7eb]">Próximos vencimientos</h2>
          </div>
          <div className="rounded-xl bg-[#111120] p-1">
            {expiringList.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-[#6b7280]">
                Sin vencimientos en los próximos 7 días
              </div>
            ) : (
              <div className="divide-y divide-[#0f0f1e]">
                {expiringList.map((item) => {
                  const days = daysUntil(item.end_date);
                  return (
                    <div key={item.id} className="flex items-center justify-between px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[#e5e7eb]">
                          {item.members?.full_name ?? "—"}
                        </p>
                        <p className="text-xs text-[#6b7280]">
                          {item.membership_plans?.name ?? "Plan"}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "ml-3 shrink-0 rounded-md px-2 py-1 text-[10px] font-bold",
                          days <= 2
                            ? "bg-[rgba(239,68,68,0.15)] text-[#f87171]"
                            : "bg-[rgba(251,191,36,0.12)] text-[#fbbf24]"
                        )}
                      >
                        {days === 0 ? "Hoy" : days === 1 ? "1 día" : `${days} días`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    active:   { label: "Activo",    className: "bg-[rgba(34,197,94,0.12)] text-[#4ade80]" },
    inactive: { label: "Inactivo",  className: "bg-[rgba(107,114,128,0.15)] text-[#9ca3af]" },
    frozen:   { label: "Congelado", className: "bg-[rgba(99,102,241,0.15)] text-[#818cf8]" },
    expired:  { label: "Vencido",   className: "bg-[rgba(239,68,68,0.12)] text-[#f87171]" },
  };
  const s = map[status] ?? { label: status, className: "bg-[#1a1a2e] text-[#6b7280]" };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold", s.className)}>
      {s.label}
    </span>
  );
}
