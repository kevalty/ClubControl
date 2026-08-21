import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

// Endpoint PÚBLICO (sin sesión) para el check-in por QR desde el "modo
// kiosco" (CLAUDE.md §8.7): el código QR de 32 hex chars generado por
// gen_random_bytes(16) hace de credencial — es infeasible de adivinar, así
// que es razonable tratarlo como autorización suficiente para esta acción
// puntual y acotada (solo insertar UNA fila de attendance si la membresía
// está vigente). Por eso usa el service-role client: `anon` no tiene
// ningún grant en las tablas (CLAUDE.md §11.1, defensa en profundidad), y
// aquí sí necesitamos leer/escribir sin sesión de usuario.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  const { orgSlug } = await params;
  const body = await request.json().catch(() => null);
  const qrCode = typeof body?.qrCode === "string" ? body.qrCode.trim() : "";

  if (!qrCode) {
    return NextResponse.json({ ok: false, message: "Código QR inválido." }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .maybeSingle();

  if (!org) {
    return NextResponse.json({ ok: false, message: "Club no encontrado." }, { status: 404 });
  }

  const { data: member } = await supabase
    .from("members")
    .select("id, full_name, status")
    .eq("organization_id", org.id)
    .eq("qr_code", qrCode)
    .maybeSingle();

  if (!member) {
    return NextResponse.json({ ok: false, message: "Código QR no reconocido." });
  }

  // CLAUDE.md §6.5: solo permite el check-in si member.status = 'active' y
  // tiene una membership vigente (status = 'active' y end_date >= hoy).
  if (member.status !== "active") {
    return NextResponse.json({
      ok: false,
      message: `Membresía vencida, contacta a recepción.`,
      memberName: member.full_name,
    });
  }

  const today = new Date().toISOString().slice(0, 10);
  const { count } = await supabase
    .from("memberships")
    .select("id", { count: "exact", head: true })
    .eq("member_id", member.id)
    .eq("status", "active")
    .gte("end_date", today);

  if (!count) {
    return NextResponse.json({
      ok: false,
      message: "Membresía vencida, contacta a recepción.",
      memberName: member.full_name,
    });
  }

  await supabase.from("attendance").insert({
    organization_id: org.id,
    member_id: member.id,
    method: "qr",
    checked_in_by: null,
  });

  return NextResponse.json({ ok: true, memberName: member.full_name });
}
