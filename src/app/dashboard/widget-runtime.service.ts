import { inject, Injectable, InjectionToken, signal } from '@angular/core';
import type { Provider, Signal } from '@angular/core';
import {
  WidgetInstallationPersistenceService,
  type WidgetInstallation,
} from './widget-installation-persistence.service';
import { normalizeHttpUrl, validateWidgetManifest } from './widget-manifest';

export interface WidgetManifestSource {
  load(url: string): Promise<unknown>;
}

export interface WidgetEntryBundleLoader {
  load(url: string): Promise<void>;
}

export const WIDGET_MANIFEST_SOURCE = new InjectionToken<WidgetManifestSource>(
  'Widget manifest source',
  {
    providedIn: 'root',
    factory: () => browserWidgetManifestSource,
  },
);

export const TRUSTED_MANIFEST_ORIGINS = new InjectionToken<readonly string[]>(
  'Trusted Widget Manifest Origins',
  {
    providedIn: 'root',
    factory: () => [],
  },
);

export const WIDGET_ENTRY_BUNDLE_LOADER =
  new InjectionToken<WidgetEntryBundleLoader>('Widget entry bundle loader', {
    providedIn: 'root',
    factory: () => browserWidgetEntryBundleLoader,
  });

export interface WidgetInstallationFeedback {
  readonly status: 'success' | 'error';
  readonly message: string;
}

export type WidgetInstallationRejection = {
  readonly status: 'rejected';
  readonly message: string;
};

export type WidgetInstallationResult =
  | { readonly status: 'installed'; readonly installation: WidgetInstallation }
  | WidgetInstallationRejection;

export type WidgetInstallationRemovalResult =
  | { readonly status: 'removed'; readonly installation: WidgetInstallation }
  | WidgetInstallationRejection;

@Injectable({ providedIn: 'root' })
export class WidgetRuntimeService {
  private readonly installationPersistence = inject(
    WidgetInstallationPersistenceService,
  );
  private readonly installationsState = signal<readonly WidgetInstallation[]>(
    [],
  );
  private readonly feedbackState = signal<WidgetInstallationFeedback | null>(
    null,
  );
  private readonly isInstallingState = signal(false);
  private readonly manifestSource = inject(WIDGET_MANIFEST_SOURCE);
  private readonly entryBundleLoader = inject(WIDGET_ENTRY_BUNDLE_LOADER);
  private readonly trustedOrigins = new Set(
    inject(TRUSTED_MANIFEST_ORIGINS)
      .map(normalizeHttpUrl)
      .filter((origin): origin is string => origin !== null)
      .map((origin) => new URL(origin).origin),
  );

  readonly installations: Signal<readonly WidgetInstallation[]> =
    this.installationsState.asReadonly();
  readonly feedback: Signal<WidgetInstallationFeedback | null> =
    this.feedbackState.asReadonly();
  readonly isInstalling: Signal<boolean> = this.isInstallingState.asReadonly();
  private readonly entryBundlePromises = new Map<string, Promise<void>>();
  private readonly elementSources = new Map<string, string>();

  constructor() {
    const result = this.installationPersistence.load();

    if (result.status === 'ready') {
      this.installationsState.set(result.installations);
      return;
    }

    if (result.status === 'recovery') {
      this.feedbackState.set({ status: 'error', message: result.message });
    }
  }

