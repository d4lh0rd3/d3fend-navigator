import { Component, ElementRef, HostListener, computed, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { LayerService } from "../services/layer.service";
import { PlatformLookupService } from "../services/platform-lookup.service";
import { TranslationService } from "../services/translation.service";

/** BETA — filtre par plateforme ATT&CK Enterprise (voir data/README.md §7). */
@Component({
  selector: "app-platform-filter",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./platform-filter.component.html",
  styleUrl: "./platform-filter.component.scss"
})
export class PlatformFilterComponent {
  private readonly layerService = inject(LayerService);
  private readonly platformLookup = inject(PlatformLookupService);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  readonly i18n = inject(TranslationService);

  readonly isOpen = signal(false);
  readonly allPlatforms = this.platformLookup.allPlatforms;

  readonly selectedPlatforms = computed(() => new Set(this.layerService.layer().filters.platforms));

  @HostListener("document:click", ["$event"])
  onDocumentClick(event: MouseEvent): void {
    if (this.isOpen() && !this.elementRef.nativeElement.contains(event.target as Node)) {
      this.isOpen.set(false);
    }
  }

  toggleOpen(): void {
    this.isOpen.update((v) => !v);
  }

  togglePlatform(name: string): void {
    const current = new Set(this.selectedPlatforms());
    if (current.has(name)) {
      current.delete(name);
    } else {
      current.add(name);
    }
    this.layerService.setPlatformFilters([...current]);
  }

  clearAll(event: Event): void {
    event.stopPropagation();
    this.layerService.setPlatformFilters([]);
  }
}
