import { test, expect } from "@playwright/test";

// Módulos 8.11 (suscripción del club) y 8.12 (panel super-admin). Se crea
// un club real vía UI (para tener un owner de verdad), y un platform_admin
// sembrado por REST (no hay flujo de alta pública para esto — es correcto,
// CLAUDE.md no pide una pantalla de registro de super-admins).

const SUPABASE_URL = "http://127.0.0.1:54321";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
const headers = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

test("un owner puede registrar el pago de su suscripción, y un platform_admin puede aprobarlo y ver el club en /admin", async ({
  page,
  request,
}) => {
  const suffix = Date.now();
  const ownerEmail = `owner-admin-${suffix}@test.com`;
  const adminEmail = `platformadmin-${suffix}@test.com`;
  const adminPassword = "password123";

  // --- Crear el club vía UI (flujo real de 8.1) ---
  await page.goto("/auth/registro");
  await page.getByLabel("Nombre del club").fill(`Club Admin ${suffix}`);
  await page.getByLabel("Tu nombre").fill("Owner de Prueba");
  await page.getByLabel("Correo electrónico").fill(ownerEmail);
  await page.getByLabel("Teléfono").fill("0999999999");
  await page.getByLabel("Contraseña").fill("password123");
  await page.getByRole("button", { name: "Crear mi club" }).click();
  await expect(page.getByText("Paso 1 de 3")).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByLabel("Nombre del plan").fill("Mensualidad full");
  await page.getByLabel("Precio (USD)").fill("30");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: "Saltar por ahora" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  const orgSlug = new URL(page.url()).pathname.split("/")[1];

  // --- Owner registra el pago de su suscripción SaaS (8.11) ---
  await page.getByRole("link", { name: "Suscripción" }).click();
  await page.getByLabel("Plan").click();
  await page.getByRole("option").first().click();
  await page.getByLabel("Monto transferido (USD)").fill("25");
  await page.getByRole("button", { name: "Registrar pago" }).click();
  await expect(page.getByText("Pago registrado.")).toBeVisible();

  await page.getByRole("button", { name: "Cerrar sesión" }).click();

  // --- Crear el platform_admin (sembrado, sin UI de alta) ---
  const adminUser = await request
    .post(`${SUPABASE_URL}/auth/v1/admin/users`, {
      headers,
      data: { email: adminEmail, password: adminPassword, email_confirm: true },
    })
    .then((r) => r.json());
  await request.post(`${SUPABASE_URL}/rest/v1/platform_admins`, {
    headers,
    data: { id: adminUser.id },
  });

  // --- Login como platform_admin: debe caer directo en /admin ---
  await page.goto("/auth/login");
  await page.getByLabel("Correo electrónico").fill(adminEmail);
  await page.getByLabel("Contraseña").fill(adminPassword);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/admin$/);

  // Ver el club en la lista.
  await page.getByRole("link", { name: "Clubes" }).click();
  await expect(page.getByText(`Club Admin ${suffix}`)).toBeVisible();

  // Aprobar el pago de suscripción pendiente (la fila de ESTE club — el
  // listado incluye pagos de otras corridas de pruebas anteriores).
  await page.getByRole("link", { name: "Pagos" }).click();
  const filaPago = page.getByRole("row", { name: new RegExp(`Club Admin ${suffix}`) });
  await expect(filaPago).toBeVisible();
  await filaPago.getByRole("button", { name: "Aprobar" }).click();
  await expect(page.getByText("Pago aprobado.")).toBeVisible();
  await expect(filaPago.getByText("Aprobado")).toBeVisible();

  // Suspender el club y verificar el cambio de estado.
  await page.getByRole("link", { name: "Clubes" }).click();
  const filaClub = page.getByRole("row", { name: new RegExp(`Club Admin ${suffix}`) });
  await filaClub.getByRole("button", { name: "Suspender" }).click();
  await expect(filaClub.getByText("Suspendido")).toBeVisible();
});
