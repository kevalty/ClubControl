import { z } from "zod";

export const memberSchema = z.object({
  fullName: z.string().trim().min(2, "El nombre es muy corto."),
  email: z
    .union([z.literal(""), z.string().trim().email("Correo inválido.")])
    .optional(),
  phone: z.string().trim().min(7, "Teléfono inválido."),
  documentId: z.string().trim().optional(),
  birthDate: z.union([z.literal(""), z.string()]).optional(),
  emergencyContactName: z.string().trim().optional(),
  emergencyContactPhone: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export type MemberInput = z.infer<typeof memberSchema>;

export const MEMBER_STATUS_LABELS: Record<string, string> = {
  active: "Activo",
  inactive: "Inactivo",
  frozen: "Congelado",
  expired: "Vencido",
};
