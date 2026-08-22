import { logout } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { ResponsiveNav } from "@/components/responsive-nav";
import { getCurrentMember } from "@/lib/portal/get-current-member";

const NAV_ITEMS = [
  { href: "", label: "Inicio" },
  { href: "pagos", label: "Pagos" },
  { href: "qr", label: "Mi QR" },
  { href: "clases", label: "Clases" },
  { href: "asistencia", label: "Asistencia" },
  { href: "perfil", label: "Mi perfil" },
];

export default async function PortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const { org } = await getCurrentMember(orgSlug);

  return (
    <div className="flex min-h-full flex-1 flex-col md:flex-row">
      <aside className="flex shrink-0 flex-col gap-3 border-b bg-muted/30 p-4 md:w-56 md:border-b-0 md:border-r">
        <div className="px-2 text-lg font-semibold">{org.name}</div>
        <ResponsiveNav basePath={`/${orgSlug}/portal`} items={NAV_ITEMS} />
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
