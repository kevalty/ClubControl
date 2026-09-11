import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LinkButton } from "@/components/ui/link-button";

export default async function FacturacionPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const supabase = await createClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("id, name")
    .eq("slug", orgSlug)
    .maybeSingle();
  if (!org) notFound();

  const { data: facturas } = await supabase
    .from("sim_invoices")
    .select("id, sequential_number, recipient_name, concept, total, created_at")
    .eq("organization_id", org.id)
    .order("sequential_number", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Facturación (simulador)</h1>
          <p className="text-sm text-amber-600 dark:text-amber-400">
            Este simulador no emite facturas válidas ante el SRI. Solo para uso interno de referencia.
          </p>
        </div>
        <LinkButton href={`/${orgSlug}/dashboard/facturacion/nueva`}>
          Nueva factura
        </LinkButton>
      </div>
      {!facturas?.length ? (
        <p className="text-muted-foreground">No hay facturas simuladas generadas.</p>
      ) : (
        <div className="divide-y rounded-lg border">
          {facturas.map((f) => (
            <div key={f.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">#{String(f.sequential_number).padStart(9, "0")} — {f.recipient_name}</p>
                <p className="text-sm text-muted-foreground">{f.concept}</p>
                <p className="text-xs text-muted-foreground">{new Date(f.created_at).toLocaleDateString("es-EC")}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold">${Number(f.total).toFixed(2)}</span>
                <LinkButton href={`/${orgSlug}/dashboard/facturacion/${f.id}`} variant="outline" size="sm">
                  Ver / Imprimir
                </LinkButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
