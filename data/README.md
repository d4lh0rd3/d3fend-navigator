# Données D3FEND — notes sur le modèle (v1.6.0)

**Français** | [English](#english)

Faits observés dans les fichiers sources officiels (`d3fend.mitre.org/ontologies/d3fend/1.6.0/`)
et sur lesquels s'appuie le pipeline ETL (`scripts/etl/`).

Le dataset généré est écrit dans `public/data/` (servi tel quel par l'application). Seul le
cache des fichiers sources bruts (`data/raw/`, non versionné) se trouve sous `data/`.

Fichiers sources :
- `d3fend.csv` (38 Ko, 271 lignes) — squelette hiérarchique Tactique → Technique
- `d3fend.json` (4,8 Mo, JSON-LD, 7688 noeuds `@graph`) — ontologie complète avec définitions et relations
- `d3fend-full-mappings.json` (~60 Mo) — mapping D3FEND ↔ frameworks offensifs, format résultat SPARQL 1.1

## 1. Tactiques

7 tactiques (colonne `D3FEND Tactic` du CSV, et noeuds `d3f:DefensiveTactic` du JSON-LD) :
**Model, Harden, Detect, Isolate, Deceive, Evict, Restore**.

Chaque tactique est un noeud `@id: "d3f:<Nom>"` (ex. `d3f:Harden`), qui sert d'identifiant stable :
```json
{
  "@id": "d3f:Harden",
  "@type": ["d3f:DefensiveTactic", "owl:Class", "owl:NamedIndividual"],
  "d3f:definition": "...",
  "d3f:display-order": 0,
  "rdfs:label": "Harden"
}
```
`d3f:display-order` donne l'ordre d'affichage officiel.

## 2. Hiérarchie des techniques

En-tête du CSV : `ID,D3FEND Tactic,D3FEND Technique,D3FEND Technique Level 0,D3FEND Technique Level 1,Definition`.
- **Profondeur : 3 niveaux de technique sous chaque tactique** (colonnes Technique / Level 0 /
  Level 1), soit `Tactique → Technique → Level0 → Level1`.
- 271 techniques, IDs uniques préfixés `D3-` (ex. `D3-CERO` pour Certificate Rotation — l'ID ne
  se déduit pas du libellé).
- Une technique n'appartient qu'à **une seule tactique**.
- Le parent d'une technique se déduit par position dans l'arbre (ligne précédente de profondeur
  immédiatement inférieure), sans orphelin sur les 271 lignes.

Dans le JSON-LD, la hiérarchie est portée par `rdfs:subClassOf`, et **l'appartenance
technique → tactique par le prédicat `d3f:enables`** (ex. `d3f:NetworkMapping` `d3f:enables`
`d3f:Model`). Ce prédicat générique sert aussi pour les techniques offensives (ATT&CK/ATLAS).

La colonne `Definition` du CSV est vide pour 30 techniques dont le noeud JSON-LD porte une
définition (ex. `D3-PH`) : le JSON-LD est donc la source privilégiée.

## 3. Artefacts numériques et relations technique ↔ artefact

Il n'existe **pas de prédicat générique unique** "technique → artefact" : chaque technique utilise
un verbe sémantique selon son action. Prédicats `d3f:` les plus fréquents dans `d3fend.json`
(169 prédicats distincts au total) :

| Prédicat | Occurrences | Exemple |
|---|---|---|
| `d3f:modifies` | 173 | technique modifie un artefact |
| `d3f:produces` | 110 | technique produit un artefact (ex. un événement) |
| `d3f:analyzes` | 62 | technique analyse un artefact |
| `d3f:creates` | 47 | |
| `d3f:monitors` | 31 | |
| `d3f:uses` | 30 | |
| `d3f:hardens` | 15 | |
| `d3f:isolates` | 14 | |
| `d3f:filters` | 13 | |
| `d3f:restricts` | 12 | |
| `d3f:deletes` | 12 | |
| `d3f:regenerates` | 3 | ex. Certificate Rotation → Certificate |
| `d3f:detects` | 2 | |

`ArtifactRelationship.predicate` est donc une chaîne libre extraite telle quelle, et non une
énumération. Les prédicats effectivement rencontrés sont journalisés dans
`public/data/etl-audit.json`.

## 4. Mapping D3FEND ↔ frameworks offensifs

Il n'existe **pas** de prédicat direct `technique D3FEND --counters--> technique offensive`. Le
mapping est **inféré via une chaîne d'artefacts partagés**, matérialisée dans
`d3fend-full-mappings.json` (résultat SPARQL 1.1, champs `head.vars` / `results.bindings`).
Champs clés d'une ligne :

```
def_tech_label / def_tech          → technique D3FEND (ex. "Credential Hardening")
def_tactic_label / def_tactic      → tactique D3FEND (ex. "Harden")
def_artifact_rel_label             → verbe côté défensif (ex. "hardens")
def_artifact_label / def_artifact  → artefact D3FEND (ex. "Credential")
off_artifact_label / off_artifact  → artefact offensif correspondant (ex. "Encrypted Credential")
off_artifact_rel_label             → verbe côté offensif (ex. "accesses")
off_tech_label / off_tech / off_tech_id → technique offensive (ex. "Cached Domain Credentials", T1003.005)
off_tech_parent / off_tech_parent_label / off_tech_parent_is_toplevel → technique parente
off_tactic_label / off_tactic      → tactique offensive (ex. "Credential Access")
framework_root_iri                 → ex. ".../d3fend.owl#ATTACKEnterpriseTechnique"
```

Conséquences :
- `AttackMapping.offensiveFramework` est dérivé de `framework_root_iri`. Frameworks présents en
  v1.6.0 (16 249 mappings) : ATT&CK Enterprise (13 387), ATT&CK ICS (2 238), SPARTA (624).
- Le mapping porte une **explication** (artefact et verbe de chaque côté), conservée dans
  `AttackMapping` (`viaDefensiveRelation`, `viaDefensiveArtifactId`, `viaOffensiveRelation`,
  `viaOffensiveArtifactName`) et affichable dans l'interface.
- Plusieurs chaînes d'inférence peuvent aboutir à la même ligne affichée pour une même technique
  source : l'interface les dédoublonne.

## 5. Dimensions de l'ontologie non exploitées

L'ontologie contient aussi, sans être utilisés par l'application :
- **Mapping vers les contrôles NIST 800-53 / CCI** (`d3f:CCIControl`, `d3f:member-of` une
  `CCICatalog`, relié aux techniques via `d3f:broader`/`d3f:narrower`).
- **Mapping CWE** (`d3f:cwe-id`, `d3f:weakness-of`, 943 occurrences).
- **Une "Digital Event Ontology"** (classes `*Event`, prédicats `d3f:preceded-by`,
  `d3f:has-participant`) décrivant des séquences d'événements observables.

## 6. Agrégation des sous-techniques ("roll-up")

Sur `https://d3fend.mitre.org/api/technique/d3f:StrongPasswordPolicy.json`, une technique parente
(ex. `D3-SPP` "Strong Password Policy") ne porte qu'une poignée de relations/mappings en propre,
l'essentiel étant porté par ses sous-techniques (ex. `D3-CDP` "Change Default Password"). Le site
officiel affiche, sur la page d'une technique, le cumul de ses relations/mappings **et de ceux de
toutes ses sous-techniques**.

L'interface (`technique-detail/`) reproduit ce comportement en remontant récursivement les
sous-techniques du noeud sélectionné, avec une mention "via <sous-technique>".

Écart de comptage connu : sur `D3-SPP`, le site officiel affiche 41 techniques offensives et
l'application 28 (23 ATT&CK Enterprise + 5 ICS) après dédoublonnage des chaînes d'inférence. La
cause probable est une convention de comptage différente côté site (non confirmé).

## 7. Filtre par plateforme (BETA)

D3FEND n'a **pas de notion de plateforme** : ni `d3fend.csv` ni `d3fend.json` ne portent de
prédicat lié, et les noeuds `OffensiveTechnique` importés depuis ATT&CK (ex. `d3f:T1003.005`) ne
reprennent pas `x_mitre_platforms`.

Le filtre par plateforme s'appuie donc sur une source **externe** : `x_mitre_platforms` est lu dans
le bundle STIX officiel d'ATT&CK Enterprise (`mitre-attack/attack-stix-data`, via `scripts/etl/fetch-attack.mjs`) et
attaché aux `AttackMapping` par jointure sur `offensiveTechniqueId`. Une technique D3FEND est
alors filtrable par plateforme via les techniques offensives qu'elle contre.

Limites :
- **ATT&CK Enterprise uniquement** (867 techniques en ATT&CK 20.1) : `offensivePlatforms` reste vide
  pour les 2 862 mappings ICS/SPARTA.
- 10 valeurs en v1.6.0 : Windows, Linux, macOS, Containers, ESXi, IaaS, SaaS, Identity Provider,
  Network Devices, Office Suite.
- `D3fendLayer.filters.platforms` est un champ BETA du format de layer.


## 8. Réalignement sur la version courante d'ATT&CK

D3FEND référence les identifiants ATT&CK tels qu'ils existaient à sa publication. ATT&CK évolue
ensuite : en v20.1, 22 des techniques référencées par D3FEND 1.6.0 sont **révoquées** (ex.
`T1562.003` → `T1690`, toute la famille `T1562` déplacée vers la tactique `defense-impairment`,
`T08xx` ICS → `T169x`) et 3 sont **dépréciées** sans remplaçant (`T1053.004`, `T0807`, `T0853`).
ATT&CK Navigator ignore ces entrées : un layer exporté tel quel perd silencieusement de la couverture.

`scripts/etl/resolve-attack-mappings.mjs` réaligne donc chaque mapping Enterprise / ICS sur les
bundles STIX (`mitre-attack/attack-stix-data`, version épinglée au téléchargement et enregistrée
dans `attackVersions` du dataset) :
- technique révoquée → remplacée par la cible de sa relation `revoked-by` (chaînes suivies) ;
  l'ID d'origine reste dans `originalOffensiveTechniqueId` et l'interface affiche « remplace … » ;
- tactique D3FEND qui n'est plus une tactique de la technique → mapping décliné sur chacune de ses
  tactiques courantes (`originalOffensiveTacticId` conserve celle d'origine) ;
- technique dépréciée / révoquée sans remplaçant / inconnue → mapping conservé (information
  D3FEND), marqué par `offensiveTechniqueStatus` et exclu des exports ATT&CK Navigator.

Le détail (remplacements, exclusions) est écrit dans `public/data/etl-audit.json`.

L'export ATT&CK Navigator indique aussi `versions.attack` (version majeure, ex. `"20"`) et marque
`showSubtechniques: true` sur la technique parente de chaque sous-technique annotée : Navigator
replie les parentes par défaut, ce qui masquait les sous-techniques.

---

<a id="english"></a>

# D3FEND data — notes on the model (v1.6.0)

[Français](#données-d3fend--notes-sur-le-modèle-v160) | **English**

Facts observed in the official source files (`d3fend.mitre.org/ontologies/d3fend/1.6.0/`), on
which the ETL pipeline (`scripts/etl/`) relies.

The generated dataset is written to `public/data/` (served as is by the application). Only the
cache of raw source files (`data/raw/`, not versioned) lives under `data/`.

Source files:
- `d3fend.csv` (38 KB, 271 lines) — Tactic → Technique hierarchical skeleton
- `d3fend.json` (4.8 MB, JSON-LD, 7,688 `@graph` nodes) — full ontology with definitions and relations
- `d3fend-full-mappings.json` (~60 MB) — D3FEND ↔ offensive frameworks mapping, SPARQL 1.1 result format

## 1. Tactics

7 tactics (CSV `D3FEND Tactic` column, and `d3f:DefensiveTactic` JSON-LD nodes):
**Model, Harden, Detect, Isolate, Deceive, Evict, Restore**.

Each tactic is a node `@id: "d3f:<Name>"` (e.g. `d3f:Harden`), which serves as a stable identifier:
```json
{
  "@id": "d3f:Harden",
  "@type": ["d3f:DefensiveTactic", "owl:Class", "owl:NamedIndividual"],
  "d3f:definition": "...",
  "d3f:display-order": 0,
  "rdfs:label": "Harden"
}
```
`d3f:display-order` gives the official display order.

## 2. Technique hierarchy

CSV header: `ID,D3FEND Tactic,D3FEND Technique,D3FEND Technique Level 0,D3FEND Technique Level 1,Definition`.
- **Depth: 3 technique levels under each tactic** (Technique / Level 0 / Level 1 columns), i.e.
  `Tactic → Technique → Level0 → Level1`.
- 271 techniques, unique IDs prefixed with `D3-` (e.g. `D3-CERO` for Certificate Rotation — the
  ID cannot be deduced from the label).
- A technique belongs to **only one tactic**.
- A technique's parent is deduced from its position in the tree (previous line of immediately
  lower depth), with no orphans across the 271 lines.

In the JSON-LD, the hierarchy is carried by `rdfs:subClassOf`, and **technique → tactic membership
by the `d3f:enables` predicate** (e.g. `d3f:NetworkMapping` `d3f:enables` `d3f:Model`). This
generic predicate is also used for offensive techniques (ATT&CK/ATLAS).

The CSV `Definition` column is empty for 30 techniques whose JSON-LD node does have a definition
(e.g. `D3-PH`): the JSON-LD is therefore the preferred source.

## 3. Digital artifacts and technique ↔ artifact relations

There is **no single generic** "technique → artifact" **predicate**: each technique uses a
semantic verb according to its action. Most frequent `d3f:` predicates in `d3fend.json`
(169 distinct predicates in total):

| Predicate | Occurrences | Example |
|---|---|---|
| `d3f:modifies` | 173 | technique modifies an artifact |
| `d3f:produces` | 110 | technique produces an artifact (e.g. an event) |
| `d3f:analyzes` | 62 | technique analyzes an artifact |
| `d3f:creates` | 47 | |
| `d3f:monitors` | 31 | |
| `d3f:uses` | 30 | |
| `d3f:hardens` | 15 | |
| `d3f:isolates` | 14 | |
| `d3f:filters` | 13 | |
| `d3f:restricts` | 12 | |
| `d3f:deletes` | 12 | |
| `d3f:regenerates` | 3 | e.g. Certificate Rotation → Certificate |
| `d3f:detects` | 2 | |

`ArtifactRelationship.predicate` is therefore a free-form string extracted as is, not an
enumeration. The predicates actually encountered are logged in `public/data/etl-audit.json`.

## 4. D3FEND ↔ offensive frameworks mapping

There is **no** direct `D3FEND technique --counters--> offensive technique` predicate. The mapping
is **inferred through a chain of shared artifacts**, materialized in `d3fend-full-mappings.json`
(SPARQL 1.1 result, `head.vars` / `results.bindings` fields). Key fields of a row:

```
def_tech_label / def_tech          → D3FEND technique (e.g. "Credential Hardening")
def_tactic_label / def_tactic      → D3FEND tactic (e.g. "Harden")
def_artifact_rel_label             → defensive-side verb (e.g. "hardens")
def_artifact_label / def_artifact  → D3FEND artifact (e.g. "Credential")
off_artifact_label / off_artifact  → corresponding offensive artifact (e.g. "Encrypted Credential")
off_artifact_rel_label             → offensive-side verb (e.g. "accesses")
off_tech_label / off_tech / off_tech_id → offensive technique (e.g. "Cached Domain Credentials", T1003.005)
off_tech_parent / off_tech_parent_label / off_tech_parent_is_toplevel → parent technique
off_tactic_label / off_tactic      → offensive tactic (e.g. "Credential Access")
framework_root_iri                 → e.g. ".../d3fend.owl#ATTACKEnterpriseTechnique"
```

Consequences:
- `AttackMapping.offensiveFramework` is derived from `framework_root_iri`. Frameworks present in
  v1.6.0 (16,249 mappings): ATT&CK Enterprise (13,387), ATT&CK ICS (2,238), SPARTA (624).
- The mapping carries an **explanation** (artifact and verb on each side), kept in `AttackMapping`
  (`viaDefensiveRelation`, `viaDefensiveArtifactId`, `viaOffensiveRelation`,
  `viaOffensiveArtifactName`) and displayable in the interface.
- Several inference chains can lead to the same displayed row for a given source technique: the
  interface deduplicates them.

## 5. Ontology dimensions not used

The ontology also contains, without being used by the application:
- **Mapping to NIST 800-53 / CCI controls** (`d3f:CCIControl`, `d3f:member-of` a `CCICatalog`,
  linked to techniques via `d3f:broader`/`d3f:narrower`).
- **CWE mapping** (`d3f:cwe-id`, `d3f:weakness-of`, 943 occurrences).
- **A "Digital Event Ontology"** (`*Event` classes, `d3f:preceded-by` and `d3f:has-participant`
  predicates) describing sequences of observable events.

## 6. Sub-technique aggregation ("roll-up")

On `https://d3fend.mitre.org/api/technique/d3f:StrongPasswordPolicy.json`, a parent technique
(e.g. `D3-SPP` "Strong Password Policy") only carries a handful of relations/mappings of its own,
most being carried by its sub-techniques (e.g. `D3-CDP` "Change Default Password"). The official
site displays, on a technique's page, the combined relations/mappings of that technique **and of
all its sub-techniques**.

The interface (`technique-detail/`) reproduces this behavior by recursively walking up the
sub-techniques of the selected node, with a "via <sub-technique>" label.

Known count discrepancy: for `D3-SPP`, the official site shows 41 offensive techniques and the
application 28 (23 ATT&CK Enterprise + 5 ICS) after deduplicating the inference chains. The
probable cause is a different counting convention on the site's side (not confirmed).

## 7. Platform filter (BETA)

D3FEND has **no notion of platform**: neither `d3fend.csv` nor `d3fend.json` carries a related
predicate, and the `OffensiveTechnique` nodes imported from ATT&CK (e.g. `d3f:T1003.005`) do not
include `x_mitre_platforms`.

The platform filter therefore relies on an **external** source: `x_mitre_platforms` is read from
the official ATT&CK Enterprise STIX bundle (`mitre-attack/attack-stix-data`, via `scripts/etl/fetch-attack.mjs`) and
attached to `AttackMapping` records by joining on `offensiveTechniqueId`. A D3FEND technique can
then be filtered by platform through the offensive techniques it counters.

Limitations:
- **ATT&CK Enterprise only** (867 techniques in ATT&CK 20.1): `offensivePlatforms` remains empty for the
  2,862 ICS/SPARTA mappings.
- 10 values in v1.6.0: Windows, Linux, macOS, Containers, ESXi, IaaS, SaaS, Identity Provider,
  Network Devices, Office Suite.
- `D3fendLayer.filters.platforms` is a BETA field of the layer format.


## 8. Alignment with the current ATT&CK version

D3FEND references ATT&CK IDs as they existed when it was published. ATT&CK keeps evolving: in
v20.1, 22 techniques referenced by D3FEND 1.6.0 are **revoked** (e.g. `T1562.003` → `T1690`, the
whole `T1562` family moved to the `defense-impairment` tactic, ICS `T08xx` → `T169x`) and 3 are
**deprecated** without replacement (`T1053.004`, `T0807`, `T0853`). ATT&CK Navigator ignores those
entries: a layer exported as-is silently loses coverage.

`scripts/etl/resolve-attack-mappings.mjs` therefore aligns every Enterprise / ICS mapping with the
STIX bundles (`mitre-attack/attack-stix-data`, version pinned at download time and recorded in
the dataset's `attackVersions`):
- revoked technique → replaced by the target of its `revoked-by` relationship (chains followed);
  the original ID is kept in `originalOffensiveTechniqueId` and the UI shows "replaces …";
- D3FEND tactic no longer a tactic of the technique → mapping expanded to each of its current
  tactics (`originalOffensiveTacticId` keeps the original one);
- deprecated / revoked without replacement / unknown technique → mapping kept (D3FEND
  information), flagged through `offensiveTechniqueStatus` and excluded from ATT&CK Navigator exports.

Details (replacements, exclusions) are written to `public/data/etl-audit.json`.

The ATT&CK Navigator export also sets `versions.attack` (major version, e.g. `"20"`) and
`showSubtechniques: true` on the parent of every annotated sub-technique: Navigator collapses
parents by default, which used to hide sub-techniques.
