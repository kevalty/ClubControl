import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LinkButton } from "@/components/ui/link-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MEMBER_STATUS_LABELS } from "@/lib/validations/member";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/validations/payment";
import { MiembroAcciones } from "@/app/[orgSlug]/dashboard/miembros/[memberId]/miembro-acciones";

export default async function MiembroDetallePage({
  params,
}: {
  params: Promise<{ orgSlug: string; memberId: string }>;
}) {
  const { orgSlug, memberId } = await params;
  const supabase = await createClient();

  const { data: member } = await supabase
    .from("members")
    .select(
      "id, organization_id, full_name, email, phone, document_id, birth_date, status, join_date, user_id, emergency_contact_name, emergency_contact_phone, notes"
    )
    .eq("id", memberId)
    .maybeSingle();

  if (!member) {
    notFound();
  }

  const { data: authData } = await supabase.auth.getUser();
  const { data: myMembership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", member.organization_id)
    .eq("user_id", authData.user?.id ?? "")
    .maybeSingle();

  const puedeEliminar = myMembership?.role === "owner" || myMembership?.role === "admin";

  const { data: memberships } = await supabase
    .from("memberships")
    .select("id, start_date, end_date, status, membership_plans(name)")
    .eq("member_id", memberId)
    .order("start_date", { ascending: false });

  const tieneMembresiaActiva = (memberships ?? []).some((m) => m.status === "active");

  const { data: payments } = await supabase
    .from("payments")
    .select("id, amount, method, status, created_at")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{member.full_name}</h1>
          <Badge className="mt-1">
            {MEMBER_STATUS_LABELS[member.status] ?? member.status}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <LinkButton
            href={`/${orgSlug}/dashboard/miembros/${memberId}/editar`}
            variant="outline"
          >
            Editar
          </LinkButton>
          <MiembroAcciones
            orgSlug={orgSlug}
            memberId={memberId}
            estado={member.status}
            tieneEmail={!!member.email}
            tieneAccesoPortal={!!member.user_id}
            puedeEliminar={puedeEliminar}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos personales</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-muted-foreground">Teléfono</div>
            <div>{member.phone}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Correo</div>
            <div>{member.email ?? "—"}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Cédula</div>
            <div>{member.document_id ?? "—"}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Fecha de nacimiento</div>
            <div>{member.birth_date ?? "—"}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Ingreso al club</div>
            <div>{member.join_date}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Contacto de emergencia</div>
            <div>
              {member.emergency_contact_name
                ? `${member.emergency_contact_name} (${member.emergency_contact_phone ?? "sin teléfono"})`
                : "—"}
            </div>
          </div>
          {member.notes ? (
            <div className="col-span-2">
              <div className="text-muted-foreground">Notas</div>
              <div>{member.notes}</div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Membresías</CardTitle>
        </CardHeader>
        <CardContent>
          {!memberships || memberships.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Este miembro todavía no tiene ninguna membresía asignada.
            </p>
          ) : (
            <ul className="divide-y">
              {memberships.map((m) => (
                <li key={m.id} className="flex items-center justify-between py-2 text-sm">
                  <span>
                    {(m.membership_plans as unknown as { name: string } | null)?.name ??
                      "Plan eliminado"}{" "}
                    <span className="text-muted-foreground">
                      ({m.start_date} – {m.end_date})
                    </span>
                  </span>
                  <Badge variant={m.status === "active" ? "default" : "secondary"}>
                    {m.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
          {!tieneMembresiaActiva ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Sin membresía activa.{" "}
              <LinkButton
                href={`/${orgSlug}/dashboard/pagos/nuevo`}
                variant="link"
                className="h-auto p-0"
              >
                Registrar un pago
              </LinkButton>{" "}
              le crea una al aprobarse.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pagos</CardTitle>
        </CardHeader>
        <CardContent>
          {!payments || payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Este miembro todavía no tiene pagos registrados.
            </p>
          ) : (
            <ul className="divide-y">
              {payments.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                  <span>
                    ${Number(p.amount).toFixed(2)} —{" "}
                    {PAYMENT_METHOD_LABELS[p.method] ?? p.method}{" "}
                    <span className="text-muted-foreground">
                      ({new Date(p.created_at).toLocaleDateString("es-EC")})
                    </span>
                  </span>
                  <Badge variant={p.status === "approved" ? "default" : "secondary"}>
                    {PAYMENT_STATUS_LABELS[p.status] ?? p.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Asistencia</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {/* TODO(Fase 4, módulo 8.7): historial real de attendance. */}
          El historial de asistencia estará disponible cuando se implemente
          el control de acceso por QR.
        </CardContent>
      </Card>
    </div>
  );
}
