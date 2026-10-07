import { Component, ElementRef, HostListener, computed, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { D3fendDataService } from "../services/d3fend-data.service";
import { LayerService } from "../services/layer.service";
import { ViewPreferencesService } from "../services/view-preferences.service";
import { TranslationService } from "../services/translation.service";
import { AttackMapping } from "../classes/attack-mapping.model";
import { Technique } from "../classes/technique.model";

const FRAMEWORK_LABELS: Record<string, string> = {
  "attack-enterprise": "ATT&CK Enterprise",
  "attack-ics": "ATT&CK ICS",
  sparta: "SPARTA"
};

interface DisplayedArtifactRelation {
  predicate: string;
  artifactName: string;
  sourceTechniqueId: string;
  sourceTechniqueName: string | null; // null = relation portée par la technique sélectionnée elle-même
}

interface DisplayedMapping extends AttackMapping {
  sourceTechniqueName: string | null;
}

interface MappingGroup {
  framework: string;
  label: string;
  items: DisplayedMapping[];
}

/**
 * Détail de la technique sélectionnée : définition, artefacts numériques et techniques
 * offensives contrées. Comme sur d3fend.mitre.org, les relations et mappings des
 * sous-techniques sont agrégés à ceux de la technique parente (voir data/README.md).
 */
@Component({
  selector: "app-technique-detail",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./technique-detail.component.html",
  styleUrl: "./technique-detail.component.scss"
})
export class TechniqueDetailComponent {
  private readonly dataService = inject(D3fendDataService);
  private readonly layerService = inject(LayerService);
  private readonly viewPreferences = inject(ViewPreferencesService);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  readonly i18n = inject(TranslationService);

  readonly showChain = this.viewPreferences.showMappingChain;

  private readonly collapsedFrameworksSignal = signal<ReadonlySet<string>>(new Set());

  isFrameworkCollapsed(framework: string): boolean {
    return this.collapsedFrameworksSignal().has(framework);
  }

  readonly isArtifactsCollapsed = signal(false);

  toggleArtifactsSection(): void {
    this.isArtifactsCollapsed.update((v) => !v);
  }

  readonly selectionCount = computed(() => this.layerService.selectedTechniqueIds().length);

  toggleFramework(framework: string): void {
    const next = new Set(this.collapsedFrameworksSignal());
    if (next.has(framework)) {
      next.delete(framework);
    } else {
      next.add(framework);
    }
    this.collapsedFrameworksSignal.set(next);
  }

  readonly isTacticFilterOpen = signal(false);
  private readonly selectedTacticsSignal = signal<ReadonlySet<string>>(new Set());
  readonly selectedTactics = this.selectedTacticsSignal.asReadonly();

  @HostListener("document:click", ["$event"])
  onDocumentClick(event: MouseEvent): void {
    if (this.isTacticFilterOpen() && !this.elementRef.nativeElement.contains(event.target as Node)) {
      this.isTacticFilterOpen.set(false);
    }
  }

  toggleTacticFilterPanel(): void {
    this.isTacticFilterOpen.update((v) => !v);
  }

  isTacticSelected(name: string): boolean {
    return this.selectedTacticsSignal().has(name);
  }

  toggleTactic(name: string): void {
    const next = new Set(this.selectedTacticsSignal());
    if (next.has(name)) {
      next.delete(name);
    } else {
      next.add(name);
    }
    this.selectedTacticsSignal.set(next);
  }

  clearTacticFilter(event: Event): void {
    event.stopPropagation();
    this.selectedTacticsSignal.set(new Set());
  }

  readonly technique = computed(() => {
    const id = this.layerService.selectedTechniqueId();
    const dataset = this.dataService.dataset();
    if (!id || !dataset) return undefined;
    return dataset.techniques.find((t) => t.id === id);
  });

  private readonly scopeIds = computed(() => {
    const technique = this.technique();
    const dataset = this.dataService.dataset();
    if (!technique || !dataset) return new Set<string>();
    return new Set([technique.id, ...descendantIds(technique.id, dataset.techniques)]);
  });

  readonly descendantCount = computed(() => Math.max(0, this.scopeIds().size - 1));

  readonly relatedArtifacts = computed<DisplayedArtifactRelation[]>(() => {
    const technique = this.technique();
    const dataset = this.dataService.dataset();
    const scope = this.scopeIds();
    if (!technique || !dataset) return [];

    const artifactsById = new Map(dataset.artifacts.map((a) => [a.id, a]));
    const techniquesById = new Map(dataset.techniques.map((t) => [t.id, t]));

    return dataset.artifactRelationships
      .filter((r) => scope.has(r.techniqueId))
      .map((r) => ({
        predicate: r.predicate,
        artifactName: artifactsById.get(r.artifactId)?.name ?? r.artifactId,
        sourceTechniqueId: r.techniqueId,
        sourceTechniqueName:
          r.techniqueId === technique.id ? null : techniquesById.get(r.techniqueId)?.name ?? r.techniqueId
      }));
  });

  private readonly allDedupedMappings = computed<DisplayedMapping[]>(() => {
    const technique = this.technique();
    const dataset = this.dataService.dataset();
    const scope = this.scopeIds();
    if (!technique || !dataset) return [];

    const techniquesById = new Map(dataset.techniques.map((t) => [t.id, t]));
    const displayed: DisplayedMapping[] = [];
    for (const m of dataset.attackMappings) {
      if (!scope.has(m.d3fendTechniqueId)) continue;
      displayed.push({
        ...m,
        sourceTechniqueName:
          m.d3fendTechniqueId === technique.id ? null : techniquesById.get(m.d3fendTechniqueId)?.name ?? m.d3fendTechniqueId
      });
    }
    return dedupeByDisplayedFields(displayed);
  });

  readonly availableTactics = computed(() => {
    const names = new Set<string>();
    for (const m of this.allDedupedMappings()) {
      if (m.offensiveTacticName) names.add(m.offensiveTacticName);
    }
    return [...names].sort();
  });

  readonly mappingsByFramework = computed<MappingGroup[]>(() => {
    const selected = this.selectedTacticsSignal();
    const relevant =
      selected.size === 0
        ? this.allDedupedMappings()
        : this.allDedupedMappings().filter((m) => m.offensiveTacticName && selected.has(m.offensiveTacticName));

    const groups = new Map<string, DisplayedMapping[]>();
    for (const m of relevant) {
      if (!groups.has(m.offensiveFramework)) groups.set(m.offensiveFramework, []);
      groups.get(m.offensiveFramework)!.push(m);
    }

    return [...groups.entries()].map(([framework, items]) => ({
      framework,
      label: FRAMEWORK_LABELS[framework] ?? framework,
      items
    }));
  });
}

function descendantIds(techniqueId: string, techniques: Technique[]): string[] {
  const childrenByParent = new Map<string, string[]>();
  for (const t of techniques) {
    if (!t.parentId) continue;
    if (!childrenByParent.has(t.parentId)) childrenByParent.set(t.parentId, []);
    childrenByParent.get(t.parentId)!.push(t.id);
  }
  const result: string[] = [];
  const stack = [...(childrenByParent.get(techniqueId) ?? [])];
  while (stack.length) {
    const id = stack.pop()!;
    result.push(id);
    stack.push(...(childrenByParent.get(id) ?? []));
  }
  return result;
}

/**
 * Plusieurs chaînes d'inférence peuvent aboutir à la même ligne affichée pour une même
 * technique source (voir data/README.md) : dédoublonnage à l'affichage uniquement.
 */
function dedupeByDisplayedFields(mappings: DisplayedMapping[]): DisplayedMapping[] {
  const seen = new Set<string>();
  const result: DisplayedMapping[] = [];
  for (const m of mappings) {
    const key = [
      m.d3fendTechniqueId,
      m.offensiveTechniqueId,
      m.viaDefensiveRelation,
      m.viaDefensiveArtifactId,
      m.viaOffensiveRelation,
      m.viaOffensiveArtifactName
    ].join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(m);
  }
  return result;
}
