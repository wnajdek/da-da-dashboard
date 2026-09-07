import { inject, Injectable, signal } from '@angular/core';
import type { Signal } from '@angular/core';
import {
  WIDGET_INSTALLATION_PERSISTENCE,
  type WidgetInstallation,
  type WidgetInstallationRejection,
  type WidgetInstallationRemovalResult,
  type WidgetInstallationResult,
} from './widget-installation.models';
import { validateWidgetManifest } from './widget-manifest';
import { WIDGET_MANIFEST_SOURCE } from './widget-manifest-source';
import { WidgetTrustPolicy } from './widget-trust-policy';

@Injectable({ providedIn: 'root' })
export class WidgetInstallationService {
  private readonly installationPersistence = inject(
    WIDGET_INSTALLATION_PERSISTENCE,
  );
  private readonly manifestSource = inject(WIDGET_MANIFEST_SOURCE);
  private readonly trustPolicy = inject(WidgetTrustPolicy);
  private readonly installationsState = signal<readonly WidgetInstallation[]>(
    [],
  );
  private readonly recoveryMessageState = signal<string | null>(null);
  private readonly isInstallingState = signal(false);

  readonly installations: Signal<readonly WidgetInstallation[]> =
    this.installationsState.asReadonly();
  readonly recoveryMessage: Signal<string | null> =
    this.recoveryMessageState.asReadonly();
  readonly isInstalling: Signal<boolean> = this.isInstallingState.asReadonly();

  constructor() {
    const result = this.installationPersistence.load();

    if (result.status === 'ready') {
      this.installationsState.set(result.installations);
    } else if (result.status === 'recovery') {
      this.recoveryMessageState.set(result.message);
    }
  }

  async installManifest(input: string): Promise<WidgetInstallationResult> {
    if (this.isInstallingState()) {
      return this.reject(
        'Another Widget Manifest installation is already in progress.',
      );
    }

    const trustedManifestUrl = this.trustPolicy.trustedManifestUrl(input);

    if (trustedManifestUrl.status !== 'valid') {
      return this.reject(trustedManifestUrl.message);
    }

    this.isInstallingState.set(true);

    try {
      let rawManifest: unknown;

      try {
        rawManifest = await this.manifestSource.load(trustedManifestUrl.url);
      } catch {
        return this.reject('The Widget Manifest could not be read.');
      }

      const validation = validateWidgetManifest(
        rawManifest,
        trustedManifestUrl.url,
      );

      if (validation.status !== 'valid') {
        return this.reject(widgetManifestErrorMessage(validation.reason));
      }

      if (
        this.installationsState().some(
          (installation) =>
            installation.manifestUrl === trustedManifestUrl.url,
        )
      ) {
        return this.reject('This Widget Manifest is already installed.');
      }

      if (
        this.installationsState().some(
          (installation) => installation.type === validation.manifest.type,
        )
      ) {
        return this.reject('This Widget Type is already installed.');
      }

      if (
        this.installationsState().some(
          (installation) =>
            installation.elementTag === validation.manifest.elementTag,
        )
      ) {
        return this.reject(
          'This Widget Element tag is already assigned to another installed Widget Type.',
        );
      }

      const installation: WidgetInstallation = {
        manifestUrl: trustedManifestUrl.url,
        ...validation.manifest,
      };
      const installations = [...this.installationsState(), installation];

      if (!this.installationPersistence.save(installations)) {
        return this.reject(
          'The Widget Installation could not be saved locally.',
        );
      }

      this.installationsState.set(installations);
      return {
        status: 'installed',
        installation,
        message: `Installed “${installation.displayName}”.`,
      };
    } finally {
      this.isInstallingState.set(false);
    }
  }

  installationFor(type: string): WidgetInstallation | undefined {
    return this.installationsState().find(
      (installation) => installation.type === type,
    );
  }

  removeInstallation(type: string): WidgetInstallationRemovalResult {
    const installation = this.installationFor(type);

    if (installation === undefined) {
      return this.reject('This Widget Type is not installed.');
    }

    const installations = this.installationsState().filter(
      (candidate) => candidate.type !== type,
    );

    if (!this.installationPersistence.save(installations)) {
      return this.reject(
        'The Widget Installation could not be removed locally.',
      );
    }

    this.installationsState.set(installations);
    return {
      status: 'removed',
      installation,
      message: `Removed “${installation.displayName}”. Existing Widget Instances are now unavailable.`,
    };
  }

  private reject(message: string): WidgetInstallationRejection {
    return { status: 'rejected', message };
  }
}

function widgetManifestErrorMessage(
  reason: 'invalid' | 'unsupported-version' | 'untrusted-entry-bundle',
): string {
  switch (reason) {
    case 'unsupported-version':
      return 'The Widget Manifest uses an unsupported version.';
    case 'untrusted-entry-bundle':
      return 'The Widget Manifest points to an untrusted entry bundle.';
    case 'invalid':
      return 'The Widget Manifest is invalid.';
  }
}
