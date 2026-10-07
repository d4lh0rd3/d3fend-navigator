import { Component, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MatrixComponent } from './matrix/matrix.component';
import { LayerSettingsComponent } from './layer-settings/layer-settings.component';
import { TechniqueDetailComponent } from './technique-detail/technique-detail.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { StartPageComponent } from './start-page/start-page.component';
import { TabsComponent } from './tabs/tabs.component';
import { ThemeToggleComponent } from './theme-toggle/theme-toggle.component';
import { TechniqueContextMenuComponent } from './context-menu/technique-context-menu.component';
import { LayerService } from './services/layer.service';

type Screen = 'start' | 'workspace';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    RouterOutlet,
    MatrixComponent,
    LayerSettingsComponent,
    TechniqueDetailComponent,
    SidebarComponent,
    StartPageComponent,
    TabsComponent,
    ThemeToggleComponent,
    TechniqueContextMenuComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'd3fend-navigator';

  private readonly layerService = inject(LayerService);

  readonly screen = signal<Screen>('start');

  onReady(): void {
    this.screen.set('workspace');
  }

  /** Demande confirmation avant de quitter la page s'il existe des modifications non exportées. */
  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.layerService.hasUnsavedChanges()) {
      event.preventDefault();
      event.returnValue = '';
    }
  }
}
