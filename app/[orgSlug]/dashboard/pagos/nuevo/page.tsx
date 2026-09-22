import { createClient } from "@/lib/supabase/server";
import { registrarPago } from "@/app/[orgSlug]/dashboard/pagos/actions";
import { RegistrarPagoForm } from "@/app/[orgSlug]/dashboard/pagos/nuevo/registrar-pago-form";

export default async function NuevoPagoPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ miembro?: string }>;
}) {
  const { orgSlug } = await params;
  const { miembro: preselectedMemberId } = await searchParams;
  const supabase = await createClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .single();

  const [{ data: miembrosRaw }, { data: planes }, { data: membresias }, { data: rubros }] =
    await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any)
        .from("members")
        .select("id, full_name, fee_type_id")
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
        .select("id, member_id, end_date, status, membership_plans(name, price)")
        .eq("organization_id", org!.id)
        .in("status", ["active", "frozen"]),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any)
        .from("fee_types")
        .select("id, name, discount_percent")
        .eq("organization_id", org!.id)
        .eq("is_active", true),
    ]);

  const rubroMap = new Map(
    ((rubros ?? []) as Array<{ id: string; name: string; discount_percent: number }>).map(
      (r) => [r.id, r]
    )
  );

  const miembros = (
    (miembrosRaw ?? []) as Array<{ id: string; full_name: string; fee_type_id: string | null }>
  ).map((m) => ({
    id: m.id,
    full_name: m.full_name,
    rubro: m.fee_type_id ? rubroMap.get(m.fee_type_id) ?? null : null,
  }));

  const action = registrarPago.bind(null, orgSlug, org!.id);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold">Registrar pago</h1>
      <RegistrarPagoForm
        action={action}
        miembros={miembros}
        planes={planes ?? []}
        preselectedMemberId={preselectedMemberId}
        membresias={(membresias ?? []).map((m) => ({
          id: m.id,
          member_id: m.member_id,
          end_date: m.end_date,
          status: m.status,
          plan_name:
            (m.membership_plans as unknown as { name: string; price: number } | null)?.name ??
            "Plan",
          plan_price:
            (m.membership_plans as unknown as { name: string; price: number } | null)?.price ??
            null,
        }))}
      />
    </div>
  );
}
