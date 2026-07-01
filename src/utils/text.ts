export function toTitleCase(str: string): string {
  if (!str) return str;
  return str
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
