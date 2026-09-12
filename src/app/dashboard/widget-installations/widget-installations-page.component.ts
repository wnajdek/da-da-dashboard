import { Component, computed, inject, signal } from '@angular/core';
import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DASHBOARD_GRID_CONFIG } from '../grid-layout/dashboard-grid.config';
import { BROWSER_VIEWPORT } from '../grid-layout/browser-viewport';
import type {
  WidgetInstallation,
  WidgetInstallationResult,
} from '../widget-installation/widget-installation.models';
import { WidgetInstallationService } from '../widget-installation/widget-installation.service';
import { DashboardStore } from '../workspace/dashboard.store';

type InstallationSort = 'name-ascending' | 'name-descending';

interface InstallationFeedback {
  readonly status: 'success' | 'error';
  readonly message: string;
}

@Component({
  selector: 'app-widget-installations-page',
  imports: [CdkMenu, CdkMenuItem, CdkMenuTrigger, RouterLink],
  templateUrl: './widget-installations-page.component.html',
  styleUrl: './widget-installations-page.component.scss',
})
export class WidgetInstallationsPageComponent {
  private readonly installationsService = inject(WidgetInstallationService);
  private readonly dashboardStore = inject(DashboardStore);
  private readonly viewport = inject(BROWSER_VIEWPORT);
  private readonly route = inject(ActivatedRoute);
  private readonly iconPalette = [
    '#2f80ed',
    '#20b38e',
    '#f5a623',
    '#e85d75',
    '#8d6ee8',
  ];

  protected readonly installations = this.installationsService.installations;
  protected readonly recoveryMessage =
    this.installationsService.recoveryMessage;
  protected readonly isInstalling = this.installationsService.isInstalling;
  protected readonly narrowScreen = computed(
    () => this.viewport.width() <= DASHBOARD_GRID_CONFIG.narrowScreenBreakpoint,
  );
  protected readonly returnToWidgetDrawer =
    this.route.snapshot.queryParamMap.get('returnTo') === 'add-widget';
  protected readonly searchQuery = signal('');
  protected readonly sort = signal<InstallationSort>('name-ascending');
  protected readonly isInstallationFormOpen = signal(false);
  protected readonly manifestUrl = signal('');
  protected readonly installationFeedback = signal<InstallationFeedback | null>(
    null,
  );
  protected readonly uninstallCandidate = signal<WidgetInstallation | null>(
    null,
  );
  protected readonly resetConfirmationOpen = signal(false);
  protected readonly filteredInstallations = computed(() => {
    const query = this.searchQuery().trim().toLocaleLowerCase();
    const direction = this.sort() === 'name-ascending' ? 1 : -1;

    return [...this.installations()]
      .filter((installation) =>
        query.length === 0
          ? true
          : [
              installation.displayName,
              installation.description ?? '',
              installation.type,
              installation.version,
              installation.elementTag,
              installation.settingsElementTag,
              installation.manifestUrl,
            ].some((value) => value.toLocaleLowerCase().includes(query)),
      )
      .sort(
        (left, right) =>
          direction * left.displayName.localeCompare(right.displayName),
      );
  });

  protected updateSearchQuery(event: Event): void {
    const input = event.target;

    if (input instanceof HTMLInputElement) {
      this.searchQuery.set(input.value);
    }
  }

  protected updateSort(event: Event): void {
    const select = event.target;

    if (
      select instanceof HTMLSelectElement &&
      (select.value === 'name-ascending' || select.value === 'name-descending')
    ) {
      this.sort.set(select.value);
    }
  }

  protected clearSearch(): void {
    this.searchQuery.set('');
  }

  protected openInstallationForm(): void {
    if (!this.narrowScreen()) {
      this.isInstallationFormOpen.set(true);
      this.installationFeedback.set(null);
    }
  }

  protected closeInstallationForm(): void {
    this.isInstallationFormOpen.set(false);
    this.manifestUrl.set('');
    this.installationFeedback.set(null);
  }

  protected updateManifestUrl(event: Event): void {
    const input = event.target;

    if (input instanceof HTMLInputElement) {
      this.manifestUrl.set(input.value);
    }
  }

  protected async installManifest(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    const result = await this.installationsService.installManifest(
      this.manifestUrl(),
    );

    this.presentInstallationResult(result);

    if (result.status === 'installed') {
      this.manifestUrl.set('');
      this.isInstallationFormOpen.set(false);
    }
  }

  protected requestUninstall(installation: WidgetInstallation): void {
    if (this.narrowScreen()) {
      return;
    }

    if (this.widgetInstanceCount(installation.type) === 0) {
      this.presentInstallationResult(
        this.installationsService.removeInstallation(installation.type),
      );
      return;
    }

    this.uninstallCandidate.set(installation);
  }

  protected cancelUninstall(): void {
    this.uninstallCandidate.set(null);
  }

  protected confirmUninstall(): void {
    const installation = this.uninstallCandidate();

    if (installation === null) {
      return;
    }

    const result = this.installationsService.removeInstallation(
      installation.type,
    );
    this.uninstallCandidate.set(null);
    this.presentInstallationResult(result);
  }

  protected requestReset(): void {
    this.resetConfirmationOpen.set(true);
  }

  protected cancelReset(): void {
    this.resetConfirmationOpen.set(false);
  }

  protected confirmReset(): void {
    const result = this.installationsService.resetInstallations();
    this.resetConfirmationOpen.set(false);
    this.presentInstallationResult(result);
  }

  protected widgetInstanceCount(type: string): number {
    return (
      this.dashboardStore
        .dashboard()
        ?.widgets.filter((widget) => widget.type === type).length ?? 0
    );
  }

  protected async copyManifestUrl(manifestUrl: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(manifestUrl);
      this.installationFeedback.set({
        status: 'success',
        message: 'Manifest URL copied.',
      });
    } catch {
      this.installationFeedback.set({
        status: 'error',
        message: 'The Manifest URL could not be copied.',
      });
    }
  }

  protected manifestHostname(manifestUrl: string): string {
    return new URL(manifestUrl).hostname;
  }

  protected widgetAccent(widgetType: string): string {
    const hash = [...widgetType].reduce(
      (value, character) => (value * 31 + character.charCodeAt(0)) | 0,
      0,
    );

    return this.iconPalette[Math.abs(hash) % this.iconPalette.length];
  }

  private presentInstallationResult(
    result:
      | WidgetInstallationResult
      | ReturnType<WidgetInstallationService['removeInstallation']>
      | ReturnType<WidgetInstallationService['resetInstallations']>,
  ): void {
    this.installationFeedback.set({
      status: result.status === 'rejected' ? 'error' : 'success',
      message: result.message,
    });
  }
}
