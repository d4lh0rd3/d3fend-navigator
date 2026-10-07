/**
 * Un artefact numérique du DAO (Digital Artifact Ontology), catalogue séparé mais lié
 * aux techniques via ArtifactRelationship (voir data/README.md §3).
 */
export interface DigitalArtifact {
  /** nom de classe RDF local, ex. "Credential" — pas de préfixe "D3-" */
  id: string;
  name: string;
  /** le DAO est lui-même une taxonomie (rdfs:subClassOf) */
  parentId: string | null;
  definition?: string;
}

/**
 * Relation technique → artefact numérique. Le prédicat est extrait tel quel de l'ontologie
 * et volontairement non énuméré (la liste évolue avec les versions de D3FEND).
 */
export interface ArtifactRelationship {
  id: string;
  techniqueId: string;
  /** ex. "modifies", "hardens", "regenerates" */
  predicate: string;
  artifactId: string;
}
