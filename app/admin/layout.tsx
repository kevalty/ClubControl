import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { ResponsiveNav } from "@/components/responsive-nav";

const NAV_ITEMS = [
  { href: "", label: "Resumen" },
  { href: "clubes", label: "Clubes" },
  { href: "pagos", label: "Pagos" },
  { href: "planes", label: "Planes" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/auth/login");
  }

  const { data: admin } = await supabase
    .from("platform_admins")
    .select("id")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (!admin) {
    redirect("/");
  }

  return (
    <div className="flex min-h-full flex-1 flex-col md:flex-row">
      <aside className="flex shrink-0 flex-col gap-3 border-b bg-muted/30 p-4 md:w-56 md:border-b-0 md:border-r">
        <div className="px-2 text-lg font-semibold">GestorClub — Admin</div>
        <ResponsiveNav basePath="/admin" items={NAV_ITEMS} />
        <form action={logout} className="pt-2 md:mt-auto">
          <Button type="submit" variant="ghost" size="sm" className="w-full">
            Cerrar sesión
          </Button>
        </form>
      </aside>
      <main className="flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
