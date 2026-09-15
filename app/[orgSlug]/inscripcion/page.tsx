import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { InscripcionForm } from "./inscripcion-form";

export default async function InscripcionPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ para?: string }>;
}) {
  const { orgSlug } = await params;
  const { para } = await searchParams;
  const studentName = para ? decodeURIComponent(para) : "";
  // Use service client: this is a public route with no auth session
  const supabase = createServiceClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, logo_url")
    .eq("slug", orgSlug)
    .maybeSingle();
  if (!org) notFound();

  const [{ data: locations }, { data: feeTypes }] = await Promise.all([
    supabase
      .from("locations")
      .select("id, name")
      .eq("organization_id", org.id)
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("fee_types")
      .select("id, name, discount_percent")
      .eq("organization_id", org.id)
      .eq("is_active", true)
      .order("name"),
  ]);

  return (
    <main className="min-h-screen bg-muted/40 p-4">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 text-center">
          {org.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={org.logo_url}
              alt={org.name}
              className="mx-auto mb-3 h-16 w-auto object-contain"
            />
          ) : null}
          <h1 className="text-2xl font-bold">{org.name}</h1>
          <p className="text-muted-foreground">Formulario de inscripción</p>
        </div>
        <InscripcionForm
          orgSlug={orgSlug}
          orgId={org.id}
          locations={locations ?? []}
          feeTypes={feeTypes ?? []}
          studentName={studentName}
        />
      </div>
    </main>
  );
}
