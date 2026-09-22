import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { crearEquipo } from "../actions";
import { NuevoEquipoForm } from "./nuevo-equipo-form";

export default async function NuevoEquipoPage({
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

  const action = crearEquipo.bind(null, orgSlug, org.id);

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold">Nuevo equipo de torneo</h1>
      <NuevoEquipoForm action={action} orgSlug={orgSlug} />
    </div>
  );
}
