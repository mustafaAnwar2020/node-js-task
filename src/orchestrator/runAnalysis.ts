import path from "node:path";
import { capturePage } from "../capture/playwrightCapture.js";
import { classifySections } from "../detector/sectionClassifier.js";
import { mapToInternalComponents } from "../mapper/componentMapper.js";
import { extractDesignTokens } from "../parser/designTokenExtractor.js";
import { writeJsonFile } from "../utils/io.js";

export type AnalyzeInput = {
  sourceUrl: string;
  pageType?: "home" | "collection" | "product";
  viewport?: "desktop" | "mobile";
  outputRoot?: string;
};

export async function runAnalysis(input: AnalyzeInput) {
  const pageType = input.pageType ?? "home";
  const viewport = input.viewport ?? "desktop";
  const outputRoot = input.outputRoot ?? path.resolve(process.cwd(), "outputs");
  const runId = new Date().toISOString().replace(/[:.]/g, "-");
  const runDir = path.join(outputRoot, runId);

  const capture = await capturePage({
    sourceUrl: input.sourceUrl,
    pageType,
    viewport,
    outputDir: runDir,
  });
  const tokens = extractDesignTokens(capture);
  const sections = classifySections(capture);
  const payload = mapToInternalComponents({
    meta: capture.meta,
    tokens,
    sections,
  });

  const capturePath = await writeJsonFile(runDir, "capture.json", capture);
  const tokensPath = await writeJsonFile(runDir, "tokens.json", tokens);
  const sectionsPath = await writeJsonFile(runDir, "sections.json", sections);
  const mappingPath = await writeJsonFile(runDir, "mapping.json", payload.mapping);
  const payloadPath = await writeJsonFile(runDir, "theme-payload.json", payload);

  return {
    runDir,
    capturePath,
    tokensPath,
    sectionsPath,
    mappingPath,
    payloadPath,
    screenshotPath: capture.screenshotPath,
    stats: {
      nodes: capture.nodes.length,
      sections: sections.length,
      mapped: payload.mapping.components.length,
      unresolved: payload.mapping.unresolved.length,
    },
  };
}
