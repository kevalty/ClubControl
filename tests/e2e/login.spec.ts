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
