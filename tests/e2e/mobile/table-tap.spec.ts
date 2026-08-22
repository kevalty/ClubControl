import { test, expect } from "@playwright/test";

// Regresión de un bug real: en un dispositivo táctil, tocar un link dentro
// de una tabla con scroll horizontal (overflow-x-auto) no navegaba — el
// contenedor de scroll "absorbía" el tap. Se arregló con `touch-pan-x` en
// components/ui/table.tsx. Esta prueba solo tiene sentido con emulación
// táctil real (--project=mobile); en Desktop Chrome (sin touch) siempre
// hubiera pasado, aunque el bug estuviera presente.

test("tocar el nombre de un miembro en la tabla navega a su detalle", async ({ page }) => {
  const suffix = Date.now();
  await page.goto("/auth/registro");
  await page.getByLabel("Nombre del club").fill(`Club Tap ${suffix}`);
  await page.getByLabel("Tu nombre").fill("Owner");
  await page.getByLabel("Correo electrónico").fill(`tap-${suffix}@test.com`);
  await page.getByLabel("Teléfono").fill("0999999999");
  await page.getByLabel("Contraseña").fill("password123");
  await page.getByRole("button", { name: "Crear mi club" }).click();
  await expect(page.getByText("Paso 1 de 3")).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByLabel("Nombre del plan").fill("Plan");
  await page.getByLabel("Precio (USD)").fill("30");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: "Saltar por ahora" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto(new URL(page.url()).pathname.replace(/\/dashboard$/, "/dashboard/miembros/nuevo"));
  await page.getByLabel("Nombre completo").fill("Miembro Tap");
  await page.getByLabel("Teléfono (WhatsApp)").fill("0987654321");
  await page.getByRole("button", { name: "Crear miembro" }).click();
  await expect(page).toHaveURL(/\/miembros$/);

  await page.getByRole("link", { name: "Miembro Tap" }).click();
  await expect(page).toHaveURL(/\/miembros\/[0-9a-f-]+$/);
  await expect(page.getByRole("heading", { name: "Miembro Tap" })).toBeVisible();
});
