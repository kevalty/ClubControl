import { z } from "zod";

export const registrarPagoSchema = z.object({
  memberId: z.string().uuid("Selecciona un miembro."),
  amount: z.coerce.number().positive("El monto debe ser mayor a 0."),
  method: z.enum(["bank_transfer", "cash", "other"]),
  referenceNumber: z.string().trim().optional(),
  // Uno de los dos es obligatorio: o es la renovación de una membresía
  // existente, o es la compra de un plan nuevo. Se valida en el server
  // action (zod .refine acá sería redundante con la lógica de negocio).
  membershipId: z.union([z.literal(""), z.string().uuid()]).optional(),
  planId: z.union([z.literal(""), z.string().uuid()]).optional(),
});

export type RegistrarPagoInput = z.infer<typeof registrarPagoSchema>;

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  bank_transfer: "Transferencia bancaria",
  kushki: "Kushki",
  payphone: "PayPhone",
  cash: "Efectivo",
  other: "Otro",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending_review: "Pendiente de revisión",
  approved: "Aprobado",
  rejected: "Rechazado",
  refunded: "Reembolsado",
};
