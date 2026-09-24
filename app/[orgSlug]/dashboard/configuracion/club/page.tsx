import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClubSettingsForm } from "./club-settings-form";
import { updateClubSettings } from "./actions";

export default async function ClubSettingsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, logo_url, primary_color")
    .eq("slug", orgSlug)
    .maybeSingle();

  if (!org) notFound();

  const { data: myMembership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", org.id)
    .eq("user_id", userData.user?.id ?? "")
    .maybeSingle();

  if (!myMembership || !["owner", "admin"].includes(myMembership.role)) {
    redirect(`/${orgSlug}/dashboard`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Configuración del club</h1>
        <p className="mt-1 text-sm text-[#6b7280]">
          Personaliza el nombre, logo y colores de {org.name}
        </p>
      </div>

      <ClubSettingsForm
        orgSlug={orgSlug}
        action={updateClubSettings.bind(null, orgSlug)}
        defaultName={org.name}
        defaultColor={org.primary_color ?? "#6366f1"}
        defaultLogoUrl={org.logo_url ?? null}
      />
    </div>
  );
}
