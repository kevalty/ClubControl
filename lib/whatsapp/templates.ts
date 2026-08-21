// Interpolación de variables {{nombre}}, {{monto}}, {{fecha_vencimiento}},
// {{link_pago}}, {{club}} en las plantillas de WhatsApp. Ver CLAUDE.md §8.6.

export function renderTemplate(
  content: string,
  variables: Record<string, string>
): string {
  return content.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key: string) =>
    key in variables ? variables[key] : match
  );
}
