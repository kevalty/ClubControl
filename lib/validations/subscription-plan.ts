import { z } from "zod";

export const subscriptionPlanSchema = z.object({
  key: z
    .string()
    .trim()
    .regex(/^[a-z0-9_]+$/, "Solo minúsculas, números y guion bajo."),
  name: z.string().trim().min(2, "El nombre es muy corto."),
  priceMonthly: z.coerce.number().min(0, "El precio no puede ser negativo."),
  maxMembers: z.union([z.literal(""), z.coerce.number().int().positive()]).optional(),
  maxStaff: z.union([z.literal(""), z.coerce.number().int().positive()]).optional(),
});

export type SubscriptionPlanInput = z.infer<typeof subscriptionPlanSchema>;
