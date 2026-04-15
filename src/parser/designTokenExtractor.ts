import type { CaptureBundle, DesignTokens } from "../contracts/themeSchema.js";
import { designTokensSchema } from "../contracts/themeSchema.js";
import { isTransparent, normalizeColor, normalizeFontFamily, parsePixelValue } from "../utils/css.js";
import { average, median } from "../utils/math.js";

function topValues(values: string[], count: number): string[] {
  const freq = new Map<string, number>();
  for (const value of values) {
    const normalized = value.trim();
    if (!normalized) continue;
    freq.set(normalized, (freq.get(normalized) ?? 0) + 1);
  }

  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([value]) => value);
}

export function extractDesignTokens(bundle: CaptureBundle): DesignTokens {
  const colors = bundle.nodes
    .flatMap((n) => [normalizeColor(n.styles.color), normalizeColor(n.styles.backgroundColor)])
    .filter((color) => !isTransparent(color));
  const fonts = bundle.nodes.map((n) => normalizeFontFamily(n.styles.fontFamily));
  const fontSizes = bundle.nodes.map((n) => Math.round(parsePixelValue(n.styles.fontSize))).filter(Boolean);
  const radii = bundle.nodes.map((n) => parsePixelValue(n.styles.borderRadius)).filter((v) => v > 0);
  const gaps = bundle.nodes.map((n) => parsePixelValue(n.styles.gap)).filter((v) => v > 0);

  const palette = topValues(colors, 8);
  const headingFont = topValues(fonts, 1)[0] ?? "system-ui";
  const bodyFont = topValues(fonts, 2)[1] ?? headingFont;
  const typographyScale = [...new Set(topValues(fontSizes.map(String), 7).map(Number))].sort((a, b) => a - b);
  const spacingBase = Math.max(4, Math.round(median(gaps, 8)));

  return designTokensSchema.parse({
    colors: {
      primary: palette[0] ?? "rgb(0, 0, 0)",
      secondary: palette[1] ?? palette[0] ?? "rgb(80, 80, 80)",
      surface: palette.find((c) => c.includes("255")) ?? "rgb(255, 255, 255)",
      text: palette.find((c) => !c.includes("255")) ?? "rgb(0, 0, 0)",
      palette,
    },
    typography: {
      headingFont,
      bodyFont,
      scale: typographyScale.length ? typographyScale : [12, 14, 16, 20, 24, 32],
    },
    radius: {
      sm: Math.round(Math.max(2, average(radii.filter((v) => v <= 6), 4))),
      md: Math.round(Math.max(6, median(radii, 8))),
      lg: Math.round(Math.max(10, average(radii.filter((v) => v >= 10), 14))),
    },
    spacing: {
      base: spacingBase,
      scale: [0.5, 1, 1.5, 2, 3, 4].map((multiplier) => Math.round(spacingBase * multiplier)),
    },
  });
}
