import Link from "next/link";
import { logout } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
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
      <aside className="flex shrink-0 flex-col gap-1 border-b bg-muted/30 p-4 md:w-56 md:border-b-0 md:border-r">
        <div className="mb-4 px-2 text-lg font-semibold">{org.name}</div>
        <nav className="flex flex-row flex-wrap gap-1 md:flex-col">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={`/${orgSlug}/portal${item.href ? `/${item.href}` : ""}`}
              className="whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <form action={logout} className="mt-auto pt-4">
          <Button type="submit" variant="ghost" size="sm" className="w-full">
            Cerrar sesión
          </Button>
        </form>
      </aside>
      <main className="flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
