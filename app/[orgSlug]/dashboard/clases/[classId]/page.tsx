import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EnrollmentManager } from "./enrollment-manager";
import { WEEKDAYS } from "@/lib/validations/class";
import { ArrowLeft } from "lucide-react";

export default async function ClaseDetailPage({
  params,
}: {
  params: Promise<{ orgSlug: string; classId: string }>;
}) {
  const { orgSlug, classId } = await params;
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .maybeSingle();

  if (!org) notFound();
  const orgId = org.id;

  // Fetch class details
  const { data: clase } = await supabase
    .from("classes")
    .select("id, name, description, capacity, location, recurrence_rule, is_active")
    .eq("id", classId)
    .eq("organization_id", orgId)
    .maybeSingle();

  if (!clase) notFound();

  // Fetch enrolled members (active enrollments)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: enrollmentsRaw } = await (supabase as any)
    .from("class_enrollments")
    .select("member_id, members(id, full_name, phone, status)")
    .eq("class_id", classId)
    .eq("organization_id", orgId)
    .eq("status", "active");

  const enrolledMembers = (enrollmentsRaw ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((e: any) => e.members)
    .filter(Boolean) as Array<{
      id: string;
      full_name: string;
      phone: string;
      status: string;
    }>;

  const enrolledIds = new Set(enrolledMembers.map((m) => m.id));

  // Fetch all active members not already enrolled
  const { data: allActiveMembers } = await supabase
    .from("members")
    .select("id, full_name, phone")
    .eq("organization_id", orgId)
    .eq("status", "active")
    .order("full_name");

  // Fetch which class each non-enrolled member is currently in
  const availableIds = (allActiveMembers ?? [])
    .filter((m) => !enrolledIds.has(m.id))
    .map((m) => m.id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: otherEnrollments } = availableIds.length > 0
    ? await (supabase as any)
        .from("class_enrollments")
        .select("member_id, class_id, classes(name)")
        .in("member_id", availableIds)
        .eq("organization_id", orgId)
        .eq("status", "active")
    : { data: [] };

  // Map member_id → first class name they're in
  const memberClassMap: Record<string, string> = {};
  for (const e of otherEnrollments ?? []) {
    if (!memberClassMap[e.member_id] && e.classes?.name) {
      memberClassMap[e.member_id] = e.classes.name;
    }
  }

  const availableMembers = (allActiveMembers ?? [])
    .filter((m) => !enrolledIds.has(m.id))
    .map((m) => ({ ...m, currentClass: memberClassMap[m.id] ?? null }));

  const rule = clase.recurrence_rule as unknown as {
    days: string[];
    start_time: string;
    end_time: string;
  };

  const labelDias = (days: string[]) =>
    days.map((d) => WEEKDAYS.find((w) => w.value === d)?.label ?? d).join(", ");

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href={`/${orgSlug}/dashboard/clases`}
        className="inline-flex items-center gap-1.5 text-sm text-[#818cf8] hover:text-[#a5b4fc]"
      >
        <ArrowLeft className="size-3.5" />
        Volver a clases
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">{clase.name}</h1>
          {clase.description && (
            <p className="mt-1 text-sm text-[#6b7280]">{clase.description}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-[#9ca3af]">
            <span>{labelDias(rule.days)} · {rule.start_time}–{rule.end_time}</span>
            {clase.location && <span>📍 {clase.location}</span>}
            <span>Cupo: {clase.capacity}</span>
            <span
              className={
                clase.is_active
                  ? "text-[#4ade80]"
                  : "text-[#6b7280]"
              }
            >
              {clase.is_active ? "Activa" : "Inactiva"}
            </span>
          </div>
        </div>
        <Link
          href={`/${orgSlug}/dashboard/clases/${classId}/editar`}
          className="rounded-lg border border-[#1a1a2e] px-3 py-1.5 text-sm text-[#9ca3af] hover:bg-[#14142a] hover:text-white"
        >
          Editar clase
        </Link>
      </div>

      {/* Enrollment manager */}
      <EnrollmentManager
        orgSlug={orgSlug}
        orgId={orgId}
        classId={classId}
        enrolledMembers={enrolledMembers}
        availableMembers={availableMembers}
      />
    </div>
  );
}
