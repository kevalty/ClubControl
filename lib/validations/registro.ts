import { z } from "zod";

export const registroSchema = z.object({
  nombreClub: z.string().trim().min(2, "El nombre del club es muy corto."),
  nombreDueno: z.string().trim().min(2, "Ingresa tu nombre completo."),
  email: z.string().trim().email("Correo inválido."),
  telefono: z.string().trim().min(7, "Teléfono inválido."),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
});

export type RegistroInput = z.infer<typeof registroSchema>;
