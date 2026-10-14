import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Landmark, MessageCircle, Megaphone, Settings, MapPin, Tag, Users, CreditCard,
} from "lucide-react";

const sections = [
  { href: "configuracion/pagos",       label: "Cuentas bancarias",  icon: Landmark,     desc: "Datos bancarios para recibir transferencias" },
  { href: "configuracion/whatsapp",    label: "WhatsApp",           icon: MessageCircle, desc: "Conectar tu número de WhatsApp Business" },
  { href: "whatsapp/anuncio",          label: "Enviar anuncio",     icon: Megaphone,     desc: "Mensaje masivo a todos los miembros activos" },
  { href: "configuracion/suscripcion", label: "Suscripción",        icon: Settings,      desc: "Plan de GestorClub y facturación" },
  { href: "configuracion/sedes",       label: "Sedes",              icon: MapPin,        desc: "Ubicaciones y sucursales del club" },
  { href: "configuracion/rubros",      label: "Rubros / Conceptos", icon: Tag,           desc: "Conceptos de pago personalizados" },
  { href: "configuracion/familias",    label: "Grupos familiares",  icon: Users,         desc: "Asociar miembros en grupos de familia" },
  { href: "facturacion",               label: "Facturación",        icon: CreditCard,    desc: "Historial de pagos de la suscripción" },
];

export default async function ConfiguracionPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const supabase = await createClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .maybeSingle();
  if (!org) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Configuración</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map(({ href, label, icon: Icon, desc }) => (
          <Link
            key={href}
            href={`/${orgSlug}/dashboard/${href}`}
            className="group flex items-start gap-4 rounded-2xl border border-[#1a1a2e] bg-[#111120] p-5 transition-all hover:border-[#2a2a4e] hover:bg-[#14142a]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[rgba(99,102,241,0.12)] group-hover:bg-[rgba(99,102,241,0.2)] transition-colors">
              <Icon className="size-5 text-[#818cf8]" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-[#e5e7eb] group-hover:text-white text-sm">{label}</p>
              <p className="mt-0.5 text-xs text-[#6b7280]">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
