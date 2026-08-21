import { test, expect } from "@playwright/test";

// Sección 7 (portal del miembro). Se crea el club/plan/miembro por REST con
// la service_role key (solo local) y se crea el auth.users del miembro
// directo vía Admin API con contraseña conocida (equivalente a que ya
// hubiera aceptado la invitación de "Generar acceso al portal" — ese flujo
// de invitación por correo ya reutiliza el mecanismo de
// /auth/actualizar-password, probado en tests/e2e/login.spec.ts). Esta
// prueba se enfoca en el portal en sí: login, estado de membresía, QR,
// registrar un pago propio, reservar una clase, editar el perfil.

const SUPABASE_URL = "http://127.0.0.1:54321";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
const headers = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

test("un miembro con acceso al portal puede iniciar sesión, ver su membresía, su QR, reservar una clase y editar su perfil", async ({
  page,
  request,
}) => {
  const suffix = Date.now();
  const orgSlug = `portal-test-${suffix}`;
  const memberEmail = `member-${suffix}@test.com`;
  const memberPassword = "password123";

  const org = await request
    .post(`${SUPABASE_URL}/rest/v1/organizations`, {
      headers,
      data: { slug: orgSlug, name: "Portal Test" },
    })
    .then((r) => r.json());

  const plan = await request
    .post(`${SUPABASE_URL}/rest/v1/membership_plans`, {
      headers,
      data: {
        organization_id: org[0].id,
        name: "Mensualidad",
        price: 25,
        billing_cycle: "monthly",
        duration_days: 30,
      },
    })
    .then((r) => r.json());

  // Usuario de auth para el miembro (equivalente a haber aceptado la invitación).
  const authUser = await request
    .post(`${SUPABASE_URL}/auth/v1/admin/users`, {
      headers,
      data: { email: memberEmail, password: memberPassword, email_confirm: true },
    })
    .then((r) => r.json());

  const member = await request
    .post(`${SUPABASE_URL}/rest/v1/members`, {
      headers,
      data: {
        organization_id: org[0].id,
        user_id: authUser.id,
        full_name: "Miembro Portal",
        phone: "0987654321",
        email: memberEmail,
        status: "active",
      },
    })
    .then((r) => r.json());

  await request.post(`${SUPABASE_URL}/rest/v1/memberships`, {
    headers,
    data: {
      organization_id: org[0].id,
      member_id: member[0].id,
      plan_id: plan[0].id,
      start_date: new Date().toISOString().slice(0, 10),
      end_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      status: "active",
    },
  });

  // Una clase que ocurra hoy, para poder reservarla desde el portal.
  const hoyIndex = new Date().getDay();
  const clase = await request
    .post(`${SUPABASE_URL}/rest/v1/classes`, {
      headers,
      data: {
        organization_id: org[0].id,
        name: "Spinning",
        capacity: 5,
        recurrence_rule: {
          days: [["sun", "mon", "tue", "wed", "thu", "fri", "sat"][hoyIndex]],
          start_time: "07:00",
          end_time: "08:00",
        },
      },
    })
    .then((r) => r.json());

  await request.post(`${SUPABASE_URL}/rest/v1/class_sessions`, {
    headers,
    data: {
      class_id: clase[0].id,
      organization_id: org[0].id,
      session_date: new Date().toISOString().slice(0, 10),
      start_time: "07:00",
      end_time: "08:00",
    },
  });

  // --- Login como el miembro ---
  await page.goto("/auth/login");
  await page.getByLabel("Correo electrónico").fill(memberEmail);
  await page.getByLabel("Contraseña").fill(memberPassword);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(new RegExp(`/${orgSlug}/portal$`));

  await expect(page.getByText("Mensualidad")).toBeVisible();
  await expect(page.getByText(/días restantes/)).toBeVisible();

  // Mi QR.
  await page.getByRole("link", { name: "Mi QR" }).click();
  await expect(page.getByAltText("Tu código QR de acceso")).toBeVisible();

  // Reservar la clase de hoy.
  await page.getByRole("link", { name: "Clases", exact: true }).click();
  await expect(page.getByText("Spinning")).toBeVisible();
  await page.getByRole("button", { name: "Reservar" }).click();
  await expect(page.getByRole("button", { name: "Cancelar reserva" })).toBeVisible();

  // Editar perfil.
  await page.getByRole("link", { name: "Mi perfil" }).click();
  await page.getByLabel("Contacto de emergencia").fill("Mamá");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByText("Datos actualizados.")).toBeVisible();

  await request.delete(`${SUPABASE_URL}/rest/v1/organizations?id=eq.${org[0].id}`, { headers });
});
