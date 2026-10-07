import { Injectable, computed, inject } from "@angular/core";
import { D3fendDataService } from "./d3fend-data.service";
import { TechniqueNode } from "../matrix/technique-node.model";
import { buildTreesByTactic } from "../matrix/technique-tree";

@Injectable({ providedIn: "root" })
export class TechniqueTreeService {
  private readonly dataService = inject(D3fendDataService);

  readonly treeByTactic = computed<Map<string, TechniqueNode[]>>(() => {
    const dataset = this.dataService.dataset();
    if (!dataset) return new Map();
    return buildTreesByTactic(dataset.techniques);
  });
}
