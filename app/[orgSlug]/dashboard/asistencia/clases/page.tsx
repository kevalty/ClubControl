import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AsistenciaClasesPage({
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

  const { data: authUser } = await supabase.auth.getUser();
  const { data: membership } = await supabase
    .from("organization_members")
    .select("role, user_id")
    .eq("organization_id", org.id)
    .eq("user_id", authUser.user?.id ?? "")
    .maybeSingle();

  const isTrainer = membership?.role === "trainer";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from("classes")
    .select("id, name, location, recurrence_rule, is_active, trainer_user_id")
    .eq("organization_id", org.id)
    .eq("is_active", true)
    .order("name");

  if (isTrainer) {
    query = query.eq("trainer_user_id", authUser.user?.id ?? "");
  }

  const { data: clases } = await query;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/${orgSlug}/dashboard/asistencia`}
          className="text-sm text-muted-foreground hover:text-white"
        >
          ← Asistencia
        </Link>
        <h1 className="text-2xl font-semibold">Clases</h1>
      </div>
      {!clases?.length ? (
        <p className="text-muted-foreground">
          No hay clases activas{isTrainer ? " asignadas a ti" : ""}.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clases.map(
            (c: {
              id: string;
              name: string;
              location: string | null;
              recurrence_rule: {
                days: string[];
                start_time: string;
                end_time: string;
              } | null;
            }) => {
              const rule = c.recurrence_rule;
              return (
                <Link
                  key={c.id}
                  href={`/${orgSlug}/dashboard/asistencia/${c.id}`}
                  className="rounded-xl border border-[#1a1a2e] bg-[#0d0d1a] p-4 hover:border-[#6366f1]/40 transition-colors"
                >
                  <p className="font-semibold text-white">{c.name}</p>
                  {c.location ? (
                    <p className="text-xs text-muted-foreground mt-1">
                      {c.location}
                    </p>
                  ) : null}
                  {rule ? (
                    <p className="text-xs text-muted-foreground mt-1">
                      {rule.days.join(", ").toUpperCase()} · {rule.start_time}–
                      {rule.end_time}
                    </p>
                  ) : null}
                  <p className="mt-3 text-xs font-medium text-[#818cf8]">
                    Ver sesiones →
                  </p>
                </Link>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}
