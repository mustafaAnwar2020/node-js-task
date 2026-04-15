import path from "node:path";
import express from "express";
import { z } from "zod";
import { runAnalysis } from "./orchestrator/runAnalysis.js";

const app = express();
const port = Number.parseInt(process.env.PORT ?? "3000", 10);
const rootDir = process.cwd();
const outputsDir = path.resolve(rootDir, "outputs");

const requestSchema = z.object({
  url: z.string().url(),
  pageType: z.enum(["home", "collection", "product"]).optional(),
  viewport: z.enum(["desktop", "mobile"]).optional(),
});

function toOutputUrl(absPath: string): string {
  const relPath = path.relative(outputsDir, absPath).split(path.sep).join("/");
  return `/outputs/${encodeURI(relPath)}`;
}

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(rootDir, "public")));
app.use("/outputs", express.static(outputsDir));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/analyze", async (req, res) => {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid request body",
      details: parsed.error.flatten(),
    });
  }

  try {
    const analysis = await runAnalysis({
      sourceUrl: parsed.data.url,
      pageType: parsed.data.pageType,
      viewport: parsed.data.viewport,
    });

    return res.json({
      ok: true,
      runDir: analysis.runDir,
      stats: analysis.stats,
      files: {
        screenshot: toOutputUrl(analysis.screenshotPath),
        capture: toOutputUrl(analysis.capturePath),
        tokens: toOutputUrl(analysis.tokensPath),
        sections: toOutputUrl(analysis.sectionsPath),
        mapping: toOutputUrl(analysis.mappingPath),
        payload: toOutputUrl(analysis.payloadPath),
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: "Analysis failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.listen(port, () => {
  console.log(`Web app running on http://localhost:${port}`);
});
