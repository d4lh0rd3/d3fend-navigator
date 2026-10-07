import { TechniqueNode } from "./technique-node.model";

function normalize(s: string): string {
  return s.toLowerCase();
}

/** La technique elle-même correspond (ID ou nom), indépendamment de ses enfants. */
export function selfMatches(node: { id: string; name: string }, query: string): boolean {
  const q = query.trim();
  if (!q) return true;
  const normalizedQuery = normalize(q);
  return normalize(node.id).includes(normalizedQuery) || normalize(node.name).includes(normalizedQuery);
}

/** La technique ou au moins une de ses descendantes (à tout niveau) correspond. */
export function subtreeMatches(node: TechniqueNode, query: string): boolean {
  if (selfMatches(node, query)) return true;
  return node.children.some((child) => subtreeMatches(child, query));
}
