import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export async function writeJsonFile(outputDir: string, fileName: string, payload: unknown): Promise<string> {
  await mkdir(outputDir, { recursive: true });
  const filePath = path.join(outputDir, fileName);
  await writeFile(filePath, JSON.stringify(payload, null, 2), "utf8");
  return filePath;
}
