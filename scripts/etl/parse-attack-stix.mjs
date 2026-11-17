// Extrait des bundles STIX ATT&CK (Enterprise et ICS), source externe à D3FEND :
// - la version d'ATT&CK de chaque bundle (objet x-mitre-collection) ;
// - les plateformes (x_mitre_platforms) par technique, Enterprise uniquement (BETA) ;
// - le shortname de chaque tactique (ex. "TA0009" -> "collection"), forme attendue par le
//   champ `tactic` d'un layer ATT&CK Navigator. Les TA-id des deux domaines ne se
//   chevauchent pas, d'où une table unique ;
// - un catalogue des techniques par domaine (nom, tactiques, statut révoqué / déprécié,
//   remplaçant désigné par les relations `revoked-by`), utilisé pour réaligner les mappings
//   D3FEND sur la version courante d'ATT&CK (voir resolve-attack-mappings.mjs).

import path from "node:path";
import { existsSync } from "node:fs";
import { readJson } from "./lib/util.mjs";

const BUNDLE_BY_FRAMEWORK = {
  "attack-enterprise": "enterprise-attack.json",
  "attack-ics": "ics-attack.json",
};

function attackExternalId(obj) {
  return (obj.external_references ?? []).find((r) => r.source_name === "mitre-attack")?.external_id ?? null;
}

async function readBundle(rootDir, filename) {
  const bundlePath = path.join(rootDir, "data", "raw", "attack", filename);
  if (!existsSync(bundlePath)) {
    throw new Error(`${bundlePath} introuvable — lancer d'abord : npm run etl:fetch-attack`);
  }
  return readJson(bundlePath);
}

/**
 * @returns {{
 *   version: string | null,
 *   tactics: Map<string, { shortname: string, name: string }>,       // TA-id -> tactique
 *   tacticIdByShortname: Map<string, string>,                         // shortname -> TA-id (propre au domaine)
 *   techniques: Map<string, {                                         // T-id -> technique
 *     name: string, tactics: string[], revoked: boolean, deprecated: boolean,
 *     replacedBy: string | null, platforms: string[]
 *   }>
 * }}
 */
function buildCatalog(bundle) {
  const collection = bundle.objects.find((o) => o.type === "x-mitre-collection");

  const tactics = new Map();
  const tacticIdByShortname = new Map();
  for (const obj of bundle.objects) {
    if (obj.type !== "x-mitre-tactic") continue;
    const id = attackExternalId(obj);
    if (!id || !obj.x_mitre_shortname) continue;
    tactics.set(id, { shortname: obj.x_mitre_shortname, name: obj.name });
    tacticIdByShortname.set(obj.x_mitre_shortname, id);
  }

  const externalIdByStixId = new Map();
  const revokedByStixId = new Map();
  for (const obj of bundle.objects) {
    if (obj.type === "attack-pattern") {
      const id = attackExternalId(obj);
      if (id) externalIdByStixId.set(obj.id, id);
    } else if (obj.type === "relationship" && obj.relationship_type === "revoked-by") {
      revokedByStixId.set(obj.source_ref, obj.target_ref);
    }
  }

  const techniques = new Map();
  for (const obj of bundle.objects) {
    if (obj.type !== "attack-pattern") continue;
    const id = attackExternalId(obj);
    if (!id) continue;
    const replacementStixId = obj.revoked ? revokedByStixId.get(obj.id) : undefined;
    techniques.set(id, {
      name: obj.name,
      tactics: (obj.kill_chain_phases ?? []).map((k) => k.phase_name),
      revoked: obj.revoked === true,
      deprecated: obj.x_mitre_deprecated === true,
      replacedBy: replacementStixId ? externalIdByStixId.get(replacementStixId) ?? null : null,
      platforms: obj.x_mitre_platforms ?? [],
    });
  }

  return { version: collection?.x_mitre_version ?? null, tactics, tacticIdByShortname, techniques };
}

export async function parseAttackStix(rootDir) {
  const catalogs = {};
  for (const [framework, file] of Object.entries(BUNDLE_BY_FRAMEWORK)) {
    catalogs[framework] = buildCatalog(await readBundle(rootDir, file));
  }

  const platformsByAttackId = new Map(
    [...catalogs["attack-enterprise"].techniques].map(([id, t]) => [id, t.platforms])
  );

  const tacticShortnameByAttackId = new Map();
  for (const catalog of Object.values(catalogs)) {
    for (const [id, t] of catalog.tactics) tacticShortnameByAttackId.set(id, t.shortname);
  }

  const attackVersions = Object.fromEntries(
    Object.entries(catalogs).map(([framework, c]) => [framework, c.version])
  );

  return { catalogs, platformsByAttackId, tacticShortnameByAttackId, attackVersions };
}
