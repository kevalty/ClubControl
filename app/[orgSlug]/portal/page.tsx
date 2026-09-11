import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/link-button";
import { getCurrentMember } from "@/lib/portal/get-current-member";
import { MEMBER_STATUS_LABELS } from "@/lib/validations/member";

export default async function PortalHomePage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const { supabase, member } = await getCurrentMember(orgSlug);

  const { data: memberships } = await supabase
    .from("memberships")
    .select("end_date, status, membership_plans(name)")
    .eq("member_id", member.id)
    .order("end_date", { ascending: false });

  const activa = (memberships ?? []).find((m) => m.status === "active");
  const diasRestantes = activa
    ? Math.ceil(
        (new Date(activa.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold">Hola, {member.full_name.split(" ")[0]}</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tu membresía</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Badge>{MEMBER_STATUS_LABELS[member.status] ?? member.status}</Badge>
          {activa ? (
            <div className="text-sm">
              <p className="font-medium">
                {(activa.membership_plans as unknown as { name: string } | null)?.name}
              </p>
              <p className="text-muted-foreground">
                Vence el {activa.end_date}
                {diasRestantes !== null ? ` (${diasRestantes} días restantes)` : ""}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                No tienes una membresía activa en este momento.
              </p>
              <LinkButton href={`/${orgSlug}/portal/pagos`} size="sm">
                Registrar un pago
              </LinkButton>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Carnet digital */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mi carnet</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Muestra tu carnet con código QR para registrar tu asistencia.
          </p>
          <LinkButton
            href={`/${orgSlug}/carnet/${member.id}?token=${member.qr_code}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Ver mi carnet
          </LinkButton>
        </CardContent>
      </Card>
    </div>
  );
}
