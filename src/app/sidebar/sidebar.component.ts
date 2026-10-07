import { Component, computed, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { D3fendDataService } from "../services/d3fend-data.service";
import { SearchService } from "../services/search.service";
import { LayerService } from "../services/layer.service";
import { ViewPreferencesService } from "../services/view-preferences.service";
import { ArtifactFilterComponent } from "../artifact-filter/artifact-filter.component";
import { PlatformFilterComponent } from "../platform-filter/platform-filter.component";
import { TranslationService } from "../services/translation.service";

@Component({
  selector: "app-sidebar",
  standalone: true,
  imports: [CommonModule, ArtifactFilterComponent, PlatformFilterComponent],
  templateUrl: "./sidebar.component.html",
  styleUrl: "./sidebar.component.scss"
})
export class SidebarComponent {
  private readonly dataService = inject(D3fendDataService);
  private readonly searchService = inject(SearchService);
  private readonly layerService = inject(LayerService);
  private readonly viewPreferences = inject(ViewPreferencesService);
  readonly i18n = inject(TranslationService);

  readonly query = this.searchService.query;
  readonly showMappingChain = this.viewPreferences.showMappingChain;

  readonly matchCount = computed(() => {
    const q = this.query().trim().toLowerCase();
    const dataset = this.dataService.dataset();
    if (!q || !dataset) return null;
    return dataset.techniques.filter(
      (t) => t.id.toLowerCase().includes(q) || t.name.toLowerCase().includes(q)
    ).length;
  });

  private readonly expandableIds = computed(() => {
    const dataset = this.dataService.dataset();
    if (!dataset) return [] as string[];
    const parentIds = new Set(
      dataset.techniques.filter((t) => t.parentId).map((t) => t.parentId as string)
    );
    return [...parentIds];
  });

  readonly allExpanded = computed(() => {
    const expandable = this.expandableIds();
    if (expandable.length === 0) return false;
    const expandedIds = new Set(this.layerService.layer().expandedNodeIds);
    return expandable.every((id) => expandedIds.has(id));
  });

  onInput(value: string): void {
    this.searchService.setQuery(value);
  }

  onClear(): void {
    this.searchService.clear();
  }

  onToggleExpandAll(): void {
    this.layerService.setExpandedIds(this.allExpanded() ? [] : this.expandableIds());
  }

  onToggleShowMappingChain(value: boolean): void {
    this.viewPreferences.setShowMappingChain(value);
  }
}
