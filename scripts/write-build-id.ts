import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

async function main() {
  const buildManifestPath = path.join(process.cwd(), ".next", "build-manifest.json");
  const buildManifestRaw = await readFile(buildManifestPath, "utf8");
  const buildManifest = JSON.parse(buildManifestRaw) as {
    lowPriorityFiles?: string[];
  };

  const manifestEntry = buildManifest.lowPriorityFiles?.find((file) =>
    /^static\/[^/]+\/_buildManifest\.js$/.test(file)
  );

  if (!manifestEntry) {
    throw new Error("Unable to locate the Next.js build ID in .next/build-manifest.json");
  }

  const match = manifestEntry.match(/^static\/([^/]+)\/_buildManifest\.js$/);
  if (!match) {
    throw new Error(`Unexpected build manifest entry: ${manifestEntry}`);
  }

  const buildId = match[1];
  const nextDir = path.join(process.cwd(), ".next");

  await writeFile(path.join(nextDir, "BUILD_ID"), `${buildId}\n`, "utf8");
  await writeFile(path.join(nextDir, "server", "BUILD_ID"), `${buildId}\n`, "utf8");

  console.log(`Wrote Next.js build ID: ${buildId}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});