  async installManifest(input: string): Promise<WidgetInstallationResult> {
    if (this.isInstallingState()) {
      return this.reject(
        'Another Widget Manifest installation is already in progress.',
      );
    }

    const trustedManifestUrl = this.trustedManifestUrl(input);

    if (trustedManifestUrl.status !== 'valid') {
      return this.reject(trustedManifestUrl.message);
    }

    const manifestUrl = trustedManifestUrl.url;

    this.isInstallingState.set(true);

    try {
      let rawManifest: unknown;

      try {
        rawManifest = await this.manifestSource.load(manifestUrl);
      } catch {
        return this.reject('The Widget Manifest could not be read.');
      }

      let validation: ReturnType<typeof validateWidgetManifest>;

      try {
        validation = validateWidgetManifest(rawManifest, manifestUrl);
      } catch {
        return this.reject('The Widget Manifest is invalid.');
      }

      if (validation.status !== 'valid') {
        return this.reject(widgetManifestErrorMessage(validation.reason));
      }

      if (
        this.installationsState().some(
          (installation) => installation.manifestUrl === manifestUrl,
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
        manifestUrl,
        ...validation.manifest,
      };
      const installations = [...this.installationsState(), installation];

      if (!this.installationPersistence.save(installations)) {
        return this.reject(
          'The Widget Installation could not be saved locally.',
        );
      }

      this.installationsState.set(installations);
      const message = `Installed “${installation.displayName}”.`;
      this.feedbackState.set({ status: 'success', message });

      return { status: 'installed', installation };
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
    this.feedbackState.set({
      status: 'success',
      message: `Removed “${installation.displayName}”. Existing Widget Instances are now unavailable.`,
    });

    return { status: 'removed', installation };
  }

  async loadElement(installation: WidgetInstallation): Promise<void> {
    if (!this.isTrustedInstallation(installation)) {
      throw new Error('The Widget Installation is no longer trusted.');
    }

    const existingSource = this.elementSources.get(installation.elementTag);

    if (existingSource !== undefined) {
      if (existingSource === installation.entryBundleUrl) {
        return;
      }

      throw new Error(
        `The Widget Element tag ${installation.elementTag} is already loaded from another bundle.`,
      );
    }

    if (customElements.get(installation.elementTag) !== undefined) {
      throw new Error(
        `The Widget Element tag ${installation.elementTag} is already registered.`,
      );
    }

    let load = this.entryBundlePromises.get(installation.entryBundleUrl);

    if (load === undefined) {
      load = this.entryBundleLoader.load(installation.entryBundleUrl);
      this.entryBundlePromises.set(installation.entryBundleUrl, load);
    }

    try {
      await load;
    } catch (error) {
      this.entryBundlePromises.delete(installation.entryBundleUrl);
      throw error;
    }

    if (customElements.get(installation.elementTag) === undefined) {
      throw new Error(
        `The Widget bundle did not register ${installation.elementTag}.`,
      );
    }

    this.elementSources.set(
      installation.elementTag,
      installation.entryBundleUrl,
    );
  }

  private isTrustedInstallation(installation: WidgetInstallation): boolean {
    const manifestUrl = normalizeHttpUrl(installation.manifestUrl);
    const entryBundleUrl = normalizeHttpUrl(installation.entryBundleUrl);

    if (manifestUrl === null || entryBundleUrl === null) {
      return false;
    }

    const manifestOrigin = new URL(manifestUrl).origin;

    return (
      this.trustedOrigins.has(manifestOrigin) &&
      new URL(entryBundleUrl).origin === manifestOrigin
    );
  }

  private trustedManifestUrl(input: string): TrustedManifestUrlResult {
    const manifestUrl = normalizeHttpUrl(input.trim());

    if (manifestUrl === null) {
      return {
        status: 'invalid',
        message: 'Enter a valid Widget Manifest URL.',
      };
    }

    if (!this.trustedOrigins.has(new URL(manifestUrl).origin)) {
      return {
        status: 'untrusted',
        message: 'This Widget Manifest origin is not trusted.',
      };
    }

    return { status: 'valid', url: manifestUrl };
  }

  private reject(message: string): WidgetInstallationRejection {
    this.feedbackState.set({ status: 'error', message });
    return { status: 'rejected', message };
  }
}

export function provideTrustedManifestOrigins(
  origins: readonly string[],
): Provider {
  return { provide: TRUSTED_MANIFEST_ORIGINS, useValue: origins };
}

const browserWidgetManifestSource: WidgetManifestSource = {
  async load(url: string): Promise<unknown> {
    const response = await fetch(url, { redirect: 'error' });

    if (!response.ok) {
      throw new Error(
        `Manifest request failed with status ${response.status}.`,
      );
    }

    return (await response.json()) as unknown;
  },
};

const browserWidgetEntryBundleLoader: WidgetEntryBundleLoader = {
  load(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = url;
      script.onload = () => resolve();
      script.onerror = () =>
        reject(new Error('Widget entry bundle failed to load.'));
      document.head.append(script);
    });
  },
};

type TrustedManifestUrlResult =
  | { readonly status: 'valid'; readonly url: string }
  | { readonly status: 'invalid' | 'untrusted'; readonly message: string };

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
