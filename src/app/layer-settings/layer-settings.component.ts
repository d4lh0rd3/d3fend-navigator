import { Component, computed, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { LayerService } from "../services/layer.service";
import { SvgExportService } from "../svg-export/svg-export.service";
import { AttackLayerExportService } from "../attack-export/attack-layer-export.service";
import { TranslationService } from "../services/translation.service";

const PRESET_COLORS = ["#8ec843", "#66b1ff", "#ffaf13", "#e60d0d", "#bdbdbd"];

/**
 * Barre d'actions du layer + éditeur de la sélection. Une modification s'applique à toutes
 * les techniques sélectionnées ; le formulaire est pré-rempli depuis la sélection primaire.
 */
@Component({
  selector: "app-layer-settings",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./layer-settings.component.html",
  styleUrl: "./layer-settings.component.scss"
})
export class LayerSettingsComponent {
  private readonly layerService = inject(LayerService);
  private readonly svgExportService = inject(SvgExportService);
  private readonly attackLayerExportService = inject(AttackLayerExportService);
  readonly i18n = inject(TranslationService);

  readonly layer = this.layerService.layer;
  readonly selectedTechniqueId = this.layerService.selectedTechniqueId;
  readonly selectedTechniqueIds = this.layerService.selectedTechniqueIds;
  readonly selectionCount = computed(() => this.selectedTechniqueIds().length);
  readonly presetColors = PRESET_COLORS;

  readonly selectedAnnotation = computed(() => {
    const id = this.selectedTechniqueId();
    return id ? this.layerService.annotationFor(id) : undefined;
  });

  onNameChange(name: string): void {
    this.layerService.setName(name);
  }

  onNewLayer(): void {
    this.layerService.reset(this.layer().versions.d3fend);
  }

  onColorChange(color: string): void {
    this.applyToSelection((id, tacticId) => this.layerService.setColor(id, tacticId, color));
  }

  onScoreChange(value: number | null): void {
    this.applyToSelection((id, tacticId) => this.layerService.setScore(id, tacticId, value));
  }

  onCommentChange(value: string): void {
    this.applyToSelection((id, tacticId) => this.layerService.setComment(id, tacticId, value));
  }

  onExport(): void {
    const json = this.layerService.exportToJson();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${this.layer().name || "layer"}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  onExportSvg(): void {
    try {
      this.svgExportService.download();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : String(err));
    }
  }

  onExportAttackEnterprise(): void {
    this.exportAttack("attack-enterprise");
  }

  onExportAttackIcs(): void {
    this.exportAttack("attack-ics");
  }

  private exportAttack(framework: "attack-enterprise" | "attack-ics"): void {
    try {
      this.attackLayerExportService.download(framework);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : String(err));
    }
  }

  onImportFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        this.layerService.importFromJson(String(reader.result));
      } catch (err) {
        window.alert(err instanceof Error ? err.message : String(err));
      }
    };
    reader.readAsText(file);
    input.value = "";
  }

  private applyToSelection(apply: (techniqueId: string, tacticId: string) => void): void {
    for (const id of this.selectedTechniqueIds()) {
      const tacticId = this.layerService.tacticIdFor(id);
      if (tacticId) apply(id, tacticId);
    }
  }
}
