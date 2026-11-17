/**
 * Mapping D3FEND ↔ technique offensive. Il est inféré par MITRE via une chaîne d'artefacts
 * partagés (technique défensive → artefact ~ artefact ← technique offensive), conservée
 * ici car elle explique le mapping (voir data/README.md §4).
 */
export interface AttackMapping {
  id: string;
  d3fendTechniqueId: string;

  /** framework offensif source, dérivé de `framework_root_iri` (ex. "attack-enterprise") */
  offensiveFramework: string;
  offensiveTechniqueId: string;
  offensiveTechniqueName: string;
  /** technique parente côté framework offensif, si sous-technique (ex. ATT&CK T1003 pour T1003.005) */
  offensiveParentTechniqueId: string | null;
  offensiveTacticId: string | null;
  offensiveTacticName: string | null;
  /** BETA — x_mitre_platforms du bundle STIX ATT&CK Enterprise (vide pour ICS/SPARTA) */
  offensivePlatforms: string[];

  /**
   * Statut de la technique offensive dans la version d'ATT&CK du dataset
   * (scripts/etl/resolve-attack-mappings.mjs) :
   * - "active" : identifiant D3FEND toujours valide ;
   * - "remapped" : technique révoquée par ATT&CK, remplacée par son successeur ;
   * - "deprecated" / "revoked" (sans remplaçant) / "unknown" : absente d'ATT&CK Navigator,
   *   exclue des exports ATT&CK. Toujours "active" pour SPARTA.
   */
  offensiveTechniqueStatus: "active" | "remapped" | "deprecated" | "revoked" | "unknown";
  /** identifiant fourni par D3FEND, si remplacé (ex. "T1562.003" pour T1690) */
  originalOffensiveTechniqueId: string | null;
  /** tactique fournie par D3FEND, si elle n'est plus une tactique de la technique dans ATT&CK */
  originalOffensiveTacticId: string | null;

  /** verbe côté défensif reliant la technique D3FEND à l'artefact partagé (ex. "hardens") */
  viaDefensiveRelation: string;
  viaDefensiveArtifactId: string;
  /** verbe côté offensif reliant la technique offensive à l'artefact partagé (ex. "accesses") */
  viaOffensiveRelation: string;
  viaOffensiveArtifactName: string;
}
