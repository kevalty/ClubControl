import { test } from "@playwright/test";
import path from "node:path";

// Auditoría visual manual en viewport móvil (no es una prueba de
// regresión con asserts — CLAUDE.md §15.3 pide "funciona correctamente en
// mobile", esto es la forma de verificarlo de verdad en vez de asumirlo).
// Corre solo con --project=mobile. Las capturas se guardan en
// .mobile-audit/ (gitignored) salvo que se pase MOBILE_AUDIT_OUT_DIR.
// Para inspeccionarlas: npx playwright test --project=mobile tests/e2e/mobile/visual-audit.spec.ts

const OUT_DIR = process.env.MOBILE_AUDIT_OUT_DIR ?? path.join(process.cwd(), ".mobile-audit");

test("recorrido visual completo en viewport móvil", async ({ page }) => {
  test.setTimeout(90_000);
  const suffix = Date.now();
  const shot = (name: string) =>
    page.screenshot({ path: path.join(OUT_DIR, `${name}.png`), fullPage: true });

  await page.goto("/");
  await shot("01-landing");

  await page.goto("/auth/login");
  await shot("02-login");

  await page.goto("/auth/registro");
  await shot("03-registro");

  const email = `mobile-${suffix}@test.com`;
  await page.getByLabel("Nombre del club").fill(`Club Mobile ${suffix}`);
  await page.getByLabel("Tu nombre").fill("Owner Mobile");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Teléfono").fill("0999999999");
  await page.getByLabel("Contraseña").fill("password123");
  await page.getByRole("button", { name: "Crear mi club" }).click();
  await page.waitForSelector("text=Paso 1 de 3", { timeout: 20_000 });
  await shot("04-onboarding-paso1");

  await page.getByRole("button", { name: "Continuar" }).click();
  await shot("05-onboarding-paso2");
  await page.getByLabel("Nombre del plan").fill("Mensualidad full");
  await page.getByLabel("Precio (USD)").fill("30");
  await page.getByRole("button", { name: "Continuar" }).click();
  await shot("06-onboarding-paso3");
  await page.getByRole("button", { name: "Saltar por ahora" }).click();
  await page.waitForURL(/\/dashboard$/);
  await shot("07-dashboard-home");

  const orgSlug = new URL(page.url()).pathname.split("/")[1];

  await page.goto(`/${orgSlug}/dashboard/miembros`);
  await shot("08-miembros-lista-vacia");

  await page.getByRole("link", { name: "Crea el primero" }).click();
  await shot("09-miembro-nuevo-form");
  await page.getByLabel("Nombre completo").fill("María Pérez");
  await page.getByLabel("Teléfono (WhatsApp)").fill("0987654321");
  await page.getByRole("button", { name: "Crear miembro" }).click();
  await page.waitForURL(/\/miembros$/);
  await shot("10-miembros-lista-con-datos");

  await page.getByRole("link", { name: "María Pérez" }).click();
  await shot("11-miembro-detalle");

  await page.goto(`/${orgSlug}/dashboard/planes`);
  await shot("12-planes-lista");

  await page.goto(`/${orgSlug}/dashboard/pagos`);
  await shot("13-pagos-lista");

  await page.goto(`/${orgSlug}/dashboard/pagos/nuevo`);
  await shot("14-pagos-nuevo-form");

  await page.goto(`/${orgSlug}/dashboard/asistencia`);
  await shot("15-asistencia");

  await page.goto(`/${orgSlug}/dashboard/clases`);
  await shot("16-clases-lista");

  await page.goto(`/${orgSlug}/checkin`);
  await page.waitForTimeout(500);
  await shot("17-checkin-kiosco");
});
