import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { crearSede } from "../actions";
import { SedeForm } from "../sede-form";

export default async function NuevaSedeePage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const supabase = await createClient();
  const { data: org } = await supabase.from("organizations").select("id").eq("slug", orgSlug).maybeSingle();
  if (!org) notFound();

  const action = crearSede.bind(null, orgSlug, org.id);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Nueva sede</h1>
      <SedeForm action={action} submitLabel="Crear sede" />
    </div>
  );
}
