import { z } from "zod";

export const viewportSchema = z.enum(["desktop", "mobile"]);

export const captureMetaSchema = z.object({
  sourceUrl: z.string().url(),
  capturedAt: z.string(),
  viewport: viewportSchema,
  pageType: z.enum(["home", "collection", "product"]),
});

export const boxSchema = z.object({
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
});

export const extractedNodeSchema = z.object({
  nodeId: z.string(),
  tag: z.string(),
  text: z.string(),
  className: z.string(),
  role: z.string().nullable(),
  href: z.string().nullable(),
  bbox: boxSchema,
  styles: z.object({
    color: z.string(),
    backgroundColor: z.string(),
    fontFamily: z.string(),
    fontSize: z.string(),
    fontWeight: z.string(),
    borderRadius: z.string(),
    display: z.string(),
    gap: z.string(),
    gridTemplateColumns: z.string(),
  }),
});

export const captureBundleSchema = z.object({
  meta: captureMetaSchema,
  html: z.string(),
  title: z.string(),
  screenshotPath: z.string(),
  nodes: z.array(extractedNodeSchema),
});

export const designTokensSchema = z.object({
  colors: z.object({
    primary: z.string(),
    secondary: z.string(),
    surface: z.string(),
    text: z.string(),
    palette: z.array(z.string()),
  }),
  typography: z.object({
    headingFont: z.string(),
    bodyFont: z.string(),
    scale: z.array(z.number()),
  }),
  radius: z.object({
    sm: z.number(),
    md: z.number(),
    lg: z.number(),
  }),
  spacing: z.object({
    base: z.number(),
    scale: z.array(z.number()),
  }),
});

export const sectionTypeSchema = z.enum([
  "header",
  "hero",
  "promoBanner",
  "categoryStrip",
  "productGrid",
  "productCard",
  "contentBlock",
  "footer",
  "unknown",
]);

export const sectionSchema = z.object({
  id: z.string(),
  type: sectionTypeSchema,
  bbox: boxSchema,
  nodeIds: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  signals: z.array(z.string()),
});

export const mappingItemSchema = z.object({
  externalSectionId: z.string(),
  externalType: sectionTypeSchema,
  internalComponent: z.string(),
  props: z.record(z.string(), z.unknown()),
  confidence: z.number().min(0).max(1),
  rationale: z.array(z.string()),
});

export const unresolvedSchema = z.object({
  externalSectionId: z.string(),
  reason: z.string(),
  suggestedComponents: z.array(z.string()),
});

export const themePayloadSchema = z.object({
  meta: captureMetaSchema,
  tokens: designTokensSchema,
  sections: z.array(sectionSchema),
  mapping: z.object({
    themeTokens: z.record(z.string(), z.string()),
    components: z.array(mappingItemSchema),
    unresolved: z.array(unresolvedSchema),
  }),
});

export type CaptureBundle = z.infer<typeof captureBundleSchema>;
export type DesignTokens = z.infer<typeof designTokensSchema>;
export type Section = z.infer<typeof sectionSchema>;
export type ThemePayload = z.infer<typeof themePayloadSchema>;
