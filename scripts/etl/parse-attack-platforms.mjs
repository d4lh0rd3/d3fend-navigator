// Extrait des bundles STIX ATT&CK :
// - les plateformes (x_mitre_platforms) par technique, Enterprise uniquement (BETA) ;
// - le shortname de chaque tactique (ex. "TA0009" -> "collection"), Enterprise et ICS, forme
//   attendue par le champ `tactic` d'un layer ATT&CK Navigator. Les TA-id des deux domaines
//   ne se chevauchent pas, d'où une table unique.

import path from "node:path";
import { existsSync } from "node:fs";
import { readJson } from "./lib/util.mjs";

function extractTacticShortnames(bundle, into) {
  for (const obj of bundle.objects) {
    if (obj.type !== "x-mitre-tactic") continue;
    const ref = (obj.external_references ?? []).find((r) => r.source_name === "mitre-attack");
    if (!ref?.external_id || !obj.x_mitre_shortname) continue;
    into.set(ref.external_id, obj.x_mitre_shortname);
  }
}

async function readBundle(rootDir, filename) {
  const bundlePath = path.join(rootDir, "data", "raw", "attack", filename);
  if (!existsSync(bundlePath)) {
    throw new Error(`${bundlePath} introuvable — lancer d'abord : npm run etl:fetch-attack`);
  }
  return readJson(bundlePath);
}

export async function parseAttackPlatforms(rootDir) {
  const enterpriseBundle = await readBundle(rootDir, "enterprise-attack.json");
  const icsBundle = await readBundle(rootDir, "ics-attack.json");

  const platformsByAttackId = new Map();
  for (const obj of enterpriseBundle.objects) {
    if (obj.type !== "attack-pattern") continue;
    const ref = (obj.external_references ?? []).find((r) => r.source_name === "mitre-attack");
    if (!ref?.external_id) continue;
    platformsByAttackId.set(ref.external_id, obj.x_mitre_platforms ?? []);
  }

  const tacticShortnameByAttackId = new Map();
  extractTacticShortnames(enterpriseBundle, tacticShortnameByAttackId);
  extractTacticShortnames(icsBundle, tacticShortnameByAttackId);

  return { platformsByAttackId, tacticShortnameByAttackId };
}
