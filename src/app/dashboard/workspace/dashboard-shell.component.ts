import {
  Component,
  HostListener,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CdkTrapFocus } from '@angular/cdk/a11y';
import { BROWSER_VIEWPORT } from '../grid-layout/browser-viewport';
import { DASHBOARD_GRID_CONFIG } from '../grid-layout/dashboard-grid.config';
import type { WidgetInstance } from './dashboard.models';
import { DashboardStore } from './dashboard.store';
import { DashboardGridComponent } from '../grid-layout/dashboard-grid.component';
import { WidgetCatalogComponent } from '../widget-catalog/widget-catalog.component';
import { WidgetElementComponent } from '../widget-element-host/widget-element.component';
import { WidgetInstallationService } from '../widget-installation/widget-installation.service';

@Component({
  selector: 'app-dashboard-shell',
  imports: [
    WidgetCatalogComponent,
    DashboardGridComponent,
    WidgetElementComponent,
    CdkTrapFocus,
  ],
  templateUrl: './dashboard-shell.component.html',
  styleUrl: './dashboard-shell.component.scss',
})
export class DashboardShellComponent {
  protected readonly store = inject(DashboardStore);
  protected readonly isWidgetDrawerOpen = signal(false);
  protected readonly settingsWidgetId = signal<WidgetInstance['id'] | null>(
    null,
  );
  protected readonly isNarrowScreen = computed(
    () => this.viewport.width() <= DASHBOARD_GRID_CONFIG.narrowScreenBreakpoint,
  );

  private readonly viewport = inject(BROWSER_VIEWPORT);
  private readonly installations = inject(WidgetInstallationService);

  protected readonly settingsWidget = computed(() => {
    const id = this.settingsWidgetId();
    const dashboard = this.store.dashboard();

    return id === null || dashboard === null
      ? null
      : (dashboard.widgets.find((widget) => widget.id === id) ?? null);
  });
  protected readonly settingsInstallation = computed(() => {
    const widget = this.settingsWidget();

    return widget === null
      ? null
      : (this.installations.installationFor(widget.type) ?? null);
  });

  constructor() {
    effect(() => {
      if (this.isNarrowScreen()) {
        this.isWidgetDrawerOpen.set(false);
        this.closeWidgetSettings();
      }

      if (this.settingsWidgetId() !== null && this.settingsWidget() === null) {
        this.closeWidgetSettings();
      }
    });
  }

  protected openWidgetDrawer(): void {
    if (!this.isNarrowScreen()) {
      this.isWidgetDrawerOpen.set(true);
    }
  }

  protected closeWidgetDrawer(): void {
    this.isWidgetDrawerOpen.set(false);
  }

  protected openWidgetSettings(widget: WidgetInstance): void {
    if (!this.isNarrowScreen()) {
      this.settingsWidgetId.set(widget.id);
    }
  }

  protected closeWidgetSettings(): void {
    this.settingsWidgetId.set(null);
  }

  @HostListener('document:keydown.escape')
  protected dismissWidgetSettings(): void {
    this.closeWidgetSettings();
  }
}
