import { z } from "zod";

export const bankAccountSchema = z.object({
  bankName: z.string().trim().min(2, "Ingresa el nombre del banco."),
  accountType: z.enum(["ahorros", "corriente"]),
  accountNumber: z.string().trim().min(4, "Número de cuenta inválido."),
  accountHolderName: z.string().trim().min(2, "Ingresa el titular de la cuenta."),
  accountHolderDocument: z.string().trim().min(5, "Cédula o RUC inválido."),
});

export type BankAccountInput = z.infer<typeof bankAccountSchema>;

export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  ahorros: "Ahorros",
  corriente: "Corriente",
};
