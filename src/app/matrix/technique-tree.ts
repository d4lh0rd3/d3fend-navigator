import { Technique } from "../classes/technique.model";
import { TechniqueNode } from "./technique-node.model";

/** Arbre de techniques par tactique, trié par displayOrder puis nom. */
export function buildTreesByTactic(techniques: Technique[]): Map<string, TechniqueNode[]> {
  const byId = new Map<string, TechniqueNode>();
  for (const t of techniques) {
    byId.set(t.id, { ...t, children: [] });
  }

  const rootsByTactic = new Map<string, TechniqueNode[]>();
  for (const t of techniques) {
    const node = byId.get(t.id)!;
    if (t.parentId) {
      byId.get(t.parentId)?.children.push(node);
      continue;
    }
    if (!rootsByTactic.has(t.tacticId)) {
      rootsByTactic.set(t.tacticId, []);
    }
    rootsByTactic.get(t.tacticId)!.push(node);
  }

  const sortRecursively = (nodes: TechniqueNode[]): void => {
    nodes.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0) || a.name.localeCompare(b.name));
    for (const n of nodes) sortRecursively(n.children);
  };
  rootsByTactic.forEach(sortRecursively);

  return rootsByTactic;
}

/** Aplatit les noeuds visibles dans l'ordre d'affichage (seuls les noeuds dépliés sont
 *  parcourus), pour la sélection de plage au Shift+clic. */
export function flattenVisibleIds(
  nodes: TechniqueNode[],
  isExpanded: (techniqueId: string) => boolean
): { id: string; tacticId: string }[] {
  const result: { id: string; tacticId: string }[] = [];
  const walk = (list: TechniqueNode[]): void => {
    for (const node of list) {
      result.push({ id: node.id, tacticId: node.tacticId });
      if (node.children.length > 0 && isExpanded(node.id)) {
        walk(node.children);
      }
    }
  };
  walk(nodes);
  return result;
}
