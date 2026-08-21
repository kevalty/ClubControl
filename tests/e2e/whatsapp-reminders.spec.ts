import { test, expect } from "@playwright/test";

// Módulo 8.6 + regla §6.2. Usa la API REST de Supabase local con la
// service_role key (solo válido en este entorno local) para sembrar datos
// sin pasar por la UI, y llama a los cron endpoints como lo haría Vercel.

const SUPABASE_URL = "http://127.0.0.1:54321";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
const CRON_SECRET = "dev-only-local-secret";
const headers = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

test("aprobar un pago agenda confirmación + recordatorios de vencimiento (§6.2), y el cron los procesa sin Twilio configurado", async ({
  request,
}) => {
  const suffix = Date.now();

  const org = await request
    .post(`${SUPABASE_URL}/rest/v1/organizations`, {
      headers,
      data: { slug: `wa-test-${suffix}`, name: "WA Test" },
    })
    .then((r) => r.json());

  const plan = await request
    .post(`${SUPABASE_URL}/rest/v1/membership_plans`, {
      headers,
      data: {
        organization_id: org[0].id,
        name: "Plan WA",
        price: 25,
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
        full_name: "Miembro WA",
        phone: "0987654321",
        status: "active",
      },
    })
    .then((r) => r.json());

  const payment = await request
    .post(`${SUPABASE_URL}/rest/v1/payments`, {
      headers,
      data: {
        organization_id: org[0].id,
        member_id: member[0].id,
        plan_id: plan[0].id,
        amount: 25,
        method: "cash",
        status: "pending_review",
      },
    })
    .then((r) => r.json());

  // Aprobar vía RPC (con service_role, auth.uid() es null, pero las
  // funciones son SECURITY INVOKER y no chequean auth.uid() para nada
  // salvo el "actor" del audit_log, que puede ser null).
  const approveResponse = await request.post(`${SUPABASE_URL}/rest/v1/rpc/approve_payment`, {
    headers,
    data: { p_payment_id: payment[0].id },
  });
  expect(approveResponse.ok()).toBeTruthy();

  const reminders = await request
    .get(
      `${SUPABASE_URL}/rest/v1/payment_reminders?member_id=eq.${member[0].id}&order=scheduled_at.asc`,
      { headers }
    )
    .then((r) => r.json());

  // confirmacion_pago (inmediato) + 2 recordatorio_previo + 3 recordatorio_vencido = 6
  expect(reminders.length).toBe(6);
  expect(reminders.filter((r: { template_key: string }) => r.template_key === "confirmacion_pago").length).toBe(1);
  expect(reminders.filter((r: { template_key: string }) => r.template_key === "recordatorio_previo").length).toBe(2);
  expect(reminders.filter((r: { template_key: string }) => r.template_key === "recordatorio_vencido").length).toBe(3);
  expect(reminders.every((r: { status: string }) => r.status === "scheduled")).toBe(true);

  // Procesar con el cron: solo la confirmación de pago tiene scheduled_at
  // <= ahora (las demás son a futuro), así que debería procesar 1.
  const cronResponse = await request.get("/api/cron/reminders", {
    headers: { Authorization: `Bearer ${CRON_SECRET}` },
  });
  expect(cronResponse.ok()).toBeTruthy();
  const cronBody = await cronResponse.json();
  expect(cronBody.processed).toBeGreaterThanOrEqual(1);

  // Sin TWILIO_* configurado en este entorno, el envío debe fallar
  // "silenciosamente" (CLAUDE.md §8.6) — no debe tirar 500, y el
  // recordatorio debe quedar en 'failed' con un error_message legible.
  const confirmacion = await request
    .get(
      `${SUPABASE_URL}/rest/v1/payment_reminders?member_id=eq.${member[0].id}&template_key=eq.confirmacion_pago`,
      { headers }
    )
    .then((r) => r.json());
  expect(confirmacion[0].status).toBe("failed");
  expect(confirmacion[0].error_message).toContain("Twilio");

  await request.delete(`${SUPABASE_URL}/rest/v1/organizations?id=eq.${org[0].id}`, {
    headers,
  });
});

test("editar una plantilla y enviar un anuncio manual desde la UI", async ({ page }) => {
  const suffix = Date.now();
  const email = `owner-wa-ui-${suffix}@test.com`;

  await page.goto("/auth/registro");
  await page.getByLabel("Nombre del club").fill(`Club WA UI ${suffix}`);
  await page.getByLabel("Tu nombre").fill("Owner de Prueba");
  await page.getByLabel("Correo electrónico").fill(email);
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

  // Editar la plantilla de bienvenida.
  await page.getByRole("link", { name: "Plantillas WhatsApp" }).click();
  await expect(page.getByText("Bienvenida", { exact: true })).toBeVisible();
  const primerTextarea = page.locator("textarea").first();
  await primerTextarea.fill("Hola {{nombre}}, bienvenido a {{club}}!");
  await page.getByRole("button", { name: "Guardar" }).first().click();
  await expect(page.getByText("Guardado.").first()).toBeVisible();

  // Crear un miembro activo para poder enviarle el anuncio.
  await page.getByRole("link", { name: "Miembros", exact: true }).click();
  await page.getByRole("link", { name: "Crea el primero" }).click();
  await page.getByLabel("Nombre completo").fill("Destinatario Anuncio");
  await page.getByLabel("Teléfono (WhatsApp)").fill("0987654321");
  await page.getByRole("button", { name: "Crear miembro" }).click();
  await expect(page).toHaveURL(/\/miembros$/);

  // Enviar anuncio manual (sin Twilio configurado, se espera que reporte
  // el resultado sin tirar error 500 — el "fallo silencioso" es el
  // comportamiento esperado según CLAUDE.md §8.6).
  await page.getByRole("link", { name: "Enviar anuncio" }).click();
  await page.getByLabel("Mensaje").fill("Recordatorio: mañana no hay clases.");
  await page.getByRole("button", { name: "Enviar anuncio" }).click();
  await expect(page.getByText(/Enviado a \d+ de \d+ miembros/)).toBeVisible();
});
