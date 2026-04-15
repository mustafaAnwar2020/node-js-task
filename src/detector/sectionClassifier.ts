import { sectionSchema, type CaptureBundle, type Section } from "../contracts/themeSchema.js";

function hasAny(text: string, needles: string[]): boolean {
  const lc = text.toLowerCase();
  return needles.some((needle) => lc.includes(needle));
}

function estimateType(
  tag: string,
  text: string,
  className: string,
  height: number,
  width: number,
): { type: Section["type"]; confidence: number; signals: string[] } {
  const signals: string[] = [];
  let type: Section["type"] = "unknown";
  let confidence = 0.45;

  if (tag === "header" || hasAny(className, ["header", "navbar", "nav"])) {
    type = "header";
    confidence = 0.94;
    signals.push("landmark-header");
  } else if (tag === "footer" || hasAny(className, ["footer"])) {
    type = "footer";
    confidence = 0.93;
    signals.push("landmark-footer");
  } else if (tag === "nav") {
    type = "header";
    confidence = 0.8;
    signals.push("nav-tag");
  } else if (hasAny(text, ["add to cart", "buy now", "shop now", "view all"])) {
    type = "productGrid";
    confidence = 0.72;
    signals.push("commerce-keywords");
  } else if (hasAny(className, ["hero", "banner", "slideshow"]) || (height > 380 && width > 900)) {
    type = "hero";
    confidence = 0.78;
    signals.push("large-visual-region");
  } else if (hasAny(className, ["product-grid", "products", "collection", "grid"])) {
    type = "productGrid";
    confidence = 0.82;
    signals.push("grid-naming");
  } else if (hasAny(className, ["product-card", "card"])) {
    type = "productCard";
    confidence = 0.75;
    signals.push("card-class");
  } else if (hasAny(className, ["announcement", "promo", "offer"])) {
    type = "promoBanner";
    confidence = 0.76;
    signals.push("promo-signals");
  } else if (hasAny(className, ["category", "collections"])) {
    type = "categoryStrip";
    confidence = 0.74;
    signals.push("category-class");
  } else if (tag === "section" || tag === "article" || tag === "main") {
    type = "contentBlock";
    confidence = 0.62;
    signals.push("generic-landmark");
  }

  return { type, confidence, signals };
}

export function classifySections(bundle: CaptureBundle): Section[] {
  const topLevelCandidates = bundle.nodes.filter((node) => {
    const lc = node.className.toLowerCase();
    if (node.tag === "div" && !lc) return false;
    if (node.bbox.h < 60 || node.bbox.w < 120) return false;
    return ["header", "nav", "main", "section", "footer", "article", "aside", "div"].includes(node.tag);
  });

  return topLevelCandidates.map((node, index) => {
    const result = estimateType(node.tag, node.text, node.className, node.bbox.h, node.bbox.w);
    return sectionSchema.parse({
      id: `sec_${index + 1}`,
      type: result.type,
      bbox: node.bbox,
      nodeIds: [node.nodeId],
      confidence: result.confidence,
      signals: [...result.signals, `tag:${node.tag}`],
    });
  });
}
