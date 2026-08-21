import { test, expect } from "@playwright/test";

// Flujo principal del módulo 8.5 (cobros) + reglas de negocio §6.3/§6.4:
// registra un club, agrega una cuenta bancaria, crea un miembro sin
// membresía, le registra un pago de un plan nuevo, lo aprueba y verifica
// que se creó la membresía y el miembro pasó a 'Activo'. Luego registra un
// segundo pago y lo rechaza, verificando que el estado quede en Rechazado.

test("registrar y aprobar un pago crea la membresía y activa al miembro", async ({
  page,
}) => {
  const suffix = Date.now();
  const email = `owner-pagos-${suffix}@test.com`;

  await page.goto("/auth/registro");
  await page.getByLabel("Nombre del club").fill(`Club Pagos ${suffix}`);
  await page.getByLabel("Tu nombre").fill("Owner de Prueba");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Teléfono").fill("0999999999");
  await page.getByLabel("Contraseña").fill("password123");
  await page.getByRole("button", { name: "Crear mi club" }).click();

  await expect(page.getByText("Paso 1 de 3")).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByText("Paso 2 de 3")).toBeVisible();
  await page.getByLabel("Nombre del plan").fill("Mensualidad full");
  await page.getByLabel("Precio (USD)").fill("30");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: "Saltar por ahora" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  // Agregar cuenta bancaria (8.5, paso 1).
  await page.getByRole("link", { name: "Cuentas bancarias" }).click();
  await page.getByLabel("Banco").fill("Banco Pichincha");
  await page.getByLabel("Número de cuenta").fill("2201234567");
  await page.getByLabel("Nombre del titular").fill("Owner de Prueba");
  await page.getByLabel("Cédula / RUC del titular").fill("1712345678");
  await page.getByRole("button", { name: "Agregar cuenta" }).click();
  await expect(page.getByText("Banco Pichincha")).toBeVisible();

  // Crear miembro sin membresía.
  await page.getByRole("link", { name: "Miembros", exact: true }).click();
  await page.getByRole("link", { name: "Crea el primero" }).click();
  await page.getByLabel("Nombre completo").fill("Carlos Ruiz");
  await page.getByLabel("Teléfono (WhatsApp)").fill("0987654321");
  await page.getByRole("button", { name: "Crear miembro" }).click();
  await expect(page).toHaveURL(/\/miembros$/);

  // Registrar pago (plan nuevo).
  await page.getByRole("link", { name: "Pagos", exact: true }).click();
  await page.getByRole("link", { name: "Registrar pago" }).click();
  await page.getByLabel("Miembro").click();
  await page.getByRole("option", { name: "Carlos Ruiz" }).click();
  await page.getByLabel("Plan", { exact: true }).click();
  await page.getByRole("option", { name: /Mensualidad full/ }).click();
  await page.getByLabel("Monto (USD)").fill("30");
  await page.getByRole("button", { name: "Registrar pago" }).click();

  await expect(page).toHaveURL(/\/pagos$/);
  await expect(page.getByText("Carlos Ruiz")).toBeVisible();
  await expect(page.getByText("Pendiente de revisión")).toBeVisible();

  // Aprobar.
  await page.getByRole("button", { name: "Aprobar" }).click();
  await expect(page.getByText("Membresía actualizada")).toBeVisible();
  await expect(page.getByText("Aprobado")).toBeVisible();

  // Verificar que el miembro quedó activo con su membresía.
  await page.getByRole("link", { name: "Miembros", exact: true }).click();
  await page.getByRole("link", { name: "Carlos Ruiz" }).click();
  await expect(page.getByText("Activo").first()).toBeVisible();
  await expect(page.getByText("Mensualidad full")).toBeVisible();
});

test("rechazar un pago lo deja en estado Rechazado sin crear membresía", async ({
  page,
}) => {
  const suffix = Date.now();
  const email = `owner-rechazo-${suffix}@test.com`;

  await page.goto("/auth/registro");
  await page.getByLabel("Nombre del club").fill(`Club Rechazo ${suffix}`);
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

  await page.getByRole("link", { name: "Miembros", exact: true }).click();
  await page.getByRole("link", { name: "Crea el primero" }).click();
  await page.getByLabel("Nombre completo").fill("Ana Torres");
  await page.getByLabel("Teléfono (WhatsApp)").fill("0987654322");
  await page.getByRole("button", { name: "Crear miembro" }).click();

  await page.getByRole("link", { name: "Pagos", exact: true }).click();
  await page.getByRole("link", { name: "Registrar pago" }).click();
  await page.getByLabel("Miembro").click();
  await page.getByRole("option", { name: "Ana Torres" }).click();
  await page.getByLabel("Plan", { exact: true }).click();
  await page.getByRole("option", { name: /Mensualidad full/ }).click();
  await page.getByLabel("Monto (USD)").fill("30");
  await page.getByRole("button", { name: "Registrar pago" }).click();

  await page.getByRole("button", { name: "Rechazar" }).click();
  await page.getByRole("button", { name: "Sí, rechazar" }).click();
  await expect(page.getByText("Rechazado")).toBeVisible();
});
