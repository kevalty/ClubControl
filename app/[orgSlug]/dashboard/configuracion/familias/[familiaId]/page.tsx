import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { FamiliaManager } from "./familia-manager";

type FamilyGroupRow = {
  id: string;
  name: string;
  discount_amount: number | null;
  discount_percent: number | null;
};

type MemberRow = { id: string; full_name: string; phone: string };

export default async function FamiliaDetailPage({
  params,
}: {
  params: Promise<{ orgSlug: string; familiaId: string }>;
}) {
  const { orgSlug, familiaId } = await params;
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .maybeSingle();
  if (!org) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: grupo } = await (supabase as any)
    .from("family_groups")
    .select("id, name, discount_amount, discount_percent")
    .eq("id", familiaId)
    .eq("organization_id", org.id)
    .maybeSingle();
  if (!grupo) notFound();

  const g = grupo as FamilyGroupRow;

  // Enrolled members
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: fgmRaw } = await (supabase as any)
    .from("family_group_members")
    .select("member_id, members!inner(id, full_name, phone)")
    .eq("family_group_id", familiaId);

  const enrolledMembers: MemberRow[] = (
    (fgmRaw ?? []) as Array<{ member_id: string; members: MemberRow }>
  ).map((row) => row.members);

  const enrolledIds = new Set(enrolledMembers.map((m) => m.id));

  // All active members not yet enrolled
  const { data: allMembersRaw } = await supabase
    .from("members")
    .select("id, full_name, phone")
    .eq("organization_id", org.id)
    .eq("status", "active")
    .order("full_name");

  const availableMembers: MemberRow[] = (
    (allMembersRaw ?? []) as MemberRow[]
  ).filter((m) => !enrolledIds.has(m.id));

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/${orgSlug}/dashboard/configuracion/familias`}
          className="text-sm text-[#6b7280] hover:text-white"
        >
          ← Grupos familiares
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{g.name}</h1>
        <p className="text-sm text-muted-foreground">
          {g.discount_amount != null ? `Descuento fijo: $${Number(g.discount_amount).toFixed(2)}` : null}
          {g.discount_amount != null && g.discount_percent != null ? " · " : null}
          {g.discount_percent != null ? `Descuento: ${g.discount_percent}%` : null}
          {g.discount_amount == null && g.discount_percent == null ? "Sin descuento configurado" : null}
        </p>
      </div>

      <FamiliaManager
        orgSlug={orgSlug}
        familiaId={familiaId}
        enrolledMembers={enrolledMembers}
        availableMembers={availableMembers}
      />
    </div>
  );
}
