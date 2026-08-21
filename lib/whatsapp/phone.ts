// Normaliza un teléfono ecuatoriano guardado en formato local (ej.
// "0999999999") a E.164 (+593999999999) para WhatsApp. Si ya viene con
// "+", se asume que ya está en formato internacional y se deja igual.
export function toE164Ecuador(phone: string): string {
  const trimmed = phone.trim();
  if (trimmed.startsWith("+")) return trimmed;
  const digits = trimmed.replace(/\D/g, "");
  if (digits.startsWith("0")) return `+593${digits.slice(1)}`;
  return `+593${digits}`;
}
