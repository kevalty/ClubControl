import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminResumenPage() {
  const supabase = await createClient();

  const [{ data: orgs }, { data: suscripciones }] = await Promise.all([
    supabase.from("organizations").select("id, status"),
    supabase
      .from("organization_subscriptions")
      .select("organization_id, status, subscription_plans(price_monthly)")
      .order("created_at", { ascending: false }),
  ]);

  const activos = (orgs ?? []).filter((o) => o.status === "active").length;
  const enTrial = (orgs ?? []).filter((o) => o.status === "trial").length;
  const churn = (orgs ?? []).filter(
    (o) => o.status === "suspended" || o.status === "cancelled"
  ).length;

  // Una suscripción por organización (la más reciente, ya viene ordenada).
  const suscripcionPorOrg = new Map<string, { price: number }>();
  for (const s of suscripciones ?? []) {
    if (!suscripcionPorOrg.has(s.organization_id)) {
      const price =
        (s.subscription_plans as unknown as { price_monthly: number } | null)
          ?.price_monthly ?? 0;
      suscripcionPorOrg.set(s.organization_id, { price });
    }
  }
  const mrr = (orgs ?? [])
    .filter((o) => o.status === "active")
    .reduce((sum, o) => sum + (suscripcionPorOrg.get(o.id)?.price ?? 0), 0);

  const metrics = [
    { label: "MRR", value: `$${mrr.toFixed(2)}` },
    { label: "Clubes activos", value: activos },
    { label: "Clubes en prueba", value: enTrial },
    { label: "Churn (suspendidos/cancelados)", value: churn },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Resumen de la plataforma</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <Card key={m.label}>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">{m.label}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{m.value}</CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
