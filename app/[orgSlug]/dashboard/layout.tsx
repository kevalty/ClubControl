import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { NotificationBell } from "@/components/dashboard/notification-bell";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const supabase = await createClient();

  const { data: authUser } = await supabase.auth.getUser();

  const [{ data: org }, pendingResult, inscripcionesResult] = await Promise.all([
    supabase
      .from("organizations")
      .select("id, name")
      .eq("slug", orgSlug)
      .maybeSingle(),
    supabase
      .from("payments")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending_review"),
    supabase
      .from("members")
      .select("*", { count: "exact", head: true })
      .eq("registration_status", "pending_approval"),
  ]);

  // Separate query so a missing table (before migration is applied) doesn't
  // break the entire layout Promise.all.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: notifications } = await (supabase as any)
    .from("notifications")
    .select("id, title, body, link, read_at, created_at")
    .eq("user_id", authUser.user?.id ?? "")
    .order("created_at", { ascending: false })
    .limit(20)
    .then((r: { data: unknown }) => r)
    .catch(() => ({ data: [] }));

  if (!org) notFound();

  const { data: orgMembership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", org.id)
    .eq("user_id", authUser.user?.id ?? "")
    .maybeSingle();
  const userRole = orgMembership?.role ?? "staff";

  const pendingPayments = pendingResult.count ?? 0;
  const pendingInscripciones = inscripcionesResult.count ?? 0;

  return (
    <div className="flex h-full min-h-screen flex-col bg-[#08080f] md:flex-row">
      <DashboardSidebar
        orgSlug={orgSlug}
        orgName={org.name}
        pendingPayments={pendingPayments}
        pendingInscripciones={pendingInscripciones}
        userRole={userRole}
      />
      <div className="flex flex-1 flex-col min-h-0">
        {/* Top bar with notification bell */}
        <div className="flex items-center justify-end gap-2 border-b border-[#1a1a2e] bg-[#08080f] px-4 py-2">
          <NotificationBell
            initialNotifications={
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (notifications ?? []) as any
            }
          />
        </div>
        <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
