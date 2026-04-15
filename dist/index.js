import { runAnalysis } from "./orchestrator/runAnalysis.js";
function parseArgs(argv) {
    const args = new Map();
    for (let i = 0; i < argv.length; i += 1) {
        const token = argv[i];
        if (token.startsWith("--")) {
            args.set(token.slice(2), argv[i + 1] ?? "");
            i += 1;
        }
    }
    const sourceUrl = args.get("url");
    if (!sourceUrl) {
        throw new Error("Missing required --url argument. Example: npm run dev -- --url https://example.com");
    }
    const pageTypeRaw = args.get("pageType");
    const viewportRaw = args.get("viewport");
    return {
        sourceUrl,
        pageType: pageTypeRaw,
        viewport: viewportRaw,
    };
}
async function main() {
    try {
        const parsed = parseArgs(process.argv.slice(2));
        const result = await runAnalysis(parsed);
        console.log("Analysis complete:");
        console.log(JSON.stringify(result, null, 2));
    }
    catch (error) {
        console.error(error instanceof Error ? error.message : "Unknown error");
        process.exitCode = 1;
    }
}
void main();
