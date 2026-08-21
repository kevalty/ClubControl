import { test, expect } from "@playwright/test";

// Módulo 8.7 + regla §6.5. El endpoint /api/checkin/[orgSlug] es público
// (sin sesión, CLAUDE.md §8.7 "modo kiosco") — se prueba llamándolo
// directo, como lo haría la cámara del kiosco tras decodificar un QR.
// Los datos se siembran vía REST con la service_role key (solo local).

const SUPABASE_URL = "http://127.0.0.1:54321";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
const headers = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

test("un miembro con membresía vigente puede hacer check-in por QR; uno sin membresía es rechazado", async ({
  request,
}) => {
  const suffix = Date.now();
  const orgSlug = `checkin-test-${suffix}`;

  const org = await request
    .post(`${SUPABASE_URL}/rest/v1/organizations`, {
      headers,
      data: { slug: orgSlug, name: "Checkin Test" },
    })
    .then((r) => r.json());

  const plan = await request
    .post(`${SUPABASE_URL}/rest/v1/membership_plans`, {
      headers,
      data: {
        organization_id: org[0].id,
        name: "Plan",
        price: 20,
        billing_cycle: "monthly",
        duration_days: 30,
      },
    })
    .then((r) => r.json());

  // Miembro CON membresía vigente.
  const miembroActivo = await request
    .post(`${SUPABASE_URL}/rest/v1/members`, {
      headers,
      data: {
        organization_id: org[0].id,
        full_name: "Miembro Activo",
        phone: "0999999001",
        status: "active",
      },
    })
    .then((r) => r.json());

  await request.post(`${SUPABASE_URL}/rest/v1/memberships`, {
    headers,
    data: {
      organization_id: org[0].id,
      member_id: miembroActivo[0].id,
      plan_id: plan[0].id,
      start_date: new Date().toISOString().slice(0, 10),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      status: "active",
    },
  });

  // Miembro SIN membresía vigente (status expired).
  const miembroVencido = await request
    .post(`${SUPABASE_URL}/rest/v1/members`, {
      headers,
      data: {
        organization_id: org[0].id,
        full_name: "Miembro Vencido",
        phone: "0999999002",
        status: "expired",
      },
    })
    .then((r) => r.json());

  const checkinActivo = await request.post(`/api/checkin/${orgSlug}`, {
    data: { qrCode: miembroActivo[0].qr_code },
  });
  expect(checkinActivo.ok()).toBeTruthy();
  const bodyActivo = await checkinActivo.json();
  expect(bodyActivo.ok).toBe(true);
  expect(bodyActivo.memberName).toBe("Miembro Activo");

  const checkinVencido = await request.post(`/api/checkin/${orgSlug}`, {
    data: { qrCode: miembroVencido[0].qr_code },
  });
  expect(checkinVencido.ok()).toBeTruthy();
  const bodyVencido = await checkinVencido.json();
  expect(bodyVencido.ok).toBe(false);
  expect(bodyVencido.message).toContain("vencida");

  const checkinInvalido = await request.post(`/api/checkin/${orgSlug}`, {
    data: { qrCode: "codigo-que-no-existe" },
  });
  const bodyInvalido = await checkinInvalido.json();
  expect(bodyInvalido.ok).toBe(false);

  // Confirmar que SOLO se registró 1 asistencia (la del miembro activo).
  const asistencias = await request
    .get(`${SUPABASE_URL}/rest/v1/attendance?organization_id=eq.${org[0].id}`, { headers })
    .then((r) => r.json());
  expect(asistencias.length).toBe(1);
  expect(asistencias[0].member_id).toBe(miembroActivo[0].id);

  await request.delete(`${SUPABASE_URL}/rest/v1/organizations?id=eq.${org[0].id}`, { headers });
});
