import { Injectable, computed, inject } from "@angular/core";
import { D3fendDataService } from "./d3fend-data.service";

/**
 * BETA — D3FEND n'a pas de notion de plateforme : une technique D3FEND "a" une plateforme si
 * au moins une technique ATT&CK Enterprise qu'elle contre la porte (voir data/README.md §7).
 */
@Injectable({ providedIn: "root" })
export class PlatformLookupService {
  private readonly dataService = inject(D3fendDataService);

  readonly allPlatforms = computed<string[]>(() => {
    const dataset = this.dataService.dataset();
    if (!dataset) return [];
    const names = new Set<string>();
    for (const m of dataset.attackMappings) {
      for (const p of m.offensivePlatforms) names.add(p);
    }
    return [...names].sort();
  });

  /** id de relation (Technique.attackMappingIds) -> plateformes de la technique offensive visée */
  readonly platformsByMappingId = computed(() => {
    const dataset = this.dataService.dataset();
    const map = new Map<string, string[]>();
    if (dataset) {
      for (const m of dataset.attackMappings) map.set(m.id, m.offensivePlatforms);
    }
    return map;
  });
}
