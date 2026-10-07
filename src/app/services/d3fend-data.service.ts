import { Injectable, inject, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { D3fendDataset, VersionsManifest } from "../classes/dataset.model";
import { TranslationService } from "./translation.service";

/** Charge le dataset D3FEND statique généré par le pipeline ETL (public/data/). */
@Injectable({ providedIn: "root" })
export class D3fendDataService {
  private readonly http = inject(HttpClient);
  private readonly i18n = inject(TranslationService);

  private readonly datasetSignal = signal<D3fendDataset | null>(null);
  readonly dataset = this.datasetSignal.asReadonly();

  private loadPromise: Promise<D3fendDataset> | null = null;

  /** Dernière version disponible par défaut ; résultat mis en cache. */
  load(version?: string): Promise<D3fendDataset> {
    if (this.datasetSignal() && !version) {
      return Promise.resolve(this.datasetSignal()!);
    }
    if (!this.loadPromise) {
      this.loadPromise = this.fetchDataset(version);
    }
    return this.loadPromise;
  }

  private async fetchDataset(version?: string): Promise<D3fendDataset> {
    const manifest = await firstValueFrom(this.http.get<VersionsManifest>("data/versions.json"));
    const entry = version
      ? manifest.versions.find((v) => v.d3fend === version)
      : manifest.versions[manifest.versions.length - 1];
    if (!entry) {
      throw new Error(
        version ? this.i18n.t("errors.noDatasetVersion", { version }) : this.i18n.t("errors.noDataset")
      );
    }
    const dataset = await firstValueFrom(this.http.get<D3fendDataset>(`data/${entry.dataset}`));
    this.datasetSignal.set(dataset);
    return dataset;
  }
}
