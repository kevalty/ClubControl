import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock } from "lucide-react";
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

  const statusLabel = ORGANIZATION_STATUS_LABELS[org!.status] ?? org!.status;
  const isTrial = org!.status === "trial";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Suscripción</h1>
        <p className="mt-1 text-sm text-[#6b7280]">Gestiona el plan de tu club</p>
      </div>

      {/* Plan actual */}
      <div className="rounded-xl border border-[#1a1a2e] bg-[#0d0d1a] p-6">
        <p className="mb-4 text-xs font-bold uppercase tracking-widest text-[#3d3d5c]">Plan actual</p>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xl font-bold text-white">
              {planActual?.name ?? "Sin plan"}
            </p>
            {planActual && (
              <p className="mt-1 text-sm text-[#6b7280]">
                ${Number(planActual.price_monthly).toFixed(2)}/mes
              </p>
            )}
          </div>
          <Badge
            className={
              isTrial
                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                : "bg-[#6366f1]/10 text-[#818cf8] border-[#6366f1]/20"
            }
          >
            {statusLabel}
          </Badge>
        </div>

        <div className="mt-4 space-y-2">
          {suscripcion?.current_period_end && (
            <div className="flex items-center gap-2 text-sm text-[#6b7280]">
              <CheckCircle2 className="size-4 text-[#4ade80]" />
              Vigente hasta{" "}
              {new Date(suscripcion.current_period_end).toLocaleDateString("es-EC")}
            </div>
          )}
          {isTrial && org!.trial_ends_at && (
            <div className="flex items-center gap-2 text-sm text-[#6b7280]">
              <Clock className="size-4 text-amber-400" />
              Prueba gratuita hasta{" "}
              {new Date(org!.trial_ends_at).toLocaleDateString("es-EC")}
            </div>
          )}
        </div>
      </div>

      {/* Pagar / cambiar plan */}
      <div className="rounded-xl border border-[#1a1a2e] bg-[#0d0d1a] p-6">
        <p className="mb-4 text-xs font-bold uppercase tracking-widest text-[#3d3d5c]">Pagar o cambiar de plan</p>
        <PagarSuscripcionForm
          action={registrarPagoSuscripcion.bind(null, orgSlug, org!.id)}
          planes={planes ?? []}
        />
      </div>

      {/* Historial */}
      {pagos && pagos.length > 0 && (
        <div className="rounded-xl border border-[#1a1a2e] bg-[#0d0d1a] p-6">
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-[#3d3d5c]">Historial de pagos</p>
          <div className="divide-y divide-[#1a1a2e]">
            {pagos.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="text-white">
                    {(p.subscription_plans as unknown as { name: string } | null)?.name ?? "Plan"}
                  </p>
                  <p className="text-xs text-[#6b7280]">
                    {new Date(p.created_at).toLocaleDateString("es-EC")} — $
                    {Number(p.amount).toFixed(2)}
                  </p>
                </div>
                <Badge
                  className={
                    p.status === "approved"
                      ? "bg-[#4ade80]/10 text-[#4ade80] border-[#4ade80]/20"
                      : "bg-[#1a1a2e] text-[#6b7280] border-transparent"
                  }
                >
                  {PLATFORM_PAYMENT_STATUS_LABELS[p.status] ?? p.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
