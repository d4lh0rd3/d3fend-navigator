import { TechniqueNode } from "./technique-node.model";
import { selfMatches } from "./technique-match";

/** Filtres de la matrice (recherche, artefacts, plateformes), combinés en ET. */
export interface VisibilityContext {
  query: string;
  selectedArtifactIds: ReadonlySet<string>;
  artifactIdByRelationId: ReadonlyMap<string, string>;
  /** BETA */
  selectedPlatforms: ReadonlySet<string>;
  /** BETA */
  platformsByMappingId: ReadonlyMap<string, string[]>;
}

export function isFilterActive(ctx: VisibilityContext): boolean {
  return ctx.query.trim().length > 0 || ctx.selectedArtifactIds.size > 0 || ctx.selectedPlatforms.size > 0;
}

function selfMatchesArtifactFilter(node: TechniqueNode, ctx: VisibilityContext): boolean {
  if (ctx.selectedArtifactIds.size === 0) return true;
  return node.artifactRelationIds.some((relId) => {
    const artifactId = ctx.artifactIdByRelationId.get(relId);
    return artifactId !== undefined && ctx.selectedArtifactIds.has(artifactId);
  });
}

function selfMatchesPlatformFilter(node: TechniqueNode, ctx: VisibilityContext): boolean {
  if (ctx.selectedPlatforms.size === 0) return true;
  return node.attackMappingIds.some((mapId) => {
    const platforms = ctx.platformsByMappingId.get(mapId);
    return platforms?.some((p) => ctx.selectedPlatforms.has(p)) ?? false;
  });
}

/** La technique elle-même satisfait tous les filtres actifs. */
export function selfRelevant(node: TechniqueNode, ctx: VisibilityContext): boolean {
  return selfMatches(node, ctx.query) && selfMatchesArtifactFilter(node, ctx) && selfMatchesPlatformFilter(node, ctx);
}

/** La technique ou au moins une de ses descendantes (à tout niveau) est pertinente. */
export function subtreeRelevant(node: TechniqueNode, ctx: VisibilityContext): boolean {
  if (selfRelevant(node, ctx)) return true;
  return node.children.some((child) => subtreeRelevant(child, ctx));
}
