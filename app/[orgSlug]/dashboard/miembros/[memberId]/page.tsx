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
import { QrCodeCard } from "@/app/[orgSlug]/dashboard/miembros/[memberId]/qr-code-card";

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
      "id, organization_id, full_name, email, phone, document_id, birth_date, status, join_date, user_id, school, grade, notes, qr_code, location_id, fee_type_id"
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

  const userRole = myMembership?.role ?? "staff";
  const puedeEliminar = userRole === "owner" || userRole === "admin";
  const isTrainer = userRole === "trainer";

  const [
    { data: memberships },
    paymentsResult,
    { data: medicalInfo },
    { data: representatives },
    { data: locationData },
    { data: feeTypeData },
  ] = await Promise.all([
    supabase
      .from("memberships")
      .select("id, start_date, end_date, status, membership_plans(name)")
      .eq("member_id", memberId)
      .order("start_date", { ascending: false }),
    isTrainer
      ? Promise.resolve({ data: null })
      : supabase
          .from("payments")
          .select("id, amount, method, status, created_at")
          .eq("member_id", memberId)
          .order("created_at", { ascending: false }),
    supabase
      .from("member_medical_info")
      .select("blood_type, allergies, conditions, medications, notes")
      .eq("member_id", memberId)
      .maybeSingle(),
    supabase
      .from("member_representatives")
      .select("id, full_name, relationship, phone, email, document_id, is_primary")
      .eq("member_id", memberId)
      .order("is_primary", { ascending: false }),
    member.location_id
      ? supabase
          .from("locations")
          .select("name")
          .eq("id", member.location_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    member.fee_type_id
      ? supabase
          .from("fee_types")
          .select("name, discount_percent")
          .eq("id", member.fee_type_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const payments = paymentsResult.data;

  const tieneMembresiaActiva = (memberships ?? []).some(
    (m) => m.status === "active"
  );

  const hasMedical =
    medicalInfo &&
    (medicalInfo.blood_type ||
      medicalInfo.allergies ||
      medicalInfo.conditions ||
      medicalInfo.medications ||
      medicalInfo.notes);

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
          <LinkButton
            href={`/${orgSlug}/carnet/${memberId}?token=${member.qr_code}`}
            variant="outline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Ver carnet
          </LinkButton>
          <MiembroAcciones
            orgSlug={orgSlug}
            memberId={memberId}
            estado={member.status}
            tieneEmail={!!member.email}
            tieneAccesoPortal={!!member.user_id}
            puedeEliminar={puedeEliminar}
            tieneRepresentante={
              !!(representatives && representatives.length > 0 && representatives[0].phone)
            }
          />
        </div>
      </div>

      {/* ===== DATOS PERSONALES ===== */}
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
          {member.school ? (
            <div>
              <div className="text-muted-foreground">Unidad educativa</div>
              <div>{member.school}</div>
            </div>
          ) : null}
          {member.grade ? (
            <div>
              <div className="text-muted-foreground">Curso / Año</div>
              <div>{member.grade}</div>
            </div>
          ) : null}
          {locationData ? (
            <div>
              <div className="text-muted-foreground">Sede</div>
              <div>{locationData.name}</div>
            </div>
          ) : null}
          {feeTypeData ? (
            <div>
              <div className="text-muted-foreground">Rubro / Tarifa</div>
              <div>
                {feeTypeData.name} ({feeTypeData.discount_percent}% desc.)
              </div>
            </div>
          ) : null}
          {member.notes ? (
            <div className="col-span-2">
              <div className="text-muted-foreground">Notas</div>
              <div>{member.notes}</div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* ===== DATOS MÉDICOS ===== */}
      {hasMedical ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Información médica</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm">
            {medicalInfo.blood_type ? (
              <div>
                <div className="text-muted-foreground">Tipo de sangre</div>
                <div>{medicalInfo.blood_type}</div>
              </div>
            ) : null}
            {medicalInfo.allergies ? (
              <div className="col-span-2">
                <div className="text-muted-foreground">Alergias</div>
                <div>{medicalInfo.allergies}</div>
              </div>
            ) : null}
            {medicalInfo.conditions ? (
              <div className="col-span-2">
                <div className="text-muted-foreground">Condiciones médicas</div>
                <div>{medicalInfo.conditions}</div>
              </div>
            ) : null}
            {medicalInfo.medications ? (
              <div className="col-span-2">
                <div className="text-muted-foreground">Medicamentos</div>
                <div>{medicalInfo.medications}</div>
              </div>
            ) : null}
            {medicalInfo.notes ? (
              <div className="col-span-2">
                <div className="text-muted-foreground">Notas médicas</div>
                <div>{medicalInfo.notes}</div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {/* ===== REPRESENTANTES ===== */}
      {representatives && representatives.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Representantes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {representatives.map((rep) => (
              <div key={rep.id} className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-muted-foreground">
                    Nombre{rep.is_primary ? " (principal)" : ""}
                  </div>
                  <div>{rep.full_name}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Parentesco</div>
                  <div>{rep.relationship}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Teléfono</div>
                  <div>{rep.phone}</div>
                </div>
                {rep.email ? (
                  <div>
                    <div className="text-muted-foreground">Correo</div>
                    <div>{rep.email}</div>
                  </div>
                ) : null}
                {rep.document_id ? (
                  <div>
                    <div className="text-muted-foreground">Cédula</div>
                    <div>{rep.document_id}</div>
                  </div>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <QrCodeCard qrCode={member.qr_code} />

      {/* ===== MEMBRESÍAS ===== */}
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
                <li
                  key={m.id}
                  className="flex items-center justify-between py-2 text-sm"
                >
                  <span>
                    {(
                      m.membership_plans as unknown as { name: string } | null
                    )?.name ?? "Plan eliminado"}{" "}
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

      {/* ===== PAGOS (oculto para entrenadores) ===== */}
      {!isTrainer ? (
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
                  <li
                    key={p.id}
                    className="flex items-center justify-between py-2 text-sm"
                  >
                    <span>
                      ${Number(p.amount).toFixed(2)} —{" "}
                      {PAYMENT_METHOD_LABELS[p.method] ?? p.method}{" "}
                      <span className="text-muted-foreground">
                        ({new Date(p.created_at).toLocaleDateString("es-EC")})
                      </span>
                    </span>
                    <Badge
                      variant={p.status === "approved" ? "default" : "secondary"}
                    >
                      {PAYMENT_STATUS_LABELS[p.status] ?? p.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ) : null}

      {/* ===== ASISTENCIA ===== */}
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
