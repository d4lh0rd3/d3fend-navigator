// Construit Tactic[] et Technique[] à partir de d3fend.csv (squelette hiérarchique) et
// d3fend.json (définitions officielles des tactiques + display-order). Voir data/README.md §1-2.

import path from "node:path";
import { parseCsv, readJson, localName } from "./lib/util.mjs";

const TACTIC_ORDER = ["Model", "Harden", "Detect", "Isolate", "Deceive", "Evict", "Restore"];

export async function parseHierarchy(rawDir) {
  const csvText = await (await import("node:fs/promises")).readFile(
    path.join(rawDir, "d3fend.csv"),
    "utf-8"
  );
  const rows = parseCsv(csvText);
  const ontology = await readJson(path.join(rawDir, "d3fend.json"));
  const nodesById = new Map(ontology["@graph"].map((n) => [n["@id"], n]));

  // -- tactiques : lues depuis le JSON-LD (d3f:DefensiveTactic), pas depuis le CSV --
  const tactics = TACTIC_ORDER.map((name) => {
    const node = nodesById.get(`d3f:${name}`);
    if (!node) throw new Error(`tactique "${name}" introuvable dans d3fend.json`);
    return {
      id: name,
      name: node["rdfs:label"] ?? name,
      definition: node["d3f:definition"] ?? "",
      displayOrder: node["d3f:display-order"] ?? TACTIC_ORDER.indexOf(name),
    };
  });

  // -- techniques : arbre reconstruit depuis la position des colonnes du CSV --
  // index d3fend-id -> noeud JSON-LD, pour retrouver le nom local (@id) et display-order
  const nodeByD3fendId = new Map();
  for (const node of ontology["@graph"]) {
    const id = node["d3f:d3fend-id"];
    if (id) nodeByD3fendId.set(id, node);
  }

  const techniques = [];
  const stack = []; // [{ depth, id }]
  for (const row of rows) {
    const id = row["ID"];
    let depth;
    let name;
    if (row["D3FEND Technique"]) {
      depth = 0;
      name = row["D3FEND Technique"];
    } else if (row["D3FEND Technique Level 0"]) {
      depth = 1;
      name = row["D3FEND Technique Level 0"];
    } else if (row["D3FEND Technique Level 1"]) {
      depth = 2;
      name = row["D3FEND Technique Level 1"];
    } else {
      throw new Error(`ligne CSV sans colonne technique renseignée pour l'ID ${id}`);
    }

    while (stack.length && stack[stack.length - 1].depth >= depth) stack.pop();
    const parentId = stack.length ? stack[stack.length - 1].id : null;
    stack.push({ depth, id });

    const node = nodeByD3fendId.get(id);
    // le JSON-LD est plus complet que le CSV (colonne Definition parfois vide)
    const definition = node?.["d3f:definition"] || row["Definition"] || null;
    techniques.push({
      id,
      name,
      definition,
      tacticId: row["D3FEND Tactic"],
      parentId,
      depth,
      displayOrder: node?.["d3f:display-order"] ?? null,
      artifactRelationIds: [], // rempli par build-dataset.mjs après parse-artifacts
      attackMappingIds: [], // rempli par build-dataset.mjs après parse-attack-mappings
      _localName: node ? localName(node["@id"]) : null, // usage interne ETL uniquement
    });
  }

  return { tactics, techniques };
}
