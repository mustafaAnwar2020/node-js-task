import type { DesignTokens, Section, ThemePayload } from "../contracts/themeSchema.js";
import { themePayloadSchema } from "../contracts/themeSchema.js";
import { componentRegistry } from "./componentRegistry.js";

type MappingInput = {
  meta: ThemePayload["meta"];
  tokens: DesignTokens;
  sections: Section[];
};

function findBestComponent(section: Section) {
  const candidates = componentRegistry.filter((component) => component.supports.includes(section.type));
  if (candidates.length === 0) return null;
  return candidates[0];
}

export function mapToInternalComponents(input: MappingInput): ThemePayload {
  const components: ThemePayload["mapping"]["components"] = [];
  const unresolved: ThemePayload["mapping"]["unresolved"] = [];

  for (const section of input.sections) {
    const component = findBestComponent(section);
    if (!component || section.confidence < 0.55) {
      unresolved.push({
        externalSectionId: section.id,
        reason: component ? "Low-confidence section type" : "No supported internal component",
        suggestedComponents: component ? [component.id] : componentRegistry.map((c) => c.id).slice(0, 3),
      });
      continue;
    }

    components.push({
      externalSectionId: section.id,
      externalType: section.type,
      internalComponent: component.id,
      props: {
        ...component.fallbackProps,
        inferredText: section.signals.includes("commerce-keywords") ? "Detected commerce intent" : undefined,
      },
      confidence: Math.min(0.99, section.confidence + 0.08),
      rationale: [
        `Matched by type: ${section.type}`,
        `Registry support: ${component.supports.join(", ")}`,
        `Signal count: ${section.signals.length}`,
      ],
    });
  }

  return themePayloadSchema.parse({
    meta: input.meta,
    tokens: input.tokens,
    sections: input.sections,
    mapping: {
      themeTokens: {
        primaryColor: "tokens.colors.primary",
        secondaryColor: "tokens.colors.secondary",
        bodyFont: "tokens.typography.bodyFont",
        headingFont: "tokens.typography.headingFont",
      },
      components,
      unresolved,
    },
  });
}
