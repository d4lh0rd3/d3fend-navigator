import { Component, ElementRef, HostListener, computed, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { LayerService } from "../services/layer.service";
import { ArtifactLookupService } from "../services/artifact-lookup.service";
import { TranslationService } from "../services/translation.service";

@Component({
  selector: "app-artifact-filter",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./artifact-filter.component.html",
  styleUrl: "./artifact-filter.component.scss"
})
export class ArtifactFilterComponent {
  private readonly layerService = inject(LayerService);
  private readonly artifactLookup = inject(ArtifactLookupService);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  readonly i18n = inject(TranslationService);

  readonly isOpen = signal(false);
  readonly filterQuery = signal("");

  readonly selectedIds = computed(() => new Set(this.layerService.layer().filters.artifactTypes));

  readonly visibleArtifacts = computed(() => {
    const all = [...this.artifactLookup.artifacts()].sort((a, b) => a.name.localeCompare(b.name));
    const q = this.filterQuery().trim().toLowerCase();
    if (!q) return all;
    return all.filter((a) => a.name.toLowerCase().includes(q));
  });

  @HostListener("document:click", ["$event"])
  onDocumentClick(event: MouseEvent): void {
    if (this.isOpen() && !this.elementRef.nativeElement.contains(event.target as Node)) {
      this.isOpen.set(false);
    }
  }

  toggleOpen(): void {
    this.isOpen.update((v) => !v);
  }

  toggleArtifact(id: string): void {
    const current = new Set(this.selectedIds());
    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }
    this.layerService.setArtifactTypeFilters([...current]);
  }

  clearAll(event: Event): void {
    event.stopPropagation();
    this.layerService.setArtifactTypeFilters([]);
  }

  onFilterQueryInput(value: string): void {
    this.filterQuery.set(value);
  }
}
