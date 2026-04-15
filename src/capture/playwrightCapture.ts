import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { captureBundleSchema, type CaptureBundle } from "../contracts/themeSchema.js";

export type CaptureInput = {
  sourceUrl: string;
  pageType: "home" | "collection" | "product";
  viewport: "desktop" | "mobile";
  outputDir: string;
};

const VIEWPORTS: Record<"desktop" | "mobile", { width: number; height: number }> = {
  desktop: { width: 1440, height: 2200 },
  mobile: { width: 430, height: 2200 },
};

export async function capturePage(input: CaptureInput): Promise<CaptureBundle> {
  await mkdir(input.outputDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORTS[input.viewport],
    locale: "en-US",
  });
  const page = await context.newPage();

  await page.goto(input.sourceUrl, {
    waitUntil: "networkidle",
    timeout: 60_000,
  });

  await page.addStyleTag({
    content: `
      *, *::before, *::after { animation: none !important; transition: none !important; }
      html { scroll-behavior: auto !important; }
    `,
  });

  const maxScroll = (await page.evaluate(
    "Math.max(0, document.documentElement.scrollHeight - window.innerHeight)",
  )) as number;
  const steps = 6;
  for (let i = 0; i <= steps; i += 1) {
    const ratio = i / steps;
    await page.evaluate(`window.scrollTo(0, ${Math.max(0, Math.round(maxScroll * ratio))});`);
    await page.waitForTimeout(150);
  }
  await page.evaluate("window.scrollTo(0, 0)");

  const safeHost = new URL(input.sourceUrl).hostname.replace(/[^a-z0-9.-]/gi, "_");
  const screenshotPath = path.join(
    input.outputDir,
    `${safeHost}_${input.pageType}_${input.viewport}.png`,
  );
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const html = await page.content();
  const title = await page.title();
  const nodes = await page.evaluate(`
    (() => {
      const tags = ["header", "nav", "main", "section", "footer", "article", "aside", "div", "a", "button"];
      const minArea = 1200;
      const minTextLength = 4;
      let counter = 0;

      const isVisible = (el) => {
        const style = window.getComputedStyle(el);
        if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return false;
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      };

      return Array.from(document.querySelectorAll(tags.join(",")))
        .filter((el) => isVisible(el))
        .map((el) => {
          const rect = el.getBoundingClientRect();
          const styles = window.getComputedStyle(el);
          const text = (el.textContent || "").trim().replace(/\\s+/g, " ");
          return {
            nodeId: "n_" + (++counter),
            tag: el.tagName.toLowerCase(),
            text,
            className: el.className || "",
            role: el.getAttribute("role"),
            href: el instanceof HTMLAnchorElement ? el.href : null,
            bbox: {
              x: Math.round(rect.x),
              y: Math.round(rect.y + window.scrollY),
              w: Math.round(rect.width),
              h: Math.round(rect.height)
            },
            area: rect.width * rect.height,
            textLength: text.length,
            styles: {
              color: styles.color,
              backgroundColor: styles.backgroundColor,
              fontFamily: styles.fontFamily,
              fontSize: styles.fontSize,
              fontWeight: styles.fontWeight,
              borderRadius: styles.borderRadius,
              display: styles.display,
              gap: styles.gap,
              gridTemplateColumns: styles.gridTemplateColumns
            }
          };
        })
        .filter((item) => item.area >= minArea || item.textLength >= minTextLength)
        .map((item) => {
          const { area, textLength, ...rest } = item;
          return rest;
        });
    })()
  `);

  await browser.close();

  return captureBundleSchema.parse({
    meta: {
      sourceUrl: input.sourceUrl,
      capturedAt: new Date().toISOString(),
      viewport: input.viewport,
      pageType: input.pageType,
    },
    html,
    title,
    screenshotPath,
    nodes,
  });
}
