# Third-Party Notices

**English** | [Français](#francais)

D3FEND Navigator is an independent, unofficial project. It is **not affiliated
with, endorsed by, or sponsored by The MITRE Corporation or The Aerospace
Corporation**. It builds on publicly available data and is inspired by the
architecture of an official MITRE tool, both credited below under their own
terms.

## MITRE D3FEND

This project's ETL pipeline (`scripts/etl/`) downloads and transforms the
official MITRE D3FEND ontology export, and the resulting dataset
(`public/data/d3fend-dataset.v*.json`) is bundled with and served by the
application.

> LICENSE
>
> The MITRE Corporation (MITRE) hereby grants you a non-exclusive,
> royalty-free license to use D3FEND for research, development, and
> commercial purposes. Any copy you make for such purposes is authorized
> provided that you reproduce MITRE's copyright designation and this license
> in any such copy.
>
> © 2025 The MITRE Corporation.

MITRE D3FEND™ and the MITRE D3FEND logo are trademarks of The MITRE
Corporation. Source: <https://d3fend.mitre.org/tou/>.

## MITRE ATT&CK

This project's ETL pipeline downloads the official MITRE ATT&CK Enterprise and
ATT&CK ICS STIX bundles (from <https://github.com/mitre/cti>) to resolve
tactic names/shortnames and technique platforms, and the resulting mapping
data is bundled with and served by the application.

> LICENSE
>
> The MITRE Corporation (MITRE) hereby grants you a non-exclusive,
> royalty-free license to use ATT&CK® for research, development, and
> commercial purposes. Any copy you make for such purposes is authorized
> provided that you reproduce MITRE's copyright designation and this license
> in any such copy.
>
> "© 2026 The MITRE Corporation. This work is reproduced and distributed with
> the permission of The MITRE Corporation."

MITRE ATT&CK® is a registered trademark of The MITRE Corporation. Source:
<https://github.com/mitre/cti/blob/master/LICENSE.txt>.

## Aerospace SPARTA

The D3FEND-to-offensive-technique mapping data bundled with this project
includes mappings to SPARTA techniques.

> ©2023 The Aerospace Corporation. This work is reproduced and distributed
> with the permission of The Aerospace Corporation.
>
> License
>
> The Aerospace Corporation hereby grants you a non-exclusive, royalty-free
> license to use SPARTA for research, development, and commercial purposes.
> Any copy you make for such purposes is authorized provided that you
> reproduce Aerospace's copyright designation and this license in any such
> copy.

SPARTA® is a registered trademark of The Aerospace Corporation. Terms of
service: <https://sparta.aerospace.org/terms-of-service>.

## MITRE ATT&CK Navigator (architecture inspiration)

D3FEND Navigator's concept — a matrix-based layer editor with tabs, filters,
and JSON import/export — is inspired by the official MITRE ATT&CK Navigator
(<https://github.com/mitre-attack/attack-navigator>). No source code from that
project was copied; this project's code was written independently.

> MITRE ATT&CK Navigator is licensed under the Apache License, Version 2.0.
> A copy of the license is available at
> <https://github.com/mitre-attack/attack-navigator/blob/master/LICENSE.txt>
> and at <https://www.apache.org/licenses/LICENSE-2.0>.

## Your obligations

If you copy, modify, or redistribute this project (under the terms of
`LICENSE`), you must keep this file intact and reproduce the notices above,
in addition to complying with each third party's own terms linked here for
any of their content you access, copy, or redistribute through this project.

---

<a id="francais"></a>

# Mentions relatives aux tiers

[English](#third-party-notices) | **Français**

> Traduction fournie à titre informatif. Seule la version anglaise ci-dessus, et
> notamment le texte original des licences, fait foi.

D3FEND Navigator est un projet indépendant et non officiel. Il **n'est ni affilié
à, ni approuvé ou sponsorisé par The MITRE Corporation ou The Aerospace
Corporation**. Il s'appuie sur des données publiques et s'inspire de
l'architecture d'un outil officiel de MITRE, tous deux crédités ci-dessous selon
leurs propres conditions.

## MITRE D3FEND

Le pipeline ETL de ce projet (`scripts/etl/`) télécharge et transforme l'export
officiel de l'ontologie MITRE D3FEND, et le jeu de données qui en résulte
(`public/data/d3fend-dataset.v*.json`) est fourni avec l'application et servi
par celle-ci.

> LICENCE
>
> The MITRE Corporation (MITRE) vous accorde par la présente une licence non
> exclusive et libre de redevances pour utiliser D3FEND à des fins de recherche,
> de développement et à des fins commerciales. Toute copie que vous réalisez à
> ces fins est autorisée à condition de reproduire dans cette copie la mention
> de droit d'auteur de MITRE et la présente licence.
>
> © 2025 The MITRE Corporation.

MITRE D3FEND™ et le logo MITRE D3FEND sont des marques de The MITRE Corporation.
Source : <https://d3fend.mitre.org/tou/>.

## MITRE ATT&CK

Le pipeline ETL de ce projet télécharge les bundles STIX officiels MITRE ATT&CK
Enterprise et ATT&CK ICS (depuis <https://github.com/mitre/cti>) afin de résoudre
les noms et noms courts des tactiques ainsi que les plateformes des techniques,
et les données de correspondance qui en résultent sont fournies avec
l'application et servies par celle-ci.

> LICENCE
>
> The MITRE Corporation (MITRE) vous accorde par la présente une licence non
> exclusive et libre de redevances pour utiliser ATT&CK® à des fins de recherche,
> de développement et à des fins commerciales. Toute copie que vous réalisez à
> ces fins est autorisée à condition de reproduire dans cette copie la mention
> de droit d'auteur de MITRE et la présente licence.
>
> « © 2026 The MITRE Corporation. Cette œuvre est reproduite et distribuée avec
> l'autorisation de The MITRE Corporation. »

MITRE ATT&CK® est une marque déposée de The MITRE Corporation. Source :
<https://github.com/mitre/cti/blob/master/LICENSE.txt>.

## Aerospace SPARTA

Les données de correspondance entre D3FEND et les techniques offensives fournies
avec ce projet comprennent des correspondances vers des techniques SPARTA.

> ©2023 The Aerospace Corporation. Cette œuvre est reproduite et distribuée avec
> l'autorisation de The Aerospace Corporation.
>
> Licence
>
> The Aerospace Corporation vous accorde par la présente une licence non
> exclusive et libre de redevances pour utiliser SPARTA à des fins de recherche,
> de développement et à des fins commerciales. Toute copie que vous réalisez à
> ces fins est autorisée à condition de reproduire dans cette copie la mention
> de droit d'auteur d'Aerospace et la présente licence.

SPARTA® est une marque déposée de The Aerospace Corporation. Conditions
d'utilisation : <https://sparta.aerospace.org/terms-of-service>.

## MITRE ATT&CK Navigator (inspiration d'architecture)

Le concept de D3FEND Navigator — un éditeur de layers fondé sur une matrice, avec
onglets, filtres et import/export JSON — s'inspire de l'outil officiel MITRE
ATT&CK Navigator (<https://github.com/mitre-attack/attack-navigator>). Aucun code
source de ce projet n'a été copié ; le code du présent projet a été écrit de
manière indépendante.

> MITRE ATT&CK Navigator est distribué sous licence Apache, version 2.0.
> Une copie de la licence est disponible à l'adresse
> <https://github.com/mitre-attack/attack-navigator/blob/master/LICENSE.txt>
> et à l'adresse <https://www.apache.org/licenses/LICENSE-2.0>.

## Vos obligations

Si vous copiez, modifiez ou redistribuez ce projet (selon les termes du fichier
`LICENSE`), vous devez conserver ce fichier intact et reproduire les mentions
ci-dessus, et respecter en outre les conditions propres à chaque tiers, indiquées
ici, pour tout contenu de ce tiers auquel vous accédez, que vous copiez ou que
vous redistribuez par l'intermédiaire de ce projet.
