import { D3fendLayer, LayerTechniqueAnnotation } from "../classes/layer.model";
import { D3fendDataset } from "../classes/dataset.model";
import { AttackMapping } from "../classes/attack-mapping.model";
import { AttackNavigatorLayer, AttackNavigatorTechnique } from "./attack-navigator-layer.model";

const NAVIGATOR_MIN_VERSION = "4.9.0";
const LAYER_FORMAT_VERSION = "4.5";

export type AttackFramework = "attack-enterprise" | "attack-ics";

/** SPARTA est exclu : ce n'est pas un domaine supporté par ATT&CK Navigator. */
const DOMAIN_BY_FRAMEWORK: Record<AttackFramework, { domain: AttackNavigatorLayer["domain"]; label: string }> = {
  "attack-enterprise": { domain: "enterprise-attack", label: "ATT&CK Enterprise" },
  "attack-ics": { domain: "ics-attack", label: "ATT&CK ICS" }
};

export interface BuildAttackLayerOptions {
  exportedLayerName: string;
  description: string;
  sourceMetadataLabel: string;
}

function hasMeaningfulAnnotation(a: LayerTechniqueAnnotation): boolean {
  return a.color !== "" || a.score !== null || a.comment !== "";
}

interface PendingTechnique {
  techniqueID: string;
  tactic: string;
  color: string;
  score: number | null;
  comment: string;
  enabled: boolean;
  sources: string[];
}

/**
 * Regroupe les techniques D3FEND annotées par paire (technique ATT&CK, tactique) pour un
 * framework donné. Quand plusieurs techniques D3FEND visent la même paire :
 * - couleur : celle de la première technique rencontrée ;
 * - score : somme des scores renseignés ;
 * - commentaire : concaténation, chaque contribution préfixée par l'ID D3FEND source.
 */
function buildPendingTechniques(
  annotated: LayerTechniqueAnnotation[],
  attackMappings: AttackMapping[],
  attackTacticShortnames: Record<string, string>,
  framework: AttackFramework
): Map<string, PendingTechnique> {
  const mappingsByD3fendId = new Map<string, AttackMapping[]>();
  for (const m of attackMappings) {
    if (m.offensiveFramework !== framework) continue;
    const list = mappingsByD3fendId.get(m.d3fendTechniqueId);
    if (list) {
      list.push(m);
    } else {
      mappingsByD3fendId.set(m.d3fendTechniqueId, [m]);
    }
  }

  const pendingByKey = new Map<string, PendingTechnique>();

  for (const annotation of annotated) {
    const mappings = mappingsByD3fendId.get(annotation.techniqueID) ?? [];
    const seenPairsForThisSource = new Set<string>();

    for (const m of mappings) {
      const shortname = m.offensiveTacticId ? attackTacticShortnames[m.offensiveTacticId] : undefined;
      if (!shortname) continue;

      const key = `${m.offensiveTechniqueId}|${shortname}`;
      // plusieurs chaînes d'artefacts peuvent produire la même paire pour une même source
      if (seenPairsForThisSource.has(key)) continue;
      seenPairsForThisSource.add(key);

      const commentLine = annotation.comment ? `[${annotation.techniqueID}] ${annotation.comment}` : "";

      const existing = pendingByKey.get(key);
      if (!existing) {
        pendingByKey.set(key, {
          techniqueID: m.offensiveTechniqueId,
          tactic: shortname,
          color: annotation.color,
          score: annotation.score,
          comment: commentLine,
          enabled: annotation.enabled,
          sources: [annotation.techniqueID]
        });
        continue;
      }

      existing.sources.push(annotation.techniqueID);
      if (annotation.score !== null) {
        existing.score = (existing.score ?? 0) + annotation.score;
      }
      if (commentLine) {
        existing.comment = existing.comment ? `${existing.comment}\n---\n${commentLine}` : commentLine;
      }
    }
  }

  return pendingByKey;
}

/**
 * @throws si aucune technique n'est annotée, ou si aucune ne correspond à une technique
 *   du domaine demandé
 */
export function buildAttackNavigatorLayer(
  layer: D3fendLayer,
  dataset: D3fendDataset,
  framework: AttackFramework,
  options: BuildAttackLayerOptions
): AttackNavigatorLayer {
  const annotated = layer.techniques.filter(hasMeaningfulAnnotation);
  if (annotated.length === 0) {
    throw new Error("NO_ANNOTATED_TECHNIQUE");
  }

  const { domain } = DOMAIN_BY_FRAMEWORK[framework];
  const pendingByKey = buildPendingTechniques(annotated, dataset.attackMappings, dataset.attackTacticShortnames, framework);
  if (pendingByKey.size === 0) {
    throw new Error("NO_ATTACK_MAPPING_FOUND");
  }

  const techniques: AttackNavigatorTechnique[] = [...pendingByKey.values()].map((p) => {
    const technique: AttackNavigatorTechnique = {
      techniqueID: p.techniqueID,
      tactic: p.tactic,
      color: p.color,
      comment: p.comment,
      enabled: p.enabled,
      metadata: [{ name: options.sourceMetadataLabel, value: p.sources.join(", ") }]
    };
    if (p.score !== null) {
      technique.score = p.score;
    }
    return technique;
  });

  return {
    name: options.exportedLayerName,
    versions: { navigator: NAVIGATOR_MIN_VERSION, layer: LAYER_FORMAT_VERSION },
    domain,
    description: options.description,
    sorting: 0,
    layout: {
      layout: "side",
      showID: false,
      showName: true,
      showAggregateScores: false,
      countUnscored: false,
      aggregateFunction: "average"
    },
    hideDisabled: false,
    techniques,
    gradient: { ...layer.gradient },
    legendItems: layer.legendItems.map((l) => ({ ...l })),
    metadata: [],
    links: [],
    selectTechniquesAcrossTactics: true,
    selectSubtechniquesWithParent: false
  };
}

export function attackFrameworkLabel(framework: AttackFramework): string {
  return DOMAIN_BY_FRAMEWORK[framework].label;
}
