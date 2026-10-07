// Construit AttackMapping[] depuis d3fend-full-mappings.json (résultat SPARQL 1.1).
// Le mapping D3FEND -> technique offensive est inféré via une chaîne d'artefacts partagés,
// pas un prédicat direct. Voir data/README.md §4.

import path from "node:path";
import { readJson, localName } from "./lib/util.mjs";

// framework_root_iri -> identifiant court (un framework inconnu devient `unrecognized-<nom>`).
const FRAMEWORK_BY_ROOT_LOCAL_NAME = {
  ATTACKEnterpriseTechnique: "attack-enterprise",
  ATTACKICSTechnique: "attack-ics",
  SPARTATechnique: "sparta",
};

function frameworkOf(rootIri) {
  const name = localName(rootIri);
  return FRAMEWORK_BY_ROOT_LOCAL_NAME[name] ?? `unrecognized-${name}`;
}

export async function parseAttackMappings(rawDir, techniques, platformsByAttackId = new Map()) {
  const data = await readJson(path.join(rawDir, "d3fend-full-mappings.json"));
  const bindings = data.results.bindings;

  // d3fend-full-mappings référence les techniques D3FEND par leur nom local (URI def_tech),
  // pas par leur D3-ID : on construit l'index inverse depuis techniques[]._localName.
  const d3fendIdByLocalName = new Map(techniques.map((t) => [t._localName, t.id]));

  const mappings = [];
  const unresolved = new Set();
  let counter = 0;

  for (const b of bindings) {
    const defLocalName = localName(b.def_tech?.value);
    const d3fendTechniqueId = d3fendIdByLocalName.get(defLocalName);
    if (!d3fendTechniqueId) {
      unresolved.add(defLocalName);
      continue;
    }

    counter += 1;
    const offensiveTechniqueId = b.off_tech_id?.value ?? localName(b.off_tech?.value);
    mappings.push({
      id: `map-${counter}`,
      d3fendTechniqueId,
      offensiveFramework: frameworkOf(b.framework_root_iri?.value),
      offensiveTechniqueId,
      // BETA, ATT&CK Enterprise uniquement
      offensivePlatforms: platformsByAttackId.get(offensiveTechniqueId) ?? [],
      offensiveTechniqueName: b.off_tech_label?.value ?? "",
      offensiveParentTechniqueId:
        b.off_tech_parent_is_toplevel?.value === "true" ? null : localName(b.off_tech_parent?.value) ?? null,
      offensiveTacticId: b.off_tactic?.value ? localName(b.off_tactic.value) : null,
      offensiveTacticName: b.off_tactic_label?.value ?? null,
      viaDefensiveRelation: b.def_artifact_rel_label?.value ?? "",
      viaDefensiveArtifactId: localName(b.def_artifact?.value),
      viaOffensiveRelation: b.off_artifact_rel_label?.value ?? "",
      viaOffensiveArtifactName: b.off_artifact_label?.value ?? "",
    });
  }

  return { mappings, unresolvedTechniqueLocalNames: [...unresolved].sort() };
}
