export interface Tactic {
  /** nom local du noeud RDF, ex. "Harden" */
  id: string;
  name: string;
  definition: string;
  /** d3f:display-order */
  displayOrder: number;
}
