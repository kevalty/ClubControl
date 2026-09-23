import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { crearGrupoFamiliar } from "../actions";
import { NuevoGrupoForm } from "./nuevo-grupo-form";

export default async function NuevoGrupoPage({
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

  const action = crearGrupoFamiliar.bind(null, orgSlug, org.id);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold">Nuevo grupo familiar</h1>
      <NuevoGrupoForm action={action} backHref={`/${orgSlug}/dashboard/configuracion/familias`} />
    </div>
  );
}
