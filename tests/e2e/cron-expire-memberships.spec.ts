import { test, expect } from "@playwright/test";

// Prueba de la regla de negocio CLAUDE.md §6.1 (job diario de vencimiento).
// No hay UI para esto (es un cron), así que se siembra el estado
// directamente contra la API REST de Supabase local con la service_role
// key (solo válida en este entorno de pruebas local, nunca en producción)
// y se llama al endpoint del cron como lo haría Vercel Cron.

const SUPABASE_URL = "http://127.0.0.1:54321";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
const CRON_SECRET = "dev-only-local-secret";

test("el cron de vencimientos marca como expired las membresías vencidas y al miembro sin otra activa", async ({
  request,
}) => {
  const headers = {
    apikey: SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };

  const suffix = Date.now();
  const org = await request
    .post(`${SUPABASE_URL}/rest/v1/organizations`, {
      headers,
      data: { slug: `cron-test-${suffix}`, name: "Cron Test" },
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

  const member = await request
    .post(`${SUPABASE_URL}/rest/v1/members`, {
      headers,
      data: {
        organization_id: org[0].id,
        full_name: "Miembro Vencido",
        phone: "0999999999",
        status: "active",
      },
    })
    .then((r) => r.json());

  const pastDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const olderDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  await request.post(`${SUPABASE_URL}/rest/v1/memberships`, {
    headers,
    data: {
      organization_id: org[0].id,
      member_id: member[0].id,
      plan_id: plan[0].id,
      start_date: olderDate,
      end_date: pastDate,
      status: "active",
    },
  });

  const cronResponse = await request.get("/api/cron/expire-memberships", {
    headers: { Authorization: `Bearer ${CRON_SECRET}` },
  });
  expect(cronResponse.ok()).toBeTruthy();
  const cronBody = await cronResponse.json();
  expect(cronBody.membershipsExpired).toBeGreaterThanOrEqual(1);
  expect(cronBody.membersExpired).toBeGreaterThanOrEqual(1);

  const updatedMember = await request
    .get(`${SUPABASE_URL}/rest/v1/members?id=eq.${member[0].id}`, { headers })
    .then((r) => r.json());
  expect(updatedMember[0].status).toBe("expired");

  const updatedMembership = await request
    .get(`${SUPABASE_URL}/rest/v1/memberships?member_id=eq.${member[0].id}`, {
      headers,
    })
    .then((r) => r.json());
  expect(updatedMembership[0].status).toBe("expired");

  // Limpieza: borrar la organización borra en cascada todo lo demás.
  await request.delete(`${SUPABASE_URL}/rest/v1/organizations?id=eq.${org[0].id}`, {
    headers,
  });
});

test("el cron rechaza llamadas sin CRON_SECRET", async ({ request }) => {
  const response = await request.get("/api/cron/expire-memberships");
  expect(response.status()).toBe(401);
});
