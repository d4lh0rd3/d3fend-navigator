import { Injectable, computed, inject } from "@angular/core";
import { D3fendDataService } from "./d3fend-data.service";
import { DigitalArtifact } from "../classes/digital-artifact.model";

@Injectable({ providedIn: "root" })
export class ArtifactLookupService {
  private readonly dataService = inject(D3fendDataService);

  readonly artifacts = computed<DigitalArtifact[]>(() => this.dataService.dataset()?.artifacts ?? []);

  /** id de relation (Technique.artifactRelationIds) -> id d'artefact ciblé */
  readonly artifactIdByRelationId = computed(() => {
    const dataset = this.dataService.dataset();
    const map = new Map<string, string>();
    if (dataset) {
      for (const r of dataset.artifactRelationships) map.set(r.id, r.artifactId);
    }
    return map;
  });
}
