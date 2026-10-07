import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ThemePreference, ThemeService } from "../services/theme.service";
import { TranslationKey, TranslationService } from "../services/translation.service";

@Component({
  selector: "app-theme-toggle",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./theme-toggle.component.html",
  styleUrl: "./theme-toggle.component.scss"
})
export class ThemeToggleComponent {
  private readonly themeService = inject(ThemeService);
  readonly i18n = inject(TranslationService);

  readonly preference = this.themeService.preference;

  readonly options: { value: ThemePreference; labelKey: TranslationKey; icon: string }[] = [
    { value: "light", labelKey: "theme.light", icon: "☀️" },
    { value: "dark", labelKey: "theme.dark", icon: "🌙" },
    { value: "system", labelKey: "theme.system", icon: "🖥️" }
  ];

  select(value: ThemePreference): void {
    this.themeService.setPreference(value);
  }
}
