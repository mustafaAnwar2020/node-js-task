export function normalizeColor(color) {
    if (!color)
        return "rgb(0, 0, 0)";
    return color.replace(/\s+/g, " ").trim().toLowerCase();
}
export function isTransparent(color) {
    const normalized = normalizeColor(color);
    return normalized === "transparent" || normalized.endsWith(", 0)");
}
export function parsePixelValue(value) {
    const match = value.match(/(-?\d+(\.\d+)?)/);
    if (!match)
        return 0;
    return Number.parseFloat(match[1]);
}
export function normalizeFontFamily(value) {
    return value.split(",")[0]?.replace(/["']/g, "").trim() || "system-ui";
}
