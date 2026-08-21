import { createClient } from "@/lib/supabase/server";
import { enviarAnuncio } from "@/app/[orgSlug]/dashboard/whatsapp/anuncio/actions";
import { AnuncioForm } from "@/app/[orgSlug]/dashboard/whatsapp/anuncio/anuncio-form";

export default async function AnuncioPage({
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

  const { data: planes } = await supabase
    .from("membership_plans")
    .select("id, name")
    .eq("organization_id", org!.id)
    .eq("is_active", true)
    .order("name");

  const action = enviarAnuncio.bind(null, org!.id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Enviar anuncio por WhatsApp</h1>
      <AnuncioForm action={action} planes={planes ?? []} />
    </div>
  );
}
