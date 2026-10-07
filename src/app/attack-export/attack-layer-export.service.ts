import { Injectable, inject } from "@angular/core";
import { D3fendDataService } from "../services/d3fend-data.service";
import { LayerService } from "../services/layer.service";
import { TranslationService } from "../services/translation.service";
import { AttackFramework, attackFrameworkLabel, buildAttackNavigatorLayer } from "./build-attack-layer";

@Injectable({ providedIn: "root" })
export class AttackLayerExportService {
  private readonly dataService = inject(D3fendDataService);
  private readonly layerService = inject(LayerService);
  private readonly i18n = inject(TranslationService);

  build(framework: AttackFramework): string {
    const dataset = this.dataService.dataset();
    if (!dataset) {
      throw new Error(this.i18n.t("errors.datasetNotLoaded"));
    }

    const layer = this.layerService.layer();
    const domainLabel = attackFrameworkLabel(framework);
    let attackLayer;
    try {
      attackLayer = buildAttackNavigatorLayer(layer, dataset, framework, {
        exportedLayerName: this.i18n.t("attackExport.layerName", { name: layer.name, domain: domainLabel }),
        description: this.i18n.t("attackExport.description", { name: layer.name, domain: domainLabel }),
        sourceMetadataLabel: this.i18n.t("attackExport.sourceMetadataLabel")
      });
    } catch (err) {
      if (err instanceof Error && err.message === "NO_ANNOTATED_TECHNIQUE") {
        throw new Error(this.i18n.t("errors.noAnnotatedTechniques"));
      }
      if (err instanceof Error && err.message === "NO_ATTACK_MAPPING_FOUND") {
        throw new Error(this.i18n.t("errors.noAttackMappingFound", { domain: domainLabel }));
      }
      throw err;
    }

    return JSON.stringify(attackLayer, null, 2);
  }

  download(framework: AttackFramework): void {
    const json = this.build(framework);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const suffix = framework === "attack-enterprise" ? "attack-enterprise" : "attack-ics";
    link.download = `${this.layerService.layer().name || "layer"}.${suffix}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }
}
