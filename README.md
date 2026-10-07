# D3FEND Navigator

**Français** | [English](#english)

Portage du concept de l'[ATT&CK Navigator](https://github.com/mitre-attack/attack-navigator)
officiel de MITRE au référentiel [MITRE D3FEND](https://d3fend.mitre.org/) : navigation et
annotation de la matrice D3FEND (Tactiques → Techniques → Contre-mesures), avec import/export
de « layers » JSON, sur le même principe que l'attack-navigator.

> **⚠️ Avertissement — projet non officiel**
> D3FEND Navigator est un projet indépendant et non officiel. **Il n'est ni affilié à, ni
> approuvé ou sponsorisé par The MITRE Corporation ou The Aerospace Corporation.**
> MITRE D3FEND™, MITRE ATT&CK® et MITRE ATLAS™ sont des marques de The MITRE Corporation ;
> SPARTA® est une marque de The Aerospace Corporation. Voir [NOTICE.md](./NOTICE.md) pour le
> détail des attributions et des conditions d'utilisation de chaque source tierce.

## Licence

Ce projet est distribué sous licence MIT (voir [LICENSE](./LICENSE)) : usage, copie,
modification et redistribution libres, y compris commerciales, sans obligation de rétribution.

Cette licence ne couvre que le code, les scripts et la documentation de ce dépôt — **pas** les
données D3FEND/ATT&CK/SPARTA qu'il télécharge et redistribue, qui restent soumises à leurs
propres conditions d'utilisation respectives (voir [NOTICE.md](./NOTICE.md)).

## Fonctionnalités

- Matrice D3FEND interactive (7 tactiques, techniques jusqu'à 3 niveaux de profondeur)
- Annotation par technique : couleur, score, commentaire — sélection multiple (Ctrl/Cmd+clic,
  Shift+clic)
- Onglets pour travailler sur plusieurs layers simultanément
- Recherche texte, filtre par artefact numérique D3FEND, filtre par tactique offensive
- Filtre par plateforme ATT&CK Enterprise (BETA — source externe à D3FEND, voir
  [data/README.md](./data/README.md) §7)
- Import/export d'un layer D3FEND au format JSON
- Export vers un layer ATT&CK Navigator (Enterprise ou ICS), en reportant les annotations des
  techniques D3FEND sur les techniques ATT&CK liées
- Export SVG de la matrice
- Thème clair/sombre/système, interface traduite (français/anglais selon la langue du
  navigateur)

## Démarrage avec Docker (recommandé)

Aucun prérequis autre que Docker — le dataset D3FEND est déjà versionné dans le dépôt,
aucun accès réseau à MITRE/GitHub n'est nécessaire pour builder l'image.

```bash
docker build -t d3fend-navigator .
docker run --rm -p 8080:8080 d3fend-navigator
```

Puis ouvrir <http://localhost:8080>.

## Démarrage sans Docker

Prérequis : Node.js (voir [.nvmrc](./.nvmrc)), Angular CLI 20.

```bash
npm install
npm start          # ng serve -> http://localhost:4200
```

Autres commandes utiles :

```bash
ng build --configuration production   # build de production
ng lint                               # analyse statique (code + scripts ETL)
ng test                               # tests unitaires
```

## Régénérer le dataset D3FEND

Le dataset applicatif (`public/data/d3fend-dataset.v*.json`) est produit par un pipeline ETL à
partir des exports officiels D3FEND et des bundles STIX ATT&CK :

```bash
npm run etl:fetch          # télécharge l'export officiel D3FEND (data/raw/, non versionné)
npm run etl:fetch-attack   # télécharge les bundles STIX ATT&CK Enterprise + ICS
npm run etl:build          # génère public/data/d3fend-dataset.v<version>.json
```

Détails du modèle de données et des points vérifiés sur l'ontologie officielle :
[data/README.md](./data/README.md).

## Architecture

SPA Angular 20 (standalone components, signaux), 100% client-side — aucune donnée utilisateur
n'est envoyée à un serveur. Voir les commentaires en tête de chaque service/composant pour le
détail des choix de conception.

---

<a id="english"></a>

# D3FEND Navigator (English)

[Français](#d3fend-navigator) | **English**

A port of the concept behind MITRE's official
[ATT&CK Navigator](https://github.com/mitre-attack/attack-navigator) to the
[MITRE D3FEND](https://d3fend.mitre.org/) framework: browse and annotate the D3FEND matrix
(Tactics → Techniques → Countermeasures), with JSON "layer" import/export, on the same principle
as attack-navigator.

> **⚠️ Disclaimer — unofficial project**
> D3FEND Navigator is an independent, unofficial project. **It is not affiliated with, endorsed
> by, or sponsored by The MITRE Corporation or The Aerospace Corporation.**
> MITRE D3FEND™, MITRE ATT&CK® and MITRE ATLAS™ are trademarks of The MITRE Corporation;
> SPARTA® is a trademark of The Aerospace Corporation. See [NOTICE.md](./NOTICE.md) for details
> of the attributions and terms of use of each third-party source.

## License

This project is distributed under the MIT License (see [LICENSE](./LICENSE)): free use, copying,
modification and redistribution, including commercially, with no obligation to pay royalties.

This license only covers the code, scripts and documentation in this repository — **not** the
D3FEND/ATT&CK/SPARTA data it downloads and redistributes, which remain subject to their own
respective terms of use (see [NOTICE.md](./NOTICE.md)).

## Features

- Interactive D3FEND matrix (7 tactics, techniques up to 3 levels deep)
- Per-technique annotation: color, score, comment — multiple selection (Ctrl/Cmd+click,
  Shift+click)
- Tabs for working on several layers at once
- Text search, D3FEND digital artifact filter, offensive tactic filter
- ATT&CK Enterprise platform filter (BETA — source external to D3FEND, see
  [data/README.md](./data/README.md) §7)
- D3FEND layer import/export as JSON
- Export to an ATT&CK Navigator layer (Enterprise or ICS), carrying the annotations of D3FEND
  techniques over to the related ATT&CK techniques
- SVG export of the matrix
- Light/dark/system theme, translated interface (French/English based on the browser language)

## Getting started with Docker (recommended)

No prerequisites other than Docker — the D3FEND dataset is already versioned in the repository,
so no network access to MITRE/GitHub is needed to build the image.

```bash
docker build -t d3fend-navigator .
docker run --rm -p 8080:8080 d3fend-navigator
```

Then open <http://localhost:8080>.

## Getting started without Docker

Prerequisites: Node.js (see [.nvmrc](./.nvmrc)), Angular CLI 20.

```bash
npm install
npm start          # ng serve -> http://localhost:4200
```

Other useful commands:

```bash
ng build --configuration production   # production build
ng lint                               # static analysis (code + ETL scripts)
ng test                               # unit tests
```

## Regenerating the D3FEND dataset

The application dataset (`public/data/d3fend-dataset.v*.json`) is produced by an ETL pipeline
from the official D3FEND exports and the ATT&CK STIX bundles:

```bash
npm run etl:fetch          # downloads the official D3FEND export (data/raw/, not versioned)
npm run etl:fetch-attack   # downloads the ATT&CK Enterprise + ICS STIX bundles
npm run etl:build          # generates public/data/d3fend-dataset.v<version>.json
```

Details of the data model and of the points verified against the official ontology:
[data/README.md](./data/README.md).

## Architecture

Angular 20 SPA (standalone components, signals), 100% client-side — no user data is sent to a
server. See the comments at the top of each service/component for details of the design choices.
