import { test, expect } from "@playwright/test";

test("login con credenciales incorrectas muestra un error claro en español", async ({
  page,
}) => {
  await page.goto("/auth/login");
  await page.getByLabel("Correo electrónico").fill("no-existe@test.com");
  await page.getByLabel("Contraseña").fill("cualquierpassword");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();

  await expect(page.getByText("Correo o contraseña incorrectos.")).toBeVisible();
});

test("un usuario sin sesión que intenta entrar a un dashboard es redirigido a login", async ({
  page,
}) => {
  await page.goto("/algun-club/dashboard");
  await expect(page).toHaveURL(/\/auth\/login/);
});

test("un owner de un solo club entra directo a su dashboard al iniciar sesión (CLAUDE.md 8.2)", async ({
  page,
}) => {
  const suffix = Date.now();
  const email = `owner-login-${suffix}@test.com`;

  await page.goto("/auth/registro");
  await page.getByLabel("Nombre del club").fill(`Club Login ${suffix}`);
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

  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL(/\/auth\/login/);

  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña").fill("password123");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
});
