import { createClient } from "@/lib/supabase/server";
import { registrarPago } from "@/app/[orgSlug]/dashboard/pagos/actions";
import { RegistrarPagoForm } from "@/app/[orgSlug]/dashboard/pagos/nuevo/registrar-pago-form";

export default async function NuevoPagoPage({
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
    .single();

  const [{ data: miembros }, { data: planes }, { data: membresias }] = await Promise.all([
    supabase
      .from("members")
      .select("id, full_name")
      .eq("organization_id", org!.id)
      .order("full_name"),
    supabase
      .from("membership_plans")
      .select("id, name, price")
      .eq("organization_id", org!.id)
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("memberships")
      .select("id, member_id, end_date, status, membership_plans(name)")
      .eq("organization_id", org!.id)
      .in("status", ["active", "frozen"]),
  ]);

  const action = registrarPago.bind(null, orgSlug, org!.id);

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold">Registrar pago</h1>
      <RegistrarPagoForm
        action={action}
        miembros={miembros ?? []}
        planes={planes ?? []}
        membresias={(membresias ?? []).map((m) => ({
          id: m.id,
          member_id: m.member_id,
          end_date: m.end_date,
          status: m.status,
          plan_name:
            (m.membership_plans as unknown as { name: string } | null)?.name ?? "Plan",
        }))}
      />
    </div>
  );
}
