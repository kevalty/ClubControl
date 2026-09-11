import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { crearRubro } from "../actions";
import { RubroForm } from "../rubro-form";

export default async function NuevoRubroPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const supabase = await createClient();
  const { data: org } = await supabase.from("organizations").select("id").eq("slug", orgSlug).maybeSingle();
  if (!org) notFound();

  const action = crearRubro.bind(null, orgSlug, org.id);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Nuevo rubro</h1>
      <RubroForm action={action} submitLabel="Crear rubro" />
    </div>
  );
}
