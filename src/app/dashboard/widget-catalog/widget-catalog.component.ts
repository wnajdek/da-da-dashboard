import { Component, inject, signal } from '@angular/core';
import { DashboardStore } from '../workspace/dashboard.store';
import type {
  WidgetInstallation,
  WidgetInstallationRemovalResult,
  WidgetInstallationResult,
} from '../widget-installation/widget-installation.models';
import { WidgetInstallationService } from '../widget-installation/widget-installation.service';

interface InstallationFeedback {
  readonly status: 'success' | 'error';
  readonly message: string;
}

@Component({
  selector: 'app-widget-catalog',
  templateUrl: './widget-catalog.component.html',
  styleUrl: './widget-catalog.component.scss',
})
export class WidgetCatalogComponent {
  private readonly store = inject(DashboardStore);
  protected readonly installations = inject(WidgetInstallationService);
  protected readonly recoveryMessage = this.installations.recoveryMessage;
  protected readonly manifestUrl = signal('');
  protected readonly installationFeedback = signal<InstallationFeedback | null>(
    null,
  );

  protected updateManifestUrl(event: Event): void {
    const input = event.target;

    if (input instanceof HTMLInputElement) {
      this.manifestUrl.set(input.value);
    }
  }

  protected async installManifest(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    const result = await this.installations.installManifest(this.manifestUrl());

    this.presentInstallationResult(result);

    if (result.status === 'installed') {
      this.manifestUrl.set('');
    }
  }

  protected addWidget(installation: WidgetInstallation): void {
    this.store.addWidget({
      type: installation.type,
      configuration: installation.defaultConfiguration,
      preferredLayout: installation.preferredLayout,
    });
  }

  protected removeInstallation(installation: WidgetInstallation): void {
    this.presentInstallationResult(
      this.installations.removeInstallation(installation.type),
    );
  }

  private presentInstallationResult(
    result: WidgetInstallationResult | WidgetInstallationRemovalResult,
  ): void {
    this.installationFeedback.set({
      status: result.status === 'rejected' ? 'error' : 'success',
      message: result.message,
    });
  }
}
