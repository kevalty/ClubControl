import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { CheckinKiosk } from "@/app/[orgSlug]/checkin/checkin-kiosk";

export default async function CheckinPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  // Kiosco público: usa service client para leer el org sin requerir sesión.
  // El QR del miembro es la credencial, no una cookie de auth.
  const supabase = createServiceClient();

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
