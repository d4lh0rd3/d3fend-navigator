#!/usr/bin/env node
// Télécharge les bundles STIX ATT&CK Enterprise et ICS dans data/raw/attack/.
//
// Source : mitre-attack/attack-stix-data (dépôt de référence, utilisé par ATT&CK Navigator).
// Contrairement à mitre/cti, ses bundles sont versionnés et contiennent l'objet
// x-mitre-collection qui porte la version d'ATT&CK (ex. "20.1").
//
// Usage : node scripts/etl/fetch-attack.mjs [version]   (défaut : dernière version publiée)

import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const outDir = path.join(ROOT, "data", "raw", "attack");
const INDEX_URL = "https://raw.githubusercontent.com/mitre-attack/attack-stix-data/master/index.json";
const requestedVersion = process.argv[2] ?? null;

const bundles = [
  { collection: "Enterprise ATT&CK", file: "enterprise-attack.json" },
  { collection: "ICS ATT&CK", file: "ics-attack.json" }
];

async function fetchOk(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`échec du téléchargement de ${url} : HTTP ${res.status}`);
  }
  return res;
}

async function main() {
  await mkdir(outDir, { recursive: true });

  const pending = bundles.filter(({ file }) => {
    const present = existsSync(path.join(outDir, file));
    if (present) console.log(`skip (déjà présent, supprimer pour mettre à jour) : ${file}`);
    return !present;
  });
  if (!pending.length) return;

  const index = await (await fetchOk(INDEX_URL)).json();

  for (const { collection, file } of pending) {
    const entry = index.collections.find((c) => c.name === collection);
    if (!entry) throw new Error(`collection « ${collection} » absente de ${INDEX_URL}`);
    // versions[] est triée de la plus récente à la plus ancienne
    const version = requestedVersion
      ? entry.versions.find((v) => v.version === requestedVersion)
      : entry.versions[0];
    if (!version) throw new Error(`version ${requestedVersion} introuvable pour « ${collection} »`);

    console.log(`téléchargement : ${collection} v${version.version} (${version.url})`);
    const buf = Buffer.from(await (await fetchOk(version.url)).arrayBuffer());
    const dest = path.join(outDir, file);
    await writeFile(dest, buf);
    console.log(`  -> ${dest} (${(buf.length / 1024 / 1024).toFixed(1)} Mo)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
