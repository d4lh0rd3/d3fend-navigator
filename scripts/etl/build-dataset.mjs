#!/usr/bin/env node
// Fusionne les exports D3FEND (data/raw/<version>/) en public/data/d3fend-dataset.v<version>.json
// et met à jour public/data/versions.json.
// Usage : node scripts/etl/build-dataset.mjs [version]   (défaut : 1.6.0)

import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseHierarchy } from "./parse-hierarchy.mjs";
import { parseArtifacts } from "./parse-artifacts.mjs";
import { parseAttackMappings } from "./parse-attack-mappings.mjs";
import { parseAttackStix } from "./parse-attack-stix.mjs";
import { resolveAttackMappings } from "./resolve-attack-mappings.mjs";
import { readJson } from "./lib/util.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const version = process.argv[2] ?? "1.6.0";
const rawDir = path.join(ROOT, "data", "raw", version);
const generatedDir = path.join(ROOT, "public", "data");

async function main() {
  if (!existsSync(rawDir)) {
    throw new Error(`${rawDir} introuvable — lancer d'abord : npm run etl:fetch -- ${version}`);
  }

  console.log(`[1/5] hiérarchie (tactiques + techniques) depuis d3fend.csv / d3fend.json...`);
  const { tactics, techniques } = await parseHierarchy(rawDir);
  console.log(`      -> ${tactics.length} tactiques, ${techniques.length} techniques`);

  console.log(`[2/5] artefacts numériques + relations technique->artefact depuis d3fend.json...`);
  const { artifacts, relationships, observedPredicates } = await parseArtifacts(rawDir, techniques);
  console.log(`      -> ${artifacts.length} artefacts, ${relationships.length} relations`);
  console.log(`      -> prédicats de relation observés : ${observedPredicates.join(", ")}`);

  console.log(`[3/5] bundles STIX ATT&CK (version, plateformes, tactiques, révocations), source externe à D3FEND...`);
  const { catalogs, platformsByAttackId, tacticShortnameByAttackId, attackVersions } = await parseAttackStix(ROOT);
  console.log(`      -> versions ATT&CK : ${Object.entries(attackVersions).map(([f, v]) => `${f} ${v ?? "inconnue"}`).join(", ")}`);
  console.log(`      -> ${platformsByAttackId.size} techniques ATT&CK avec plateformes connues`);
  console.log(`      -> ${tacticShortnameByAttackId.size} tactiques ATT&CK avec shortname connu (Enterprise + ICS)`);

  console.log(`[4/5] mappings vers les frameworks offensifs depuis d3fend-full-mappings.json...`);
  const { mappings: rawMappings, unresolvedTechniqueLocalNames } = await parseAttackMappings(
    rawDir,
    techniques,
    platformsByAttackId
  );
  const { mappings, stats: attackResolution } = resolveAttackMappings(rawMappings, catalogs);
  console.log(`      -> ${mappings.length} mappings (${rawMappings.length} avant réalignement sur ATT&CK)`);
  console.log(
    `      -> réalignement ATT&CK : ${attackResolution.remappedTechniques.size} techniques révoquées remplacées, ` +
      `${attackResolution.remappedTactics} mappings changés de tactique, ` +
      `${attackResolution.excluded.size} techniques dépréciées/révoquées sans remplaçant/inconnues`
  );
  if (unresolvedTechniqueLocalNames.length) {
    console.warn(
      `      -> AVERTISSEMENT : ${unresolvedTechniqueLocalNames.length} noms de technique non résolus (ignorés) :`,
      unresolvedTechniqueLocalNames.slice(0, 10).join(", "),
      unresolvedTechniqueLocalNames.length > 10 ? "…" : ""
    );
  }

  console.log(`[5/5] dénormalisation et écriture du dataset...`);
  const relByTechnique = new Map();
  for (const rel of relationships) {
    if (!relByTechnique.has(rel.techniqueId)) relByTechnique.set(rel.techniqueId, []);
    relByTechnique.get(rel.techniqueId).push(rel.id);
  }
  const mapByTechnique = new Map();
  for (const m of mappings) {
    if (!mapByTechnique.has(m.d3fendTechniqueId)) mapByTechnique.set(m.d3fendTechniqueId, []);
    mapByTechnique.get(m.d3fendTechniqueId).push(m.id);
  }

  const finalTechniques = techniques.map(({ _localName, ...t }) => ({
    ...t,
    artifactRelationIds: relByTechnique.get(t.id) ?? [],
    attackMappingIds: mapByTechnique.get(t.id) ?? [],
    localName: _localName ?? null,
  }));

  const dataset = {
    d3fendVersion: version,
    generatedAt: new Date().toISOString(),
    tactics,
    techniques: finalTechniques,
    artifacts,
    artifactRelationships: relationships,
    attackMappings: mappings,
    attackTacticShortnames: Object.fromEntries(tacticShortnameByAttackId),
    attackVersions,
  };

  await mkdir(generatedDir, { recursive: true });
  const datasetFile = `d3fend-dataset.v${version}.json`;
  await writeFile(path.join(generatedDir, datasetFile), JSON.stringify(dataset, null, 2));

  const auditFile = path.join(generatedDir, "etl-audit.json");
  await writeFile(
    auditFile,
    JSON.stringify(
      {
        version,
        generatedAt: dataset.generatedAt,
        attackVersions,
        observedRelationPredicates: observedPredicates,
        unresolvedTechniqueLocalNames,
        attackRemappedTechniques: Object.fromEntries([...attackResolution.remappedTechniques].sort()),
        attackRemappedTacticMappings: attackResolution.remappedTactics,
        attackExcludedTechniques: Object.fromEntries([...attackResolution.excluded].sort()),
      },
      null,
      2
    )
  );

  const versionsFile = path.join(generatedDir, "versions.json");
  const versionsManifest = existsSync(versionsFile) ? await readJson(versionsFile) : { versions: [] };
  if (!versionsManifest.versions.some((v) => v.d3fend === version)) {
    versionsManifest.versions.push({ d3fend: version, dataset: datasetFile, generatedAt: dataset.generatedAt });
  }
  await writeFile(versionsFile, JSON.stringify(versionsManifest, null, 2));

  console.log(`\nOK -> ${path.join(generatedDir, datasetFile)}`);
  console.log(`OK -> ${versionsFile}`);
  console.log(`OK -> ${auditFile} (à relire : prédicats/techniques non résolus)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
