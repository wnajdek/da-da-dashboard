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

export interface WidgetInstallationFeedback {
  readonly status: 'success' | 'error';
  readonly message: string;
}

export type WidgetInstallationResult =
  | { readonly status: 'installed'; readonly installation: WidgetInstallation }
  | { readonly status: 'rejected'; readonly message: string };

@Injectable({ providedIn: 'root' })
export class WidgetRuntimeService {
  readonly #installations = signal<readonly WidgetInstallation[]>([]);
  readonly #feedback = signal<WidgetInstallationFeedback | null>(null);
  readonly #isInstalling = signal(false);
  readonly #manifestSource = inject(WIDGET_MANIFEST_SOURCE);
  readonly #trustedOrigins = new Set(
    inject(TRUSTED_MANIFEST_ORIGINS)
      .map(normalizeHttpUrl)
      .filter((origin): origin is string => origin !== null)
      .map((origin) => new URL(origin).origin),
  );

  readonly installations: Signal<readonly WidgetInstallation[]> =
    this.#installations.asReadonly();
  readonly feedback: Signal<WidgetInstallationFeedback | null> =
    this.#feedback.asReadonly();
  readonly isInstalling: Signal<boolean> = this.#isInstalling.asReadonly();

  constructor(
    private readonly installationPersistence: WidgetInstallationPersistenceService,
  ) {
    const result = this.installationPersistence.load();

    if (result.status === 'ready') {
      this.#installations.set(result.installations);
      return;
    }

    if (result.status === 'recovery') {
      this.#feedback.set({ status: 'error', message: result.message });
    }
  }

  async installManifest(input: string): Promise<WidgetInstallationResult> {
    if (this.#isInstalling()) {
      return this.#reject(
        'Another Widget Manifest installation is already in progress.',
      );
    }

    const trustedManifestUrl = this.#trustedManifestUrl(input);

    if (trustedManifestUrl.status !== 'valid') {
      return this.#reject(trustedManifestUrl.message);
    }

    const manifestUrl = trustedManifestUrl.url;

    this.#isInstalling.set(true);

    try {
      let rawManifest: unknown;

      try {
        rawManifest = await this.#manifestSource.load(manifestUrl);
      } catch {
        return this.#reject('The Widget Manifest could not be read.');
      }

      let validation: ReturnType<typeof validateWidgetManifest>;

      try {
        validation = validateWidgetManifest(rawManifest, manifestUrl);
      } catch {
        return this.#reject('The Widget Manifest is invalid.');
      }

      if (validation.status !== 'valid') {
        return this.#reject(widgetManifestErrorMessage(validation.reason));
      }

      if (
        this.#installations().some(
          (installation) => installation.manifestUrl === manifestUrl,
        )
      ) {
        return this.#reject('This Widget Manifest is already installed.');
      }

      if (
        this.#installations().some(
          (installation) => installation.type === validation.manifest.type,
        )
      ) {
        return this.#reject('This Widget Type is already installed.');
      }

      if (
        this.#installations().some(
          (installation) =>
            installation.elementTag === validation.manifest.elementTag,
        )
      ) {
        return this.#reject(
          'This Widget Element tag is already assigned to another installed Widget Type.',
        );
      }

      const installation: WidgetInstallation = {
        manifestUrl,
        ...validation.manifest,
      };
      const installations = [...this.#installations(), installation];

      if (!this.installationPersistence.save(installations)) {
        return this.#reject(
          'The Widget Installation could not be saved locally.',
        );
      }

      this.#installations.set(installations);
      const message = `Installed “${installation.displayName}”.`;
      this.#feedback.set({ status: 'success', message });

      return { status: 'installed', installation };
    } finally {
      this.#isInstalling.set(false);
    }
  }

  #trustedManifestUrl(input: string): TrustedManifestUrlResult {
    const manifestUrl = normalizeHttpUrl(input.trim());

    if (manifestUrl === null) {
      return {
        status: 'invalid',
        message: 'Enter a valid Widget Manifest URL.',
      };
    }

    if (!this.#trustedOrigins.has(new URL(manifestUrl).origin)) {
      return {
        status: 'untrusted',
        message: 'This Widget Manifest origin is not trusted.',
      };
    }

    return { status: 'valid', url: manifestUrl };
  }

  #reject(message: string): WidgetInstallationResult {
    this.#feedback.set({ status: 'error', message });
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
