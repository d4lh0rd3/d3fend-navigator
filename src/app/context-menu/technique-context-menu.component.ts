import { Component, HostListener, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ContextMenuService } from "../services/context-menu.service";
import { TranslationService } from "../services/translation.service";

const D3FEND_SITE = "https://d3fend.mitre.org";

/** Menu contextuel d'une technique : liens vers les pages d3fend.mitre.org. */
@Component({
  selector: "app-technique-context-menu",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./technique-context-menu.component.html",
  styleUrl: "./technique-context-menu.component.scss"
})
export class TechniqueContextMenuComponent {
  private readonly contextMenuService = inject(ContextMenuService);
  readonly i18n = inject(TranslationService);

  readonly target = this.contextMenuService.target;

  @HostListener("document:click")
  onDocumentClick(): void {
    this.contextMenuService.close();
  }

  /* Le clic droit qui ouvre le menu a déjà appelé preventDefault() : sans ce test, le menu
   * se refermerait aussitôt. */
  @HostListener("document:contextmenu", ["$event"])
  onDocumentContextMenu(event: MouseEvent): void {
    if (!event.defaultPrevented) {
      this.contextMenuService.close();
    }
  }

  @HostListener("document:keydown.escape")
  onEscape(): void {
    this.contextMenuService.close();
  }

  tacticUrl(tacticId: string): string {
    return `${D3FEND_SITE}/tactic/d3f:${tacticId}/`;
  }

  techniqueUrl(localName: string): string {
    return `${D3FEND_SITE}/technique/d3f:${localName}/`;
  }
}
