import { test, expect } from "@playwright/test";

// CLAUDE.md §4: "Solo owner/admin pueden aprobar o rechazar comprobantes
// de pago." Un usuario con rol `staff` se siembra directo (organization_members
// vía REST con service_role — igual que el flujo real de invitación de
// 8.9, que ya termina en una fila de organization_members) y se prueba que
// la base de datos (RLS) rechaza la aprobación aunque intente llamarla
// directo, no solo que el botón esté oculto en la UI.

const SUPABASE_URL = "http://127.0.0.1:54321";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
const headers = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

test("un staff no puede aprobar un pago (solo owner/admin) aunque llame la función directo", async ({
  page,
  request,
}) => {
  const suffix = Date.now();
  const staffEmail = `staff-${suffix}@test.com`;
  const staffPassword = "password123";

  const org = await request
    .post(`${SUPABASE_URL}/rest/v1/organizations`, {
      headers,
      data: { slug: `rbac-test-${suffix}`, name: "RBAC Test" },
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
      data: { organization_id: org[0].id, full_name: "Miembro RBAC", phone: "0999999999" },
    })
    .then((r) => r.json());

  const payment = await request
    .post(`${SUPABASE_URL}/rest/v1/payments`, {
      headers,
      data: {
        organization_id: org[0].id,
        member_id: member[0].id,
        plan_id: plan[0].id,
        amount: 20,
        method: "cash",
      },
    })
    .then((r) => r.json());

  // Usuario staff real (equivalente a haber aceptado una invitación de 8.9).
  const staffUser = await request
    .post(`${SUPABASE_URL}/auth/v1/admin/users`, {
      headers,
      data: { email: staffEmail, password: staffPassword, email_confirm: true },
    })
    .then((r) => r.json());
  await request.post(`${SUPABASE_URL}/rest/v1/organization_members`, {
    headers,
    data: { organization_id: org[0].id, user_id: staffUser.id, role: "staff", status: "active" },
  });

  await page.goto("/auth/login");
  await page.getByLabel("Correo electrónico").fill(staffEmail);
  await page.getByLabel("Contraseña").fill(staffPassword);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(new RegExp(`/${org[0].slug}/dashboard$`));

  // Intenta aprobar el pago como este staff, por la vía legítima real (el
  // mismo botón que usaría cualquier usuario) — RLS debe rechazarlo dentro
  // de approve_payment() aunque la UI muestre el botón.
  await page.goto(`/${org[0].slug}/dashboard/pagos`);
  await page.getByRole("button", { name: "Aprobar" }).click();
  await page.waitForTimeout(1000);

  const paymentAfter = await request
    .get(`${SUPABASE_URL}/rest/v1/payments?id=eq.${payment[0].id}`, { headers })
    .then((r) => r.json());
  expect(paymentAfter[0].status).toBe("pending_review");

  await request.delete(`${SUPABASE_URL}/rest/v1/organizations?id=eq.${org[0].id}`, { headers });
});
