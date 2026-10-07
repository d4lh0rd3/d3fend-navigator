import { Injectable, signal } from "@angular/core";

export type Locale = "fr" | "en";

/**
 * Dictionnaire de référence : `TranslationKey` en dérive, le dictionnaire anglais doit donc
 * couvrir exactement les mêmes clés. Seule l'interface est traduite ; le contenu D3FEND
 * n'existe qu'en anglais.
 */
const FR = {
  "common.clearAll": "Tout effacer",
  "common.via": "via",

  "startPage.subtitle": "Navigation et annotation de la matrice MITRE D3FEND — inspiré d'ATT&CK Navigator.",
  "startPage.createNew.title": "Créer un nouveau layer",
  "startPage.createNew.desc": "Démarrer avec une matrice vierge, à annoter (couleur, score, commentaire).",
  "startPage.openExisting.title": "Ouvrir un layer existant",
  "startPage.openExisting.desc": "Importer un fichier de layer (.json) précédemment exporté.",
  "startPage.loading": "Chargement…",
  "startPage.readError": "Impossible de lire ce fichier.",

  "tabs.unnamedLayer": "Layer sans nom",
  "tabs.closeTab": "Fermer cet onglet",
  "tabs.newLayer": "Nouveau layer",
  "tabs.confirmClose": "Ce layer contient des modifications non exportées. Les perdre en fermant cet onglet ?",

  "sidebar.searchPlaceholder": "Rechercher une technique (ID ou nom)…",
  "sidebar.clear": "Effacer",
  "sidebar.matchCount": "{count} technique(s) trouvée(s)",
  "sidebar.showMappingChain": "Afficher la chaîne explicative des mappings",
  "sidebar.collapseAll": "Tout replier",
  "sidebar.expandAll": "Tout déplier",
  "sidebar.collapseAllTitle": "Replier toutes les sous-techniques",
  "sidebar.expandAllTitle": "Déplier toutes les sous-techniques",

  "layerSettings.namePlaceholder": "Nom du layer",
  "layerSettings.new": "Nouveau",
  "layerSettings.import": "Importer",
  "layerSettings.exportJson": "Exporter layer D3FEND",
  "layerSettings.exportSvg": "Exporter SVG",
  "layerSettings.selectionCount": "{count} techniques sélectionnées",
  "layerSettings.bulkHint": "Les modifications ci-dessous s'appliquent à toute la sélection.",
  "layerSettings.color": "Couleur",
  "layerSettings.colorSwatch": "Couleur {color}",
  "layerSettings.noColor": "Aucune couleur",
  "layerSettings.score": "Score",
  "layerSettings.comment": "Commentaire",
  "layerSettings.emptyHint": "Sélectionne une technique dans la matrice pour l'annoter.",

  "techniqueDetail.multiSelectHint":
    "{count} techniques sélectionnées — le détail ne s'affiche que pour une seule technique à la fois.",
  "techniqueDetail.noDefinition": "Pas de définition propre à ce noeud (regroupement de sous-techniques).",
  "techniqueDetail.scope": "Inclut les {count} sous-technique(s) de {id} ci-dessous (comme sur le site officiel D3FEND).",
  "techniqueDetail.artifactsTitle": "Artefacts numériques concernés",
  "techniqueDetail.filterByTactic": "Filtrer par tactique",
  "techniqueDetail.offensiveTactics": "Tactiques offensives",
  "techniqueDetail.noMappingForTactics": "Aucun mapping ne correspond aux tactiques sélectionnées.",
  "techniqueDetail.noRelationOrMapping":
    "Aucune relation vers un artefact ni mapping offensif pour cette technique (ni ses éventuelles sous-techniques).",
  "techniqueDetail.selectHint": "Sélectionne une technique pour voir son détail.",

  "contextMenu.viewTactic": "Voir la tactique",
  "contextMenu.viewTechnique": "Voir la technique",
  "contextMenu.noTechniquePage": "Pas de page dédiée pour cette technique",

  "artifactFilter.trigger": "Artefacts",
  "artifactFilter.searchPlaceholder": "Filtrer les artefacts…",
  "artifactFilter.empty": "Aucun artefact trouvé",

  "matrix.loadError": "Impossible de charger les données D3FEND : {message}",
  "matrix.loading": "Chargement des données D3FEND…",

  "theme.ariaLabel": "Thème",
  "theme.light": "Clair",
  "theme.dark": "Sombre",
  "theme.system": "Système",

  "platformFilter.trigger": "Plateformes",
  "platformFilter.header": "Plateformes ATT&CK Enterprise",
  "platformFilter.hint":
    "Fonctionnalité expérimentale : D3FEND n'a pas de notion de plateforme propre, celles-ci viennent des techniques offensives ATT&CK Enterprise contrées (pas ICS/SPARTA).",

  "layerSettings.exportAttackEnterprise": "Exporter layer ATT&CK Enterprise",
  "layerSettings.exportAttackIcs": "Exporter layer ATT&CK ICS",

  "attackExport.layerName": "{name} (export {domain})",
  "attackExport.description":
    "Généré depuis le layer D3FEND « {name} » par d3fend-navigator : couleur/score/commentaire reportés sur les techniques {domain} liées (mapping inféré par MITRE, voir data/README.md).",
  "attackExport.sourceMetadataLabel": "Technique(s) D3FEND source",

  "errors.datasetNotLoaded": "Le dataset D3FEND n'est pas chargé.",
  "errors.invalidLayerFile": "Fichier layer invalide : structure inattendue.",
  "errors.noDatasetVersion": "Aucun dataset D3FEND disponible pour la version {version}.",
  "errors.noDataset": "Aucun dataset D3FEND disponible.",
  "errors.noAnnotatedTechniques": "Aucune technique n'est annotée (couleur, score ou commentaire) dans ce layer.",
  "errors.noAttackMappingFound": "Aucune des techniques annotées ne correspond à une technique {domain} connue."
} as const;

