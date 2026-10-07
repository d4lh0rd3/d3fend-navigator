import { Component, EventEmitter, Output, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { D3fendDataService } from "../services/d3fend-data.service";
import { LayerService } from "../services/layer.service";
import { TranslationService } from "../services/translation.service";

@Component({
  selector: "app-start-page",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./start-page.component.html",
  styleUrl: "./start-page.component.scss"
})
export class StartPageComponent {
  private readonly dataService = inject(D3fendDataService);
  private readonly layerService = inject(LayerService);
  readonly i18n = inject(TranslationService);

  @Output() ready = new EventEmitter<void>();

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  async onCreateNew(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const dataset = await this.dataService.load();
      this.layerService.reset(dataset.d3fendVersion);
      this.ready.emit();
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : String(err));
    } finally {
      this.loading.set(false);
    }
  }

  onImportFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.loading.set(true);
    this.error.set(null);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        await this.dataService.load();
        this.layerService.importFromJson(String(reader.result));
        this.ready.emit();
      } catch (err) {
        this.error.set(err instanceof Error ? err.message : String(err));
      } finally {
        this.loading.set(false);
        input.value = "";
      }
    };
    reader.onerror = () => {
      this.error.set(this.i18n.t("startPage.readError"));
      this.loading.set(false);
    };
    reader.readAsText(file);
  }
}
