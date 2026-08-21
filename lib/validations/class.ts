import { z } from "zod";

export const WEEKDAYS = [
  { value: "mon", label: "Lun" },
  { value: "tue", label: "Mar" },
  { value: "wed", label: "Mié" },
  { value: "thu", label: "Jue" },
  { value: "fri", label: "Vie" },
  { value: "sat", label: "Sáb" },
  { value: "sun", label: "Dom" },
];

export const classSchema = z.object({
  name: z.string().trim().min(2, "El nombre es muy corto."),
  description: z.string().trim().optional(),
  trainerUserId: z.union([z.literal(""), z.string().uuid()]).optional(),
  capacity: z.coerce.number().int().positive("La capacidad debe ser mayor a 0."),
  location: z.string().trim().optional(),
  days: z.array(z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"])).min(1, "Selecciona al menos un día."),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Hora inválida."),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Hora inválida."),
});

export type ClassInput = z.infer<typeof classSchema>;
