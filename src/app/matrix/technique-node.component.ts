import { Component, Input, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { TechniqueNode } from "./technique-node.model";
import { LayerService } from "../services/layer.service";
import { SearchService } from "../services/search.service";
import { ContextMenuService } from "../services/context-menu.service";
import { ArtifactLookupService } from "../services/artifact-lookup.service";
import { PlatformLookupService } from "../services/platform-lookup.service";
import { TechniqueTreeService } from "../services/technique-tree.service";
import { selfMatches } from "./technique-match";
import { VisibilityContext, isFilterActive, subtreeRelevant } from "./technique-visibility";
import { flattenVisibleIds } from "./technique-tree";

/**
 * Rendu récursif d'un noeud de technique. Quand un filtre est actif, un noeud menant à une
 * descendante correspondante est déplié automatiquement, sans modifier l'état d'expansion
 * enregistré dans le layer.
 */
@Component({
  selector: "app-technique-node",
  standalone: true,
  imports: [CommonModule, TechniqueNodeComponent],
  templateUrl: "./technique-node.component.html",
  styleUrl: "./technique-node.component.scss"
})
export class TechniqueNodeComponent {
  @Input({ required: true }) node!: TechniqueNode;

  private readonly layerService = inject(LayerService);
  private readonly searchService = inject(SearchService);
  private readonly contextMenuService = inject(ContextMenuService);
  private readonly artifactLookup = inject(ArtifactLookupService);
  private readonly platformLookup = inject(PlatformLookupService);
  private readonly techniqueTree = inject(TechniqueTreeService);

  get hasChildren(): boolean {
    return this.node.children.length > 0;
  }

  get isSelected(): boolean {
    return this.layerService.isSelected(this.node.id);
  }

  get rowColor(): string | null {
    return this.layerService.annotationFor(this.node.id)?.color || null;
  }

  get isMatch(): boolean {
    const query = this.searchService.query();
    return query.trim().length > 0 && selfMatches(this.node, query);
  }

  get isVisible(): boolean {
    const ctx = this.visibilityContext();
    return !isFilterActive(ctx) || subtreeRelevant(this.node, ctx);
  }

  get isExpanded(): boolean {
    if (this.layerService.isExpanded(this.node.id)) return true;
    const ctx = this.visibilityContext();
    if (!isFilterActive(ctx) || !this.hasChildren) return false;
    return this.node.children.some((child) => subtreeRelevant(child, ctx));
  }

  /**
   * Clic : déplie/replie + sélection unique. Ctrl/Cmd+clic : ajoute/retire de la sélection.
   * Shift+clic : sélectionne la plage visible depuis l'ancre, dans la même tactique
   * uniquement (sinon comportement d'un clic simple).
   */
  onRowClick(event: MouseEvent): void {
    if (event.shiftKey && this.tryShiftRangeSelect()) {
      return;
    }

    if (event.ctrlKey || event.metaKey) {
      this.layerService.toggleSelection(this.node.id, this.node.tacticId);
      return;
    }

    if (this.hasChildren) {
      this.layerService.toggleExpanded(this.node.id);
    }
    this.layerService.select(this.node.id, this.node.tacticId);
  }

  private tryShiftRangeSelect(): boolean {
    const anchorId = this.layerService.anchorTechniqueId;
    const anchorTacticId = this.layerService.anchorTacticId;
    if (!anchorId || anchorTacticId !== this.node.tacticId) {
      return false;
    }

    const roots = this.techniqueTree.treeByTactic().get(this.node.tacticId) ?? [];
    const visible = flattenVisibleIds(roots, (id) => this.layerService.isExpanded(id));
    const ids = visible.map((v) => v.id);
    const from = ids.indexOf(anchorId);
    const to = ids.indexOf(this.node.id);
    if (from === -1 || to === -1) {
      return false;
    }

    const [start, end] = from <= to ? [from, to] : [to, from];
    this.layerService.selectRange(visible.slice(start, end + 1));
    return true;
  }

  onContextMenu(event: MouseEvent): void {
    event.preventDefault();
    this.contextMenuService.open({
      x: event.clientX,
      y: event.clientY,
      tacticId: this.node.tacticId,
      techniqueLocalName: this.node.localName
    });
  }

  private visibilityContext(): VisibilityContext {
    return {
      query: this.searchService.query(),
      selectedArtifactIds: new Set(this.layerService.layer().filters.artifactTypes),
      artifactIdByRelationId: this.artifactLookup.artifactIdByRelationId(),
      selectedPlatforms: new Set(this.layerService.layer().filters.platforms),
      platformsByMappingId: this.platformLookup.platformsByMappingId()
    };
  }
}
