import { test, expect } from "@playwright/test";

// Flujo principal del módulo 8.3 (gestión de miembros). Registra un club
// nuevo (reutilizando el flujo de 8.1) para tener un dashboard limpio, y
// desde ahí prueba crear, buscar, congelar/reactivar y ver el detalle de
// un miembro.

test("crear un miembro, buscarlo, ver su detalle y congelar/reactivar su membresía", async ({
  page,
}) => {
  const suffix = Date.now();
  const nombreClub = `Club Miembros ${suffix}`;
  const email = `owner-miembros-${suffix}@test.com`;

  await page.goto("/auth/registro");
  await page.getByLabel("Nombre del club").fill(nombreClub);
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
  await expect(page.getByText("Paso 3 de 3")).toBeVisible();
  await page.getByRole("button", { name: "Saltar por ahora" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  // Crear un miembro.
  await page.getByRole("link", { name: "Miembros", exact: true }).click();
  await page.getByRole("link", { name: "Crea el primero" }).click();
  await page.getByLabel("Nombre completo").fill("María Pérez");
  await page.getByLabel("Teléfono (WhatsApp)").fill("0987654321");
  await page.getByRole("button", { name: "Crear miembro" }).click();

  await expect(page).toHaveURL(/\/miembros$/);
  await expect(page.getByText("María Pérez")).toBeVisible();

  // Buscar por nombre.
  await page.getByPlaceholder("Buscar por nombre, teléfono o cédula").fill("María");
  await page.getByRole("button", { name: "Buscar" }).click();
  await expect(page.getByText("María Pérez")).toBeVisible();

  // Ver detalle.
  await page.getByRole("link", { name: "María Pérez" }).click();
  await expect(page.getByRole("heading", { name: "María Pérez" })).toBeVisible();

  // Congelar y reactivar.
  await page.getByRole("button", { name: "Congelar membresía" }).click();
  await expect(page.getByText("Congelado")).toBeVisible();
  await page.getByRole("button", { name: "Reactivar" }).click();
  await expect(page.getByText("Activo")).toBeVisible();
});
