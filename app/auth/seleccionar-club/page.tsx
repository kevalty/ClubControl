import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SeleccionarClubPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/auth/login");
  }

  const [{ data: staffMemberships }, { data: portalMemberships }] = await Promise.all([
    supabase
      .from("organization_members")
      .select("organizations(slug, name)")
      .eq("user_id", userData.user.id)
      .eq("status", "active"),
    supabase.from("members").select("organizations(slug, name)").eq("user_id", userData.user.id),
  ]);

  const destinos = [
    ...(staffMemberships ?? []).map((m) => ({
      ...(m.organizations as unknown as { slug: string; name: string } | null),
      path: "dashboard",
      label: "Panel de administración",
    })),
    ...(portalMemberships ?? []).map((m) => ({
      ...(m.organizations as unknown as { slug: string; name: string } | null),
      path: "portal",
      label: "Mi portal",
    })),
  ].filter(
    (d): d is { slug: string; name: string; path: string; label: string } => !!d.slug
  );

  if (destinos.length === 0) {
    redirect("/");
  }
  if (destinos.length === 1) {
    redirect(`/${destinos[0].slug}/${destinos[0].path}`);
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-4">
      <h1 className="text-2xl font-semibold">¿A dónde quieres entrar?</h1>
      <div className="grid w-full max-w-sm gap-3">
        {destinos.map((d) => (
          <Card key={`${d.slug}-${d.path}`}>
            <CardHeader>
              <CardTitle className="text-base">{d.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <LinkButton href={`/${d.slug}/${d.path}`} className="w-full">
                {d.label}
              </LinkButton>
            </CardContent>
          </Card>
        ))}
      </div>
      <form action={logout}>
        <Button type="submit" variant="ghost" size="sm">
          Cerrar sesión
        </Button>
      </form>
    </main>
  );
}
