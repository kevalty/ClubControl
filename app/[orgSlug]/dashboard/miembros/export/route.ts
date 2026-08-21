import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MEMBER_STATUS_LABELS } from "@/lib/validations/member";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  const { orgSlug } = await params;
  const q = request.nextUrl.searchParams.get("q");
  const estado = request.nextUrl.searchParams.get("estado");

  const supabase = await createClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .single();

  if (!org) {
    return new NextResponse("Club no encontrado", { status: 404 });
  }

  let query = supabase
    .from("members")
    .select("full_name, phone, email, document_id, status, join_date")
    .eq("organization_id", org.id)
    .order("full_name", { ascending: true });

  if (q) {
    query = query.or(
      `full_name.ilike.%${q}%,phone.ilike.%${q}%,document_id.ilike.%${q}%`
    );
  }
  if (estado && estado !== "todos") {
    query = query.eq("status", estado);
  }

  const { data: miembros, error } = await query;

  if (error) {
    return new NextResponse("No se pudo generar el archivo.", { status: 500 });
  }

  const header = ["Nombre", "Teléfono", "Correo", "Cédula", "Estado", "Ingreso"];
  const rows = (miembros ?? []).map((m) => [
    m.full_name,
    m.phone,
    m.email ?? "",
    m.document_id ?? "",
    MEMBER_STATUS_LABELS[m.status] ?? m.status,
    m.join_date,
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map((cell) => csvEscape(String(cell))).join(","))
    .join("\r\n");

  // BOM UTF-8 para que Excel en Windows reconozca acentos correctamente.
  const csvWithBom = "﻿" + csv;

  return new NextResponse(csvWithBom, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="miembros-${orgSlug}.csv"`,
    },
  });
}
