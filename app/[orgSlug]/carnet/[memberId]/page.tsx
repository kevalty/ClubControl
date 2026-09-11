import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { CarnetView } from "./carnet-view";

export default async function CarnetPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgSlug: string; memberId: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { orgSlug, memberId } = await params;
  const { token } = await searchParams;

  if (!token) notFound();

  const supabase = createServiceClient();

  const { data: member } = await supabase
    .from("members")
    .select("id, full_name, photo_url, status, qr_code, join_date")
    .eq("id", memberId)
    .eq("qr_code", token) // token validation: must match qr_code
    .maybeSingle();

  if (!member) notFound(); // invalid token or wrong member id

  const { data: org } = await supabase
    .from("organizations")
    .select("name, logo_url, primary_color")
    .eq("slug", orgSlug)
    .maybeSingle();

  const { data: activeMembership } = await supabase
    .from("memberships")
    .select("end_date, membership_plans(name)")
    .eq("member_id", memberId)
    .eq("status", "active")
    .order("end_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <CarnetView
      member={member}
      org={{
        name: org?.name ?? orgSlug,
        logo_url: org?.logo_url ?? null,
        primary_color: org?.primary_color ?? "#0EA5E9",
      }}
      activeMembership={activeMembership}
    />
  );
}
