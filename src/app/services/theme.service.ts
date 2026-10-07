import { Injectable, effect, signal } from "@angular/core";

export type ThemePreference = "light" | "dark" | "system";

const STORAGE_KEY = "d3fend-navigator.theme";

/**
 * Thème clair/sombre/système, persisté en localStorage et appliqué via `data-theme` sur
 * <html>. "system" retire l'attribut : le CSS suit alors `prefers-color-scheme`.
 */
@Injectable({ providedIn: "root" })
export class ThemeService {
  private readonly preferenceSignal = signal<ThemePreference>(this.readStored());
  readonly preference = this.preferenceSignal.asReadonly();

  constructor() {
    effect(() => this.applyToDocument(this.preferenceSignal()));
  }

  setPreference(preference: ThemePreference): void {
    this.preferenceSignal.set(preference);
    try {
      localStorage.setItem(STORAGE_KEY, preference);
    } catch {
      // stockage indisponible : préférence conservée pour la session seulement
    }
  }

  private readStored(): ThemePreference {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "light" || stored === "dark" || stored === "system") {
        return stored;
      }
    } catch {
      // stockage indisponible : thème par défaut
    }
    return "system";
  }

  private applyToDocument(preference: ThemePreference): void {
    const root = document.documentElement;
    if (preference === "system") {
      root.removeAttribute("data-theme");
    } else {
      root.setAttribute("data-theme", preference);
    }
  }
}
