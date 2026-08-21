import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CheckinKiosk } from "@/app/[orgSlug]/checkin/checkin-kiosk";

export default async function CheckinPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, logo_url")
    .eq("slug", orgSlug)
    .maybeSingle();

  if (!org) {
    notFound();
  }

  return <CheckinKiosk orgSlug={orgSlug} orgName={org.name} />;
}
