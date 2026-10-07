import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { LayerService } from "../services/layer.service";
import { D3fendDataService } from "../services/d3fend-data.service";
import { TranslationService } from "../services/translation.service";

@Component({
  selector: "app-tabs",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./tabs.component.html",
  styleUrl: "./tabs.component.scss"
})
export class TabsComponent {
  private readonly layerService = inject(LayerService);
  private readonly dataService = inject(D3fendDataService);
  readonly i18n = inject(TranslationService);

  readonly tabs = this.layerService.tabs;
  readonly activeTabId = this.layerService.activeTabId;

  onSelect(tabId: string): void {
    this.layerService.switchTo(tabId);
  }

  onClose(event: Event, tabId: string): void {
    event.stopPropagation();
    if (this.layerService.isTabDirty(tabId)) {
      const confirmed = window.confirm(this.i18n.t("tabs.confirmClose"));
      if (!confirmed) return;
    }
    this.layerService.closeTab(tabId);
  }

  onNewTab(): void {
    const version = this.dataService.dataset()?.d3fendVersion;
    if (version) {
      this.layerService.reset(version);
    }
  }
}
