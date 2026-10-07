#!/usr/bin/env node
// Télécharge les bundles STIX ATT&CK Enterprise et ICS dans data/raw/attack/.
// Usage : node scripts/etl/fetch-attack.mjs

import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const outDir = path.join(ROOT, "data", "raw", "attack");

const bundles = [
  { url: "https://raw.githubusercontent.com/mitre/cti/master/enterprise-attack/enterprise-attack.json", file: "enterprise-attack.json" },
  { url: "https://raw.githubusercontent.com/mitre/cti/master/ics-attack/ics-attack.json", file: "ics-attack.json" }
];

async function fetchBundle({ url, file }) {
  const dest = path.join(outDir, file);
  if (existsSync(dest)) {
    console.log(`skip (déjà présent) : ${dest}`);
    return;
  }
  console.log(`téléchargement : ${url}`);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`échec du téléchargement de ${url} : HTTP ${res.status}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
  console.log(`  -> ${dest} (${(buf.length / 1024 / 1024).toFixed(1)} Mo)`);
}

async function main() {
  await mkdir(outDir, { recursive: true });
  for (const bundle of bundles) {
    await fetchBundle(bundle);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
