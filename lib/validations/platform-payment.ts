import { z } from "zod";

export const registrarPagoPlataformaSchema = z.object({
  planId: z.string().uuid("Selecciona un plan."),
  amount: z.coerce.number().positive("El monto debe ser mayor a 0."),
  referenceNumber: z.string().trim().optional(),
});

export const PLATFORM_PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending_review: "Pendiente de revisión",
  approved: "Aprobado",
  rejected: "Rechazado",
};

export const ORGANIZATION_STATUS_LABELS: Record<string, string> = {
  trial: "Prueba gratuita",
  active: "Activo",
  past_due: "Pago atrasado",
  suspended: "Suspendido",
  cancelled: "Cancelado",
};
