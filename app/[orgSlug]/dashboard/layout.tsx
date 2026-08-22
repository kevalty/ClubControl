import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { ResponsiveNav } from "@/components/responsive-nav";

const NAV_ITEMS = [
  { href: "miembros", label: "Miembros" },
  { href: "planes", label: "Planes" },
  { href: "pagos", label: "Pagos" },
  { href: "asistencia", label: "Asistencia" },
  { href: "clases", label: "Clases" },
  { href: "configuracion/pagos", label: "Cuentas bancarias" },
  { href: "configuracion/whatsapp", label: "Plantillas WhatsApp" },
  { href: "whatsapp/anuncio", label: "Enviar anuncio" },
  { href: "configuracion/suscripcion", label: "Suscripción" },
];

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name")
    .eq("slug", orgSlug)
    .maybeSingle();

  if (!org) {
    notFound();
  }

  return (
    <div className="flex min-h-full flex-1 flex-col md:flex-row">
      <aside className="flex shrink-0 flex-col gap-3 border-b bg-muted/30 p-4 md:w-56 md:border-b-0 md:border-r">
        <div className="px-2 text-lg font-semibold">{org.name}</div>
        <ResponsiveNav basePath={`/${orgSlug}/dashboard`} items={NAV_ITEMS} />
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
