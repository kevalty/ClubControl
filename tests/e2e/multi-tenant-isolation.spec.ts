import { test, expect } from "@playwright/test";

// CLAUDE.md §15.1 (Definition of Done): "un usuario de un club no puede
// ver/editar datos de otro club — probar esto explícitamente." Ya se
// probó una vez a mano contra Postgres directo en Fase 0 (documentado en
// PROGRESS.md); esta es la versión automatizada de punta a punta, a
// través de la aplicación real (no solo la base de datos), con dos
// clubes creados vía UI.

test("el owner de un club no puede entrar al dashboard de otro club, y no ve sus miembros aunque adivine la URL", async ({
  page,
}) => {
  const suffix = Date.now();

  // Club A.
  await page.goto("/auth/registro");
  await page.getByLabel("Nombre del club").fill(`Club Aislado A ${suffix}`);
  await page.getByLabel("Tu nombre").fill("Owner A");
  await page.getByLabel("Correo electrónico").fill(`ownerA-${suffix}@test.com`);
  await page.getByLabel("Teléfono").fill("0999999991");
  await page.getByLabel("Contraseña").fill("password123");
  await page.getByRole("button", { name: "Crear mi club" }).click();
  await expect(page.getByText("Paso 1 de 3")).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByLabel("Nombre del plan").fill("Plan A");
  await page.getByLabel("Precio (USD)").fill("30");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: "Saltar por ahora" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  // Crea un miembro secreto en el Club A, para confirmar después que B no lo ve.
  await page.getByRole("link", { name: "Miembros", exact: true }).click();
  await page.getByRole("link", { name: "Crea el primero" }).click();
  await page.getByLabel("Nombre completo").fill("Secreto Club A");
  await page.getByLabel("Teléfono (WhatsApp)").fill("0999999992");
  await page.getByRole("button", { name: "Crear miembro" }).click();
  await expect(page).toHaveURL(/\/miembros$/);
  const orgSlugA = new URL(page.url()).pathname.split("/")[1];

  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL(/\/auth\/login/);

  // Club B, con un owner distinto.
  await page.goto("/auth/registro");
  await page.getByLabel("Nombre del club").fill(`Club Aislado B ${suffix}`);
  await page.getByLabel("Tu nombre").fill("Owner B");
  await page.getByLabel("Correo electrónico").fill(`ownerB-${suffix}@test.com`);
  await page.getByLabel("Teléfono").fill("0999999993");
  await page.getByLabel("Contraseña").fill("password123");
  await page.getByRole("button", { name: "Crear mi club" }).click();
  await expect(page.getByText("Paso 1 de 3")).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByLabel("Nombre del plan").fill("Plan B");
  await page.getByLabel("Precio (USD)").fill("20");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: "Saltar por ahora" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  const orgSlugB = new URL(page.url()).pathname.split("/")[1];

  // El owner B (logueado) intenta entrar al dashboard del Club A adivinando
  // la URL. El middleware resuelve el slug consultando `organizations` con
  // la sesión de B — como B no pertenece a A, RLS ya le esconde esa fila
  // (ni siquiera puede confirmar que el club existe), así que el resultado
  // es 404 "club no encontrado", no un 403 que sí confirmaría su existencia
  // — un resultado más seguro todavía que un simple 403.
  const response = await page.goto(`/${orgSlugA}/dashboard/miembros`);
  expect(response?.status()).toBe(404);
  await expect(page.getByText("Secreto Club A")).not.toBeVisible();

  // Y dentro de SU PROPIO club, tampoco aparece el miembro secreto de A.
  await page.goto(`/${orgSlugB}/dashboard/miembros`);
  await expect(page.getByText("Secreto Club A")).not.toBeVisible();
});
