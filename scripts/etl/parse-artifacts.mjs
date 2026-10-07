// Extrait DigitalArtifact[] et ArtifactRelationship[] depuis d3fend.json (voir data/README.md §3).
// Toute propriété d3f:* d'un noeud technique, hors SKIP_PREDICATES, qui référence un autre noeud
// est traitée comme une relation vers un artefact. Les prédicats rencontrés sont journalisés dans
// public/data/etl-audit.json pour relecture.

import path from "node:path";
import { readJson, localName } from "./lib/util.mjs";

// Prédicats de métadonnées, pas des relations vers un artefact (voir data/README.md §3).
const SKIP_PREDICATES = new Set([
  "definition", "d3fend-id", "attack-id", "cwe-id", "capec-id",
  "kb-article", "kb-reference", "kb-reference-title", "kb-reference-of",
  "kb-abstract", "kb-organization", "kb-author", "kb-mitre-analysis",
  "contributor", "published", "synonym", "narrower", "broader",
  "member-of", "weakness-of", "pref-label", "d3fend-comment",
  "d3fend-annotation", "control-name", "created", "version",
  "release-date", "exactly", "use-limits", "display-baseurl",
  "provider", "description", "has-link", "related",
  "display-order", "display-priority", "enables", "extends",
  "archived-at", "has-member",
]);

function* refsOf(value) {
  if (Array.isArray(value)) {
    for (const v of value) yield* refsOf(v);
  } else if (value && typeof value === "object" && value["@id"]) {
    yield value["@id"];
  }
}

export async function parseArtifacts(rawDir, techniques) {
  const ontology = await readJson(path.join(rawDir, "d3fend.json"));
  const nodesById = new Map(ontology["@graph"].map((n) => [n["@id"], n]));

  const artifactsById = new Map(); // id (local name) -> DigitalArtifact
  const relationships = [];
  const observedPredicates = new Set();
  let relCounter = 0;

  function ensureArtifact(refId) {
    const id = localName(refId);
    if (artifactsById.has(id)) return id;
    const node = nodesById.get(refId);
    artifactsById.set(id, {
      id,
      name: node?.["rdfs:label"] ?? id,
      parentId: node?.["rdfs:subClassOf"]
        ? localName(Array.isArray(node["rdfs:subClassOf"]) ? node["rdfs:subClassOf"][0] : node["rdfs:subClassOf"])
        : null,
      definition: node?.["d3f:definition"] ?? undefined,
    });
    return id;
  }

  for (const tech of techniques) {
    const techNodeId = `d3f:${tech._localName}`;
    const node = nodesById.get(techNodeId);
    if (!node) continue;

    for (const [key, value] of Object.entries(node)) {
      if (!key.startsWith("d3f:")) continue;
      const predicate = key.slice("d3f:".length);
      if (SKIP_PREDICATES.has(predicate)) continue;

      const refs = [...refsOf(value)];
      if (refs.length === 0) continue; // valeur littérale (string/bool/nombre) : pas une relation

      observedPredicates.add(predicate);
      for (const ref of refs) {
        const artifactId = ensureArtifact(ref);
        relCounter += 1;
        relationships.push({
          id: `rel-${relCounter}`,
          techniqueId: tech.id,
          predicate,
          artifactId,
        });
      }
    }
  }

  return {
    artifacts: [...artifactsById.values()],
    relationships,
    observedPredicates: [...observedPredicates].sort(),
  };
}
