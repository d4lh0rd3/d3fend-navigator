import { Injectable, signal } from "@angular/core";

export interface ContextMenuTarget {
  x: number;
  y: number;
  tacticId: string;
  techniqueLocalName: string | null;
}

@Injectable({ providedIn: "root" })
export class ContextMenuService {
  private readonly targetSignal = signal<ContextMenuTarget | null>(null);
  readonly target = this.targetSignal.asReadonly();

  open(target: ContextMenuTarget): void {
    this.targetSignal.set(target);
  }

  close(): void {
    this.targetSignal.set(null);
  }
}
