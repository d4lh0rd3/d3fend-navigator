import { Injectable, computed, inject, signal } from "@angular/core";
import { D3fendLayer, LayerTechniqueAnnotation } from "../classes/layer.model";
import { TranslationService } from "./translation.service";

const LAYER_FORMAT_VERSION = "1.0.0";
const NAVIGATOR_VERSION = "0.1.0";

function emptyLayer(d3fendVersion: string, name: string): D3fendLayer {
  return {
    versions: { layer: LAYER_FORMAT_VERSION, navigator: NAVIGATOR_VERSION, d3fend: d3fendVersion },
    name,
    description: "",
    domain: "d3fend",
    sorting: 0,
    layout: {
      layout: "side",
      aggregateFunction: "average",
      showID: true,
      showName: true,
      showAggregateScores: false,
      countUnscored: false
    },
    hideDisabled: false,
    techniques: [],
    expandedNodeIds: [],
    gradient: { colors: ["#ffffff", "#66b1ff"], minValue: 0, maxValue: 100 },
    legendItems: [],
    metadata: [],
    links: [],
    filters: { artifactTypes: [], platforms: [] },
    selectTechniquesAcrossTactics: true,
    selectSubtechniquesWithParent: false
  };
}

let tabCounter = 0;
function nextTabId(): string {
  tabCounter += 1;
  return `tab-${tabCounter}`;
}

/** Un onglet = un layer + son état de sélection. selectedTechniqueIds est ordonné (le dernier
 *  élément est la sélection "primaire") ; anchor* est le point de départ d'un Shift+clic. */
export interface LayerTab {
  id: string;
  layer: D3fendLayer;
  selectedTechniqueIds: string[];
  selectedTacticById: Record<string, string>;
  anchorTechniqueId: string | null;
  anchorTacticId: string | null;
  /** `layer` modifié depuis l'ouverture ou le dernier export (la sélection n'est pas exportée
   *  et n'est donc pas prise en compte). */
  dirty: boolean;
}

/** Gère les layers ouverts (onglets). Toutes les lectures/écritures portent sur l'onglet actif. */
@Injectable({ providedIn: "root" })
export class LayerService {
  private readonly i18n = inject(TranslationService);
  private readonly tabsSignal = signal<LayerTab[]>([]);
  private readonly activeTabIdSignal = signal<string | null>(null);

  readonly tabs = this.tabsSignal.asReadonly();
  readonly activeTabId = this.activeTabIdSignal.asReadonly();

  private readonly activeTab = computed(() => this.tabsSignal().find((t) => t.id === this.activeTabIdSignal()));

  readonly layer = computed(() => this.activeTab()?.layer ?? emptyLayer("unknown", this.i18n.t("tabs.newLayer")));

  readonly hasUnsavedChanges = computed(() => this.tabsSignal().some((t) => t.dirty));

  isTabDirty(tabId: string): boolean {
    return this.tabsSignal().find((t) => t.id === tabId)?.dirty ?? false;
  }

  readonly selectedTechniqueIds = computed(() => this.activeTab()?.selectedTechniqueIds ?? []);
  private readonly selectedTechniqueIdSet = computed(() => new Set(this.selectedTechniqueIds()));

  readonly selectedTechniqueId = computed(() => {
    const ids = this.selectedTechniqueIds();
    return ids.length ? ids[ids.length - 1] : null;
  });

  readonly selectedTacticId = computed(() => {
    const id = this.selectedTechniqueId();
    return id ? (this.activeTab()?.selectedTacticById[id] ?? null) : null;
  });

  tacticIdFor(techniqueId: string): string | null {
    return this.activeTab()?.selectedTacticById[techniqueId] ?? null;
  }

  private readonly annotationById = computed(() => {
    const map = new Map<string, LayerTechniqueAnnotation>();
    for (const t of this.layer().techniques) map.set(t.techniqueID, t);
    return map;
  });

  private readonly expandedIds = computed(() => new Set(this.layer().expandedNodeIds));

  reset(d3fendVersion: string, name?: string): void {
    this.openTab(emptyLayer(d3fendVersion, name ?? this.i18n.t("tabs.newLayer")));
  }

  /** @throws si le JSON n'a pas la forme minimale attendue d'un D3fendLayer */
  importFromJson(json: string): void {
    const parsed = JSON.parse(json) as D3fendLayer;
    if (!parsed?.versions?.layer || !Array.isArray(parsed.techniques)) {
      throw new Error(this.i18n.t("errors.invalidLayerFile"));
    }
    // un layer plus ancien peut ne pas avoir tous les filtres
    const partialFilters = parsed.filters as Partial<D3fendLayer["filters"]> | undefined;
    const filters = { artifactTypes: [], platforms: [], ...partialFilters };
    this.openTab({ ...parsed, filters });
  }

  switchTo(tabId: string): void {
    if (this.tabsSignal().some((t) => t.id === tabId)) {
      this.activeTabIdSignal.set(tabId);
    }
  }

  /** Le dernier onglet ne peut pas être fermé. */
  closeTab(tabId: string): void {
    const tabs = this.tabsSignal();
    if (tabs.length <= 1) return;
    const next = tabs.filter((t) => t.id !== tabId);
    this.tabsSignal.set(next);
    if (this.activeTabIdSignal() === tabId) {
      this.activeTabIdSignal.set(next[next.length - 1].id);
    }
  }

