export function normalizeColor(color: string): string {
  if (!color) return "rgb(0, 0, 0)";
  return color.replace(/\s+/g, " ").trim().toLowerCase();
}

export function isTransparent(color: string): boolean {
  const normalized = normalizeColor(color);
  return normalized === "transparent" || normalized.endsWith(", 0)");
}

export function parsePixelValue(value: string): number {
  const match = value.match(/(-?\d+(\.\d+)?)/);
  if (!match) return 0;
  return Number.parseFloat(match[1]);
}

export function normalizeFontFamily(value: string): string {
  return value.split(",")[0]?.replace(/["']/g, "").trim() || "system-ui";
}
