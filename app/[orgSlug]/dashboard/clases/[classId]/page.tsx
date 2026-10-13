import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
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
  // Use service client for class_enrollments to bypass RLS (server-side reads)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svc = createServiceClient() as any;

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

  // Fetch enrolled members — service client bypasses RLS for server-side reads
  const { data: enrollmentsRaw, error: enrollErr } = await svc
    .from("class_enrollments")
    .select("member_id, members(id, full_name, phone, status)")
    .eq("class_id", classId)
    .eq("organization_id", orgId)
    .eq("status", "active");
  if (enrollErr) console.error("[claseDetail] enrollmentsRaw error:", JSON.stringify(enrollErr));

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

  const { data: otherEnrollments } = availableIds.length > 0
    ? await svc
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

  // Fetch upcoming sessions (next 60 days)
  const today = new Date().toISOString().slice(0, 10);
  const in60 = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const { data: sesiones } = await supabase
    .from("class_sessions")
    .select("id, session_date, start_time, end_time, status")
    .eq("class_id", classId)
    .eq("organization_id", orgId)
    .gte("session_date", today)
    .lte("session_date", in60)
    .order("session_date", { ascending: true })
    .limit(20);

  const rule = clase.recurrence_rule as unknown as {
    days: string[];
    start_time: string;
    end_time: string;
  };

  const labelDias = (days: string[]) =>
    days.map((d) => WEEKDAYS.find((w) => w.value === d)?.label ?? d).join(", ");

  const SESSION_STATUS_LABELS: Record<string, string> = {
    scheduled: "Programada",
    cancelled: "Cancelada",
    completed: "Completada",
  };

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

      {/* Upcoming sessions */}
      <div>
        <h2 className="mb-3 text-base font-semibold text-white">Próximas sesiones</h2>
        {!sesiones || sesiones.length === 0 ? (
          <p className="text-sm text-[#6b7280]">No hay sesiones programadas en los próximos 60 días.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[#1a1a2e]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1a1a2e] text-left">
                  <th className="px-4 py-2 font-medium text-[#9ca3af]">Fecha</th>
                  <th className="hidden sm:table-cell px-4 py-2 font-medium text-[#9ca3af]">Horario</th>
                  <th className="px-4 py-2 font-medium text-[#9ca3af]">Estado</th>
                  <th className="px-4 py-2 text-right font-medium text-[#9ca3af]">Asistencia</th>
                </tr>
              </thead>
              <tbody>
                {sesiones.map((s) => (
                  <tr key={s.id} className="border-b border-[#1a1a2e] last:border-0 hover:bg-[#0f0f1f]">
                    <td className="px-4 py-2 text-white">
                      {new Date(s.session_date + "T00:00:00").toLocaleDateString("es-EC", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}
                    </td>
                    <td className="hidden sm:table-cell px-4 py-2 text-[#9ca3af]">
                      {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={
                          s.status === "scheduled"
                            ? "text-[#4ade80]"
                            : s.status === "cancelled"
                            ? "text-[#f87171]"
                            : "text-[#9ca3af]"
                        }
                      >
                        {SESSION_STATUS_LABELS[s.status] ?? s.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Link
                        href={`/${orgSlug}/dashboard/clases/sesiones/${s.id}`}
                        className="text-[#818cf8] hover:text-[#a5b4fc] text-xs underline-offset-2 hover:underline"
                      >
                        Ver asistencia
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
