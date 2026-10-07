import { Component, OnInit, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { D3fendDataService } from "../services/d3fend-data.service";
import { TechniqueTreeService } from "../services/technique-tree.service";
import { TranslationService } from "../services/translation.service";
import { Tactic } from "../classes/tactic.model";
import { TechniqueNode } from "./technique-node.model";
import { TechniqueNodeComponent } from "./technique-node.component";

/** Matrice D3FEND : une colonne par tactique, un arbre de techniques par colonne. */
@Component({
  selector: "app-matrix",
  standalone: true,
  imports: [CommonModule, TechniqueNodeComponent],
  templateUrl: "./matrix.component.html",
  styleUrl: "./matrix.component.scss"
})
export class MatrixComponent implements OnInit {
  private readonly dataService = inject(D3fendDataService);
  private readonly techniqueTree = inject(TechniqueTreeService);
  readonly i18n = inject(TranslationService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly tactics = signal<Tactic[]>([]);
  readonly treeByTactic = this.techniqueTree.treeByTactic;

  async ngOnInit(): Promise<void> {
    try {
      const dataset = await this.dataService.load();
      this.tactics.set([...dataset.tactics].sort((a, b) => a.displayOrder - b.displayOrder));
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : String(err));
    } finally {
      this.loading.set(false);
    }
  }

  techniquesFor(tacticId: string): TechniqueNode[] {
    return this.treeByTactic().get(tacticId) ?? [];
  }
}
