import { test, expect } from "@playwright/test";

// Flujo principal del módulo 8.1 (registro/onboarding) + 8.4 (planes).
// Corre contra el Supabase LOCAL (Docker). Genera datos únicos por corrida
// para poder repetirse sin resetear la base de datos entre ejecuciones.

test("un club nuevo se registra, completa el onboarding y ve su primer plan", async ({
  page,
}) => {
  const suffix = Date.now();
  const nombreClub = `Club Playwright ${suffix}`;
  const email = `owner-${suffix}@test.com`;

  await page.goto("/auth/registro");
  await page.getByLabel("Nombre del club").fill(nombreClub);
  await page.getByLabel("Tu nombre").fill("Owner de Prueba");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Teléfono").fill("0999999999");
  await page.getByLabel("Contraseña").fill("password123");
  await page.getByRole("button", { name: "Crear mi club" }).click();

  // Paso 1 del wizard: datos del club. Timeout generoso: primer hit tras
  // levantar el server de dev implica compilar la ruta on-demand (Turbopack).
  await expect(page.getByText("Paso 1 de 3")).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: "Continuar" }).click();

  // Paso 2: crear el primer plan de membresía.
  await expect(page.getByText("Paso 2 de 3")).toBeVisible();
  await page.getByLabel("Nombre del plan").fill("Mensualidad full");
  await page.getByLabel("Precio (USD)").fill("30");
  await page.getByRole("button", { name: "Continuar" }).click();

  // Paso 3: invitar staff — se salta (es opcional según CLAUDE.md 8.1).
  await expect(page.getByText("Paso 3 de 3")).toBeVisible();
  await page.getByRole("button", { name: "Saltar por ahora" }).click();

  // Debe terminar en el dashboard del club.
  await expect(page).toHaveURL(/\/dashboard$/);

  // El plan creado en el onboarding debe verse en /planes.
  await page.getByRole("link", { name: "Planes de membresía" }).click();
  await expect(page.getByText("Mensualidad full")).toBeVisible();
  await expect(page.getByText("$30.00")).toBeVisible();
});