  setName(name: string): void {
    this.updateActiveLayer((layer) => ({ ...layer, name }));
  }

  setArtifactTypeFilters(artifactIds: string[]): void {
    this.updateActiveLayer((layer) => ({
      ...layer,
      filters: { ...layer.filters, artifactTypes: artifactIds }
    }));
  }

  /** BETA — plateformes ATT&CK Enterprise (voir data/README.md §7). */
  setPlatformFilters(platforms: string[]): void {
    this.updateActiveLayer((layer) => ({
      ...layer,
      filters: { ...layer.filters, platforms }
    }));
  }

  isSelected(techniqueId: string): boolean {
    return this.selectedTechniqueIdSet().has(techniqueId);
  }

  select(techniqueId: string, tacticId: string): void {
    this.updateActiveTab((tab) => ({
      ...tab,
      selectedTechniqueIds: [techniqueId],
      selectedTacticById: { [techniqueId]: tacticId },
      anchorTechniqueId: techniqueId,
      anchorTacticId: tacticId
    }));
  }

  toggleSelection(techniqueId: string, tacticId: string): void {
    this.updateActiveTab((tab) => {
      const isSelected = tab.selectedTechniqueIds.includes(techniqueId);
      const selectedTechniqueIds = isSelected
        ? tab.selectedTechniqueIds.filter((id) => id !== techniqueId)
        : [...tab.selectedTechniqueIds, techniqueId];
      const selectedTacticById = { ...tab.selectedTacticById };
      if (isSelected) {
        delete selectedTacticById[techniqueId];
      } else {
        selectedTacticById[techniqueId] = tacticId;
      }
      return { ...tab, selectedTechniqueIds, selectedTacticById, anchorTechniqueId: techniqueId, anchorTacticId: tacticId };
    });
  }

  /** Ne déplace pas l'ancre, pour qu'un second Shift+clic reparte du même point. */
  selectRange(range: { id: string; tacticId: string }[]): void {
    this.updateActiveTab((tab) => ({
      ...tab,
      selectedTechniqueIds: range.map((r) => r.id),
      selectedTacticById: Object.fromEntries(range.map((r) => [r.id, r.tacticId]))
    }));
  }

  get anchorTechniqueId(): string | null {
    return this.activeTab()?.anchorTechniqueId ?? null;
  }

  get anchorTacticId(): string | null {
    return this.activeTab()?.anchorTacticId ?? null;
  }

  annotationFor(techniqueId: string): LayerTechniqueAnnotation | undefined {
    return this.annotationById().get(techniqueId);
  }

  isExpanded(techniqueId: string): boolean {
    return this.expandedIds().has(techniqueId);
  }

  toggleExpanded(techniqueId: string): void {
    this.updateActiveLayer((layer) => ({
      ...layer,
      expandedNodeIds: layer.expandedNodeIds.includes(techniqueId)
        ? layer.expandedNodeIds.filter((id) => id !== techniqueId)
        : [...layer.expandedNodeIds, techniqueId]
    }));
  }

  setExpandedIds(techniqueIds: string[]): void {
    this.updateActiveLayer((layer) => ({ ...layer, expandedNodeIds: techniqueIds }));
  }

  setColor(techniqueId: string, tacticId: string, color: string): void {
    this.upsert(techniqueId, tacticId, { color });
  }

  setScore(techniqueId: string, tacticId: string, score: number | null): void {
    this.upsert(techniqueId, tacticId, { score });
  }

  setComment(techniqueId: string, tacticId: string, comment: string): void {
    this.upsert(techniqueId, tacticId, { comment });
  }

  setEnabled(techniqueId: string, tacticId: string, enabled: boolean): void {
    this.upsert(techniqueId, tacticId, { enabled });
  }

  exportToJson(): string {
    const json = JSON.stringify(this.layer(), null, 2);
    this.updateActiveTab((tab) => ({ ...tab, dirty: false }));
    return json;
  }

  private openTab(layer: D3fendLayer): void {
    const tab: LayerTab = {
      id: nextTabId(),
      layer,
      selectedTechniqueIds: [],
      selectedTacticById: {},
      anchorTechniqueId: null,
      anchorTacticId: null,
      dirty: false
    };
    this.tabsSignal.update((tabs) => [...tabs, tab]);
    this.activeTabIdSignal.set(tab.id);
  }

  private updateActiveTab(mutator: (tab: LayerTab) => LayerTab): void {
    const activeId = this.activeTabIdSignal();
    if (!activeId) return;
    this.tabsSignal.update((tabs) => tabs.map((t) => (t.id === activeId ? mutator(t) : t)));
  }

  private updateActiveLayer(mutator: (layer: D3fendLayer) => D3fendLayer): void {
    this.updateActiveTab((tab) => ({ ...tab, layer: mutator(tab.layer), dirty: true }));
  }

  private upsert(techniqueId: string, tacticId: string, patch: Partial<LayerTechniqueAnnotation>): void {
    const existing = this.annotationById().get(techniqueId);
    const next: LayerTechniqueAnnotation = existing
      ? { ...existing, ...patch }
      : {
          techniqueID: techniqueId,
          tacticID: tacticId,
          color: "",
          comment: "",
          enabled: true,
          score: null,
          metadata: [],
          links: [],
          ...patch
        };
    this.updateActiveLayer((layer) => ({
      ...layer,
      techniques: [...layer.techniques.filter((t) => t.techniqueID !== techniqueId), next]
    }));
  }
}