export type TranslationKey = keyof typeof FR;

const EN: Record<TranslationKey, string> = {
  "common.clearAll": "Clear all",
  "common.via": "via",

  "startPage.subtitle": "Navigate and annotate the MITRE D3FEND matrix — inspired by ATT&CK Navigator.",
  "startPage.createNew.title": "Create a new layer",
  "startPage.createNew.desc": "Start from a blank matrix, to annotate (color, score, comment).",
  "startPage.openExisting.title": "Open an existing layer",
  "startPage.openExisting.desc": "Import a previously exported layer file (.json).",
  "startPage.loading": "Loading…",
  "startPage.readError": "Unable to read this file.",

  "tabs.unnamedLayer": "Unnamed layer",
  "tabs.closeTab": "Close this tab",
  "tabs.newLayer": "New layer",
  "tabs.confirmClose": "This layer has unexported changes. Discard them by closing this tab?",

  "sidebar.searchPlaceholder": "Search a technique (ID or name)…",
  "sidebar.clear": "Clear",
  "sidebar.matchCount": "{count} technique(s) found",
  "sidebar.showMappingChain": "Show the mapping explanation chain",
  "sidebar.collapseAll": "Collapse all",
  "sidebar.expandAll": "Expand all",
  "sidebar.collapseAllTitle": "Collapse all sub-techniques",
  "sidebar.expandAllTitle": "Expand all sub-techniques",

  "layerSettings.namePlaceholder": "Layer name",
  "layerSettings.new": "New",
  "layerSettings.import": "Import",
  "layerSettings.exportJson": "Export D3FEND layer",
  "layerSettings.exportSvg": "Export SVG",
  "layerSettings.exportAttackEnterprise": "Export ATT&CK Enterprise layer",
  "layerSettings.exportAttackIcs": "Export ATT&CK ICS layer",
  "layerSettings.selectionCount": "{count} techniques selected",
  "layerSettings.bulkHint": "Changes below apply to the whole selection.",
  "layerSettings.color": "Color",
  "layerSettings.colorSwatch": "Color {color}",
  "layerSettings.noColor": "No color",
  "layerSettings.score": "Score",
  "layerSettings.comment": "Comment",
  "layerSettings.emptyHint": "Select a technique in the matrix to annotate it.",

  "techniqueDetail.multiSelectHint": "{count} techniques selected — details are shown for a single technique only.",
  "techniqueDetail.noDefinition": "No definition of its own for this node (sub-techniques grouping).",
  "techniqueDetail.scope": "Includes the {count} sub-technique(s) of {id} below (as on the official D3FEND site).",
  "techniqueDetail.artifactsTitle": "Related digital artifacts",
  "techniqueDetail.filterByTactic": "Filter by tactic",
  "techniqueDetail.offensiveTactics": "Offensive tactics",
  "techniqueDetail.noMappingForTactics": "No mapping matches the selected tactics.",
  "techniqueDetail.noRelationOrMapping":
    "No artifact relation nor offensive mapping for this technique (nor its sub-techniques, if any).",
  "techniqueDetail.selectHint": "Select a technique to see its details.",

  "contextMenu.viewTactic": "View tactic",
  "contextMenu.viewTechnique": "View technique",
  "contextMenu.noTechniquePage": "No dedicated page for this technique",

  "artifactFilter.trigger": "Artifacts",
  "artifactFilter.searchPlaceholder": "Filter artifacts…",
  "artifactFilter.empty": "No artifact found",

  "matrix.loadError": "Failed to load D3FEND data: {message}",
  "matrix.loading": "Loading D3FEND data…",

  "theme.ariaLabel": "Theme",
  "theme.light": "Light",
  "theme.dark": "Dark",
  "theme.system": "System",

  "platformFilter.trigger": "Platforms",
  "platformFilter.header": "ATT&CK Enterprise Platforms",
  "platformFilter.hint":
    "Experimental feature: D3FEND has no platform concept of its own, these come from the ATT&CK Enterprise offensive techniques countered (not ICS/SPARTA).",

  "attackExport.layerName": "{name} ({domain} export)",
  "attackExport.description":
    "Generated from the D3FEND layer \"{name}\" by d3fend-navigator: color/score/comment carried over to the related {domain} techniques (mapping inferred by MITRE, see data/README.md).",
  "attackExport.sourceMetadataLabel": "Source D3FEND technique(s)",

  "errors.datasetNotLoaded": "The D3FEND dataset is not loaded.",
  "errors.invalidLayerFile": "Invalid layer file: unexpected structure.",
  "errors.noDatasetVersion": "No D3FEND dataset available for version {version}.",
  "errors.noDataset": "No D3FEND dataset available.",
  "errors.noAnnotatedTechniques": "No technique is annotated (color, score or comment) in this layer.",
  "errors.noAttackMappingFound": "None of the annotated techniques map to a known {domain} technique."
};

const DICTIONARIES: Record<Locale, Record<TranslationKey, string>> = { fr: FR, en: EN };

function detectLocale(): Locale {
  const lang = typeof navigator !== "undefined" ? navigator.language : "";
  return lang.toLowerCase().startsWith("fr") ? "fr" : "en";
}

/** Langue détectée au démarrage via `navigator.language` : français si "fr*", anglais sinon. */
@Injectable({ providedIn: "root" })
export class TranslationService {
  private readonly localeSignal = signal<Locale>(detectLocale());
  readonly locale = this.localeSignal.asReadonly();

  t(key: TranslationKey, params?: Record<string, string | number>): string {
    const template = DICTIONARIES[this.localeSignal()][key];
    if (!params) return template;
    return template.replace(/\{(\w+)\}/g, (_, name: string) => String(params[name] ?? ""));
  }
}
