/** Technique D3FEND, entité récursive (les sous-techniques sont des techniques). */
export interface Technique {
  /** ex. "D3-CERO" */
  id: string;
  name: string;
  /** souvent null sur les noeuds "groupe" non-feuilles */
  definition: string | null;
  tacticId: string;
  parentId: string | null;
  /** 0 = racine sous la tactique */
  depth: number;
  /** d3f:display-order, si présent */
  displayOrder: number | null;
  artifactRelationIds: string[];
  attackMappingIds: string[];
  /** nom local dans l'ontologie (ex. "StrongPasswordPolicy"), pour l'URL de la page officielle ;
   *  null pour les noeuds sans page dédiée */
  localName: string | null;
}
