import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingWizard } from "@/app/[orgSlug]/onboarding/wizard";

export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id, slug, name, address, primary_color, logo_url")
    .eq("slug", orgSlug)
    .maybeSingle();

  if (!org) {
    notFound();
  }

  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <OnboardingWizard org={org} />
    </main>
  );
}
