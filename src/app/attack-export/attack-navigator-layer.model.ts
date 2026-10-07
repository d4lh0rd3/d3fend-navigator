/**
 * Sous-ensemble du format de layer ATT&CK Navigator v4.5
 * (mitre-attack/attack-navigator, layers/spec/v4.5/layerformat.md).
 */
export interface AttackNavigatorLayer {
  name: string;
  versions: {
    navigator: string;
    layer: string;
  };
  domain: "enterprise-attack" | "ics-attack" | "mobile-attack";
  description: string;
  sorting: number;
  layout: {
    layout: "side" | "flat" | "mini";
    showID: boolean;
    showName: boolean;
    showAggregateScores: boolean;
    countUnscored: boolean;
    aggregateFunction: "average" | "min" | "max" | "sum";
  };
  hideDisabled: boolean;
  techniques: AttackNavigatorTechnique[];
  gradient: {
    colors: string[];
    minValue: number;
    maxValue: number;
  };
  legendItems: { label: string; color: string }[];
  metadata: { name: string; value: string }[];
  links: { label: string; url: string }[];
  selectTechniquesAcrossTactics: boolean;
  selectSubtechniquesWithParent: boolean;
}

export interface AttackNavigatorTechnique {
  techniqueID: string;
  /** shortname de la tactique (ex. "collection"), pas le nom affiché ni le TA-id */
  tactic: string;
  color: string;
  comment: string;
  enabled: boolean;
  /** omis (et non null) pour une technique sans score, conformément à la spec */
  score?: number;
  metadata: { name: string; value: string }[];
}
