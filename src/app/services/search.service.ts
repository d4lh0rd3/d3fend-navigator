import { Injectable, signal } from "@angular/core";

/** Recherche texte : éphémère, non enregistrée dans le layer. */
@Injectable({ providedIn: "root" })
export class SearchService {
  private readonly querySignal = signal("");
  readonly query = this.querySignal.asReadonly();

  setQuery(value: string): void {
    this.querySignal.set(value);
  }

  clear(): void {
    this.querySignal.set("");
  }
}
