import { Injectable, inject } from "@angular/core";
import { D3fendDataService } from "../services/d3fend-data.service";
import { LayerService } from "../services/layer.service";
import { TranslationService } from "../services/translation.service";
import { buildTreesByTactic } from "../matrix/technique-tree";
import { buildMatrixSvg } from "./build-svg";

@Injectable({ providedIn: "root" })
export class SvgExportService {
  private readonly dataService = inject(D3fendDataService);
  private readonly layerService = inject(LayerService);
  private readonly i18n = inject(TranslationService);

  build(): string {
    const dataset = this.dataService.dataset();
    if (!dataset) {
      throw new Error(this.i18n.t("errors.datasetNotLoaded"));
    }
    const tactics = [...dataset.tactics].sort((a, b) => a.displayOrder - b.displayOrder);
    const treeByTactic = buildTreesByTactic(dataset.techniques);
    return buildMatrixSvg(tactics, treeByTactic, this.layerService.layer());
  }

  download(): void {
    const svg = this.build();
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${this.layerService.layer().name || "layer"}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  }
}
