import { D3fendLayer, LayerTechniqueAnnotation } from "../classes/layer.model";
import { D3fendDataset } from "../classes/dataset.model";
import { AttackMapping } from "../classes/attack-mapping.model";
import { buildAttackNavigatorLayer } from "./build-attack-layer";
import { AttackNavigatorTechnique } from "./attack-navigator-layer.model";

const OPTIONS = { exportedLayerName: "L", description: "D", sourceMetadataLabel: "Source" };

function annotation(techniqueID: string, overrides: Partial<LayerTechniqueAnnotation> = {}): LayerTechniqueAnnotation {
  return { techniqueID, tacticID: "Harden", color: "#8ec843", comment: "", enabled: true, score: 1, metadata: [], links: [], ...overrides };
}

function layer(techniques: LayerTechniqueAnnotation[]): D3fendLayer {
  return {
    versions: { layer: "1.0.0", navigator: "0.1.0", d3fend: "1.6.0" },
    name: "Test",
    description: "",
    domain: "d3fend",
    sorting: 0,
    layout: { layout: "side", aggregateFunction: "average", showID: true, showName: true, showAggregateScores: false, countUnscored: false },
    hideDisabled: false,
    techniques,
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

let mappingCounter = 0;
function mapping(d3fendTechniqueId: string, offensiveTechniqueId: string, offensiveTacticId: string, overrides: Partial<AttackMapping> = {}): AttackMapping {
  mappingCounter += 1;
  return {
    id: `map-${mappingCounter}`,
    d3fendTechniqueId,
    offensiveFramework: "attack-enterprise",
    offensiveTechniqueId,
    offensiveTechniqueName: offensiveTechniqueId,
    offensiveParentTechniqueId: null,
    offensiveTacticId,
    offensiveTacticName: null,
    offensivePlatforms: [],
    offensiveTechniqueStatus: "active",
    originalOffensiveTechniqueId: null,
    originalOffensiveTacticId: null,
    viaDefensiveRelation: "",
    viaDefensiveArtifactId: "",
    viaOffensiveRelation: "",
    viaOffensiveArtifactName: "",
    ...overrides
  };
}

function dataset(attackMappings: AttackMapping[]): D3fendDataset {
  return {
    d3fendVersion: "1.6.0",
    generatedAt: "",
    tactics: [],
    techniques: [],
    artifacts: [],
    artifactRelationships: [],
    attackMappings,
    attackTacticShortnames: { TA0006: "credential-access", TA0003: "persistence", TA0004: "privilege-escalation", TA0112: "defense-impairment" },
    attackVersions: { "attack-enterprise": "20.1", "attack-ics": "20.1" }
  };
}

function find(techniques: AttackNavigatorTechnique[], id: string, tactic: string): AttackNavigatorTechnique | undefined {
  return techniques.find((t) => t.techniqueID === id && t.tactic === tactic);
}

describe("buildAttackNavigatorLayer", () => {
  it("déplie la parente (entrée sans annotation) d'une sous-technique annotée", () => {
    const result = buildAttackNavigatorLayer(
      layer([annotation("D3-SPP")]),
      dataset([mapping("D3-SPP", "T1110.001", "TA0006"), mapping("D3-SPP", "T1110.002", "TA0006")]),
      "attack-enterprise",
      OPTIONS
    );

    const parents = result.techniques.filter((t) => t.techniqueID === "T1110");
    expect(parents).toEqual([{ techniqueID: "T1110", tactic: "credential-access", showSubtechniques: true }]);
    expect(find(result.techniques, "T1110.001", "credential-access")?.color).toBe("#8ec843");
  });

  it("complète l'entrée d'une parente déjà annotée au lieu de la dupliquer", () => {
    const result = buildAttackNavigatorLayer(
      layer([annotation("D3-UAP")]),
      dataset([mapping("D3-UAP", "T1078", "TA0003"), mapping("D3-UAP", "T1078.001", "TA0003")]),
      "attack-enterprise",
      OPTIONS
    );

    const parents = result.techniques.filter((t) => t.techniqueID === "T1078");
    expect(parents.length).toBe(1);
    expect(parents[0].showSubtechniques).toBeTrue();
    expect(parents[0].color).toBe("#8ec843");
  });

  it("déplie la parente sur chaque tactique où une sous-technique est annotée", () => {
    const result = buildAttackNavigatorLayer(
      layer([annotation("D3-UAP")]),
      dataset([mapping("D3-UAP", "T1098.002", "TA0003"), mapping("D3-UAP", "T1098.002", "TA0004")]),
      "attack-enterprise",
      OPTIONS
    );

    expect(find(result.techniques, "T1098", "persistence")?.showSubtechniques).toBeTrue();
    expect(find(result.techniques, "T1098", "privilege-escalation")?.showSubtechniques).toBeTrue();
  });

  it("exporte les techniques remplacées et exclut les techniques obsolètes", () => {
    const result = buildAttackNavigatorLayer(
      layer([annotation("D3-RKD")]),
      dataset([
        mapping("D3-RKD", "T1690", "TA0112", { offensiveTechniqueStatus: "remapped", originalOffensiveTechniqueId: "T1562.003" }),
        mapping("D3-RKD", "T1053.004", "TA0003", { offensiveTechniqueStatus: "deprecated" })
      ]),
      "attack-enterprise",
      OPTIONS
    );

    expect(result.techniques.map((t) => t.techniqueID)).toEqual(["T1690"]);
    expect(result.techniques[0].tactic).toBe("defense-impairment");
  });

  it("échoue si seules des techniques obsolètes correspondent", () => {
    expect(() =>
      buildAttackNavigatorLayer(
        layer([annotation("D3-X")]),
        dataset([mapping("D3-X", "T1053.004", "TA0003", { offensiveTechniqueStatus: "deprecated" })]),
        "attack-enterprise",
        OPTIONS
      )
    ).toThrowError("NO_ATTACK_MAPPING_FOUND");
  });

  it("indique la version majeure d'ATT&CK du dataset", () => {
    const result = buildAttackNavigatorLayer(layer([annotation("D3-SPP")]), dataset([mapping("D3-SPP", "T1110", "TA0006")]), "attack-enterprise", OPTIONS);
    expect(result.versions.attack).toBe("20");
  });
});
