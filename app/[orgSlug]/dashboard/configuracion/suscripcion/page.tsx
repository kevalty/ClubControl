import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ORGANIZATION_STATUS_LABELS,
  PLATFORM_PAYMENT_STATUS_LABELS,
} from "@/lib/validations/platform-payment";
import { registrarPagoSuscripcion } from "@/app/[orgSlug]/dashboard/configuracion/suscripcion/actions";
import { PagarSuscripcionForm } from "@/app/[orgSlug]/dashboard/configuracion/suscripcion/pagar-form";

export default async function SuscripcionPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const { data: org } = await supabase
    .from("organizations")
    .select("id, status, trial_ends_at")
    .eq("slug", orgSlug)
    .single();

  const { data: myMembership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", org!.id)
    .eq("user_id", userData.user?.id ?? "")
    .maybeSingle();

  // CLAUDE.md §8.11: "Solo visible para owner".
  if (myMembership?.role !== "owner") {
    redirect(`/${orgSlug}/dashboard`);
  }

  const [{ data: suscripcion }, { data: planes }, { data: pagos }] = await Promise.all([
    supabase
      .from("organization_subscriptions")
      .select("status, current_period_end, subscription_plans(id, name, price_monthly)")
      .eq("organization_id", org!.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("subscription_plans")
      .select("id, name, price_monthly")
      .eq("is_active", true)
      .order("price_monthly"),
    supabase
      .from("platform_payments")
      .select("id, amount, status, created_at, subscription_plans(name)")
      .eq("organization_id", org!.id)
      .order("created_at", { ascending: false }),
  ]);

  const planActual = suscripcion?.subscription_plans as unknown as {
    id: string;
    name: string;
    price_monthly: number;
  } | null;

  return (
    <div className="max-w-lg space-y-8">
      <div>
        <h1 className="mb-4 text-2xl font-semibold">Suscripción de tu club</h1>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Plan actual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Badge>{ORGANIZATION_STATUS_LABELS[org!.status] ?? org!.status}</Badge>
            {planActual ? (
              <p className="text-sm">
                <span className="font-medium">{planActual.name}</span> — $
                {Number(planActual.price_monthly).toFixed(2)}/mes
              </p>
            ) : null}
            {suscripcion?.current_period_end ? (
              <p className="text-sm text-muted-foreground">
                Vigente hasta {new Date(suscripcion.current_period_end).toLocaleDateString("es-EC")}
              </p>
            ) : null}
            {org!.status === "trial" && org!.trial_ends_at ? (
              <p className="text-sm text-muted-foreground">
                Prueba gratuita hasta{" "}
                {new Date(org!.trial_ends_at).toLocaleDateString("es-EC")}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-medium">Pagar o cambiar de plan</h2>
        <PagarSuscripcionForm
          action={registrarPagoSuscripcion.bind(null, orgSlug, org!.id)}
          planes={planes ?? []}
          planActualId={planActual?.id}
        />
      </div>

      {pagos && pagos.length > 0 ? (
        <div>
          <h2 className="mb-3 text-lg font-medium">Historial</h2>
          <ul className="divide-y rounded-lg border">
            {pagos.map((p) => (
              <li key={p.id} className="flex items-center justify-between p-3 text-sm">
                <span>
                  {(p.subscription_plans as unknown as { name: string } | null)?.name} — $
                  {Number(p.amount).toFixed(2)}
                </span>
                <Badge variant={p.status === "approved" ? "default" : "secondary"}>
                  {PLATFORM_PAYMENT_STATUS_LABELS[p.status] ?? p.status}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
