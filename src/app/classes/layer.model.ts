/**
 * Format de layer D3FEND, inspiré de celui d'ATT&CK Navigator. Ne contient que des
 * annotations : les données du référentiel sont jointes sur `techniqueID` au rendu.
 */
export interface D3fendLayer {
  versions: {
    /** semver du format de layer, indépendant de la version D3FEND */
    layer: string;
    navigator: string;
    /** version D3FEND utilisée à l'export, ex. "1.6.0" */
    d3fend: string;
  };
  name: string;
  description: string;
  domain: "d3fend";
  sorting: number;
  layout: {
    layout: "side" | "flat" | "mini";
    aggregateFunction: "average" | "min" | "max" | "sum";
    showID: boolean;
    showName: boolean;
    showAggregateScores: boolean;
    countUnscored: boolean;
  };
  hideDisabled: boolean;
  techniques: LayerTechniqueAnnotation[];
  /** état d'expansion par noeud (la hiérarchie D3FEND a plusieurs niveaux) */
  expandedNodeIds: string[];
  gradient: {
    colors: string[];
    minValue: number;
    maxValue: number;
  };
  legendItems: { label: string; color: string }[];
  metadata: { name: string; value: string }[];
  links: { label: string; url: string }[];
  filters: {
    artifactTypes: string[];
    /** BETA — plateformes ATT&CK Enterprise des techniques offensives contrées */
    platforms: string[];
  };
  selectTechniquesAcrossTactics: boolean;
  selectSubtechniquesWithParent: boolean;
}

export interface LayerTechniqueAnnotation {
  techniqueID: string;
  tacticID: string;
  color: string;
  comment: string;
  enabled: boolean;
  score: number | null;
  metadata: { name: string; value: string }[];
  links: { label: string; url: string }[];
}
