import { Injectable, signal } from "@angular/core";

/** Préférences d'affichage, non enregistrées dans le layer. */
@Injectable({ providedIn: "root" })
export class ViewPreferencesService {
  /** Affiche la chaîne d'artefacts sous chaque mapping offensif. */
  readonly showMappingChain = signal(false);

  setShowMappingChain(value: boolean): void {
    this.showMappingChain.set(value);
  }
}
