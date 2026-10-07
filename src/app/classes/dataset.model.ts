import { Tactic } from "./tactic.model";
import { Technique } from "./technique.model";
import { DigitalArtifact, ArtifactRelationship } from "./digital-artifact.model";
import { AttackMapping } from "./attack-mapping.model";

/** Forme du JSON produit par scripts/etl/build-dataset.mjs. */
export interface D3fendDataset {
  d3fendVersion: string;
  generatedAt: string;
  tactics: Tactic[];
  techniques: Technique[];
  artifacts: DigitalArtifact[];
  artifactRelationships: ArtifactRelationship[];
  attackMappings: AttackMapping[];
  /** TA-id ATT&CK (ex. "TA0009") -> shortname (ex. "collection"), Enterprise et ICS */
  attackTacticShortnames: Record<string, string>;
}

/** Forme de public/data/versions.json. */
export interface VersionsManifest {
  versions: { d3fend: string; dataset: string; generatedAt: string }[];
}
