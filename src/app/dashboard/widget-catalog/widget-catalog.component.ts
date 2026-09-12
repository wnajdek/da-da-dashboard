import {
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { DashboardStore } from '../workspace/dashboard.store';
import type { WidgetInstallation } from '../widget-installation/widget-installation.models';
import { WidgetInstallationService } from '../widget-installation/widget-installation.service';

@Component({
  selector: 'app-widget-catalog',
  imports: [RouterLink],
  templateUrl: './widget-catalog.component.html',
  styleUrl: './widget-catalog.component.scss',
})
export class WidgetCatalogComponent {
  readonly isOpen = input(false);
  readonly closed = output<void>();

  private readonly store = inject(DashboardStore);
  private readonly iconPalette = [
    '#2f80ed',
    '#20b38e',
    '#f5a623',
    '#e85d75',
    '#8d6ee8',
  ];
  protected readonly installations = inject(WidgetInstallationService);
  protected readonly searchQuery = signal('');
  protected readonly filteredInstallations = computed(() => {
    const query = this.searchQuery().trim().toLocaleLowerCase();

    if (query.length === 0) {
      return this.installations.installations();
    }

    return this.installations
      .installations()
      .filter((installation) =>
        [installation.displayName, installation.description ?? ''].some(
          (value) => value.toLocaleLowerCase().includes(query),
        ),
      );
  });

  protected updateSearchQuery(event: Event): void {
    const input = event.target;

    if (input instanceof HTMLInputElement) {
      this.searchQuery.set(input.value);
    }
  }

  protected addWidget(installation: WidgetInstallation): void {
    this.store.addWidget({
      type: installation.type,
      configuration: installation.defaultConfiguration,
      preferredLayout: installation.preferredLayout,
    });
  }

  protected widgetAccent(widgetType: string): string {
    const hash = [...widgetType].reduce(
      (value, character) => (value * 31 + character.charCodeAt(0)) | 0,
      0,
    );

    return this.iconPalette[Math.abs(hash) % this.iconPalette.length];
  }
}
