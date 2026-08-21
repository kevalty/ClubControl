import { test, expect } from "@playwright/test";

// Módulo 8.8: crea una clase con recurrencia (genera sesiones automáticas),
// abre el calendario semanal, entra a una sesión y reserva un cupo para un
// miembro, y marca su asistencia.

test("crear una clase genera sesiones automáticas y se puede reservar/marcar asistencia", async ({
  page,
}) => {
  const suffix = Date.now();
  const email = `owner-clases-${suffix}@test.com`;

  await page.goto("/auth/registro");
  await page.getByLabel("Nombre del club").fill(`Club Clases ${suffix}`);
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

  // Crear un miembro activo para poder reservarle un cupo.
  await page.getByRole("link", { name: "Miembros", exact: true }).click();
  await page.getByRole("link", { name: "Crea el primero" }).click();
  await page.getByLabel("Nombre completo").fill("Alumno Yoga");
  await page.getByLabel("Teléfono (WhatsApp)").fill("0987654321");
  await page.getByRole("button", { name: "Crear miembro" }).click();
  await expect(page).toHaveURL(/\/miembros$/);

  // Crear una clase que ocurra HOY (para que aparezca en el calendario de
  // esta semana con al menos una sesión ya generada).
  const hoyIndex = new Date().getDay(); // 0=domingo..6=sábado
  const diaLabel = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"][hoyIndex];

  await page.getByRole("link", { name: "Clases", exact: true }).click();
  await page.getByRole("link", { name: "Nueva clase" }).click();
  await page.getByLabel("Nombre de la clase").fill("Yoga");
  await page.getByLabel("Cupo máximo").fill("2");
  await page.getByRole("checkbox", { name: diaLabel }).click();
  await page.getByRole("button", { name: "Crear clase" }).click();

  await expect(page).toHaveURL(/\/clases$/);
  await expect(page.getByText("Yoga")).toBeVisible();

  // Ir al calendario y entrar a la sesión de hoy.
  await page.getByRole("link", { name: "Ver calendario" }).click();
  await page.getByRole("link", { name: /Yoga/ }).first().click();

  await expect(page.getByRole("heading", { name: "Yoga" })).toBeVisible();

  // Reservar un cupo para el miembro creado.
  await page.locator("button[role=combobox]").first().click();
  await page.getByRole("option", { name: "Alumno Yoga" }).click();
  await page.getByRole("button", { name: "Reservar cupo" }).click();
  await expect(page.getByRole("cell", { name: "Alumno Yoga" })).toBeVisible();
  await expect(page.getByText("Reservado", { exact: true })).toBeVisible();

  // Marcar asistencia.
  await page.getByRole("button", { name: "Asistió", exact: true }).click();
  await expect(page.getByText("Asistió", { exact: true })).toBeVisible();
});
