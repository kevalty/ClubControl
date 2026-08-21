export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "") // quita acentos (tras normalize NFD)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
