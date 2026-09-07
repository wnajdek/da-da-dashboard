import { Component, inject, signal } from '@angular/core';
import { DashboardStore } from './dashboard.store';
import { DashboardGridComponent } from '../grid-layout/dashboard-grid.component';
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
  selector: 'app-dashboard-shell',
  imports: [DashboardGridComponent],
  templateUrl: './dashboard-shell.component.html',
  styleUrl: './dashboard-shell.component.scss',
})
export class DashboardShellComponent {
  protected readonly store = inject(DashboardStore);
  protected readonly installations = inject(WidgetInstallationService);
  protected readonly manifestUrl = signal('');
  protected readonly installationFeedback = signal<InstallationFeedback | null>(
    null,
  );

  constructor() {
    const recoveryMessage = this.installations.recoveryMessage();

    if (recoveryMessage !== null) {
      this.installationFeedback.set({
        status: 'error',
        message: recoveryMessage,
      });
    }
  }

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
    const result = this.installations.removeInstallation(installation.type);

    this.presentInstallationResult(result);
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
