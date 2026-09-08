import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";
import { DashboardSidebar } from "@/components/dashboard-sidebar";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const supabase = await createClient();

  const [{ data: org }, pendingResult] = await Promise.all([
    supabase
      .from("organizations")
      .select("id, name")
      .eq("slug", orgSlug)
      .maybeSingle(),
    supabase
      .from("payments")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending_review"),
  ]);

  if (!org) notFound();

  const pendingPayments = pendingResult.count ?? 0;

  return (
    <div className="flex h-full min-h-screen flex-col bg-[#08080f] md:flex-row">
      <DashboardSidebar
        orgSlug={orgSlug}
        orgName={org.name}
        pendingPayments={pendingPayments}
      />
      <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
    </div>
  );
}
