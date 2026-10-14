import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard-shell";

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
      .select("id, name, logo_url, primary_color")
      .eq("slug", orgSlug)
      .maybeSingle(),
    supabase
      .from("payments")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending_review"),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
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
    <DashboardShell
      orgSlug={orgSlug}
      orgName={org.name}
      orgLogoUrl={org.logo_url ?? null}
      primaryColor={org.primary_color ?? "#6366f1"}
      pendingPayments={pendingPayments}
      pendingInscripciones={pendingInscripciones}
      userRole={userRole}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      initialNotifications={(notifications ?? []) as any}
    >
      {children}
    </DashboardShell>
  );
}
