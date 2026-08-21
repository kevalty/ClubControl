import { z } from "zod";

export const membershipPlanSchema = z.object({
  name: z.string().trim().min(2, "El nombre del plan es muy corto."),
  description: z.string().trim().optional(),
  price: z.coerce.number().min(0, "El precio no puede ser negativo."),
  billingCycle: z.enum([
    "monthly",
    "quarterly",
    "annual",
    "class_pack",
    "single_session",
  ]),
  sessionsIncluded: z.coerce.number().int().positive().optional(),
  durationDays: z.coerce.number().int().positive("La vigencia debe ser mayor a 0 días."),
});

export type MembershipPlanInput = z.infer<typeof membershipPlanSchema>;

export const BILLING_CYCLE_LABELS: Record<string, string> = {
  monthly: "Mensual",
  quarterly: "Trimestral",
  annual: "Anual",
  class_pack: "Pack de clases",
  single_session: "Sesión individual",
};
