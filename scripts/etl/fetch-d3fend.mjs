#!/usr/bin/env node
// Télécharge les exports officiels D3FEND pour une version donnée dans data/raw/<version>/.
// Usage : node scripts/etl/fetch-d3fend.mjs [version]   (défaut : 1.6.0)

import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const version = process.argv[2] ?? "1.6.0";
const baseUrl = `https://d3fend.mitre.org/ontologies/d3fend/${version}`;
const outDir = path.join(ROOT, "data", "raw", version);

const files = ["d3fend.csv", "d3fend.json", "d3fend-full-mappings.json"];

async function fetchFile(name) {
  const dest = path.join(outDir, name);
  if (existsSync(dest)) {
    console.log(`skip (déjà présent) : ${name}`);
    return;
  }
  const url = `${baseUrl}/${name}`;
  console.log(`téléchargement : ${url}`);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`échec du téléchargement de ${url} : HTTP ${res.status}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
  console.log(`  -> ${dest} (${(buf.length / 1024).toFixed(0)} Ko)`);
}

async function main() {
  await mkdir(outDir, { recursive: true });
  for (const name of files) {
    await fetchFile(name);
  }
  console.log(`\nTerminé. Fichiers disponibles dans ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
