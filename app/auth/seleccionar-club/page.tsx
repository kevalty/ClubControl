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

  const { data: memberships } = await supabase
    .from("organization_members")
    .select("role, organizations(slug, name)")
    .eq("user_id", userData.user.id)
    .eq("status", "active");

  const clubes = (memberships ?? [])
    .map((m) => ({
      role: m.role,
      ...(m.organizations as unknown as { slug: string; name: string } | null),
    }))
    .filter((c): c is { role: string; slug: string; name: string } => !!c.slug);

  if (clubes.length === 0) {
    redirect("/");
  }
  if (clubes.length === 1) {
    redirect(`/${clubes[0].slug}/dashboard`);
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-4">
      <h1 className="text-2xl font-semibold">¿A qué club quieres entrar?</h1>
      <div className="grid w-full max-w-sm gap-3">
        {clubes.map((club) => (
          <Card key={club.slug}>
            <CardHeader>
              <CardTitle className="text-base">{club.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <LinkButton href={`/${club.slug}/dashboard`} className="w-full">
                Entrar
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
