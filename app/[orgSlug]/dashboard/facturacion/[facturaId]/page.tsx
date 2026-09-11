import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PrintFactura } from "./print-factura";

export default async function VerFacturaPage({
  params,
}: {
  params: Promise<{ orgSlug: string; facturaId: string }>;
}) {
  const { orgSlug, facturaId } = await params;
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, address, email, logo_url")
    .eq("slug", orgSlug)
    .maybeSingle();
  if (!org) notFound();

  const { data: factura } = await supabase
    .from("sim_invoices")
    .select("*")
    .eq("id", facturaId)
    .eq("organization_id", org.id)
    .maybeSingle();
  if (!factura) notFound();

  return <PrintFactura org={org} factura={factura} />;
}
