import { inject, Injectable, InjectionToken } from '@angular/core';
import type { Provider } from '@angular/core';
import { normalizeHttpUrl } from './widget-manifest';
import type { WidgetInstallation } from './widget-installation.models';

export const TRUSTED_MANIFEST_ORIGINS = new InjectionToken<readonly string[]>(
  'Trusted Widget Manifest Origins',
  {
    providedIn: 'root',
    factory: () => [],
  },
);

@Injectable({ providedIn: 'root' })
export class WidgetTrustPolicy {
  private readonly trustedOrigins = new Set(
    inject(TRUSTED_MANIFEST_ORIGINS)
      .map(normalizeHttpUrl)
      .filter((origin): origin is string => origin !== null)
      .map((origin) => new URL(origin).origin),
  );

  trustedManifestUrl(input: string): TrustedManifestUrlResult {
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

  isTrustedInstallation(installation: WidgetInstallation): boolean {
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
}

export function provideTrustedManifestOrigins(
  origins: readonly string[],
): Provider {
  return { provide: TRUSTED_MANIFEST_ORIGINS, useValue: origins };
}

export type TrustedManifestUrlResult =
  | { readonly status: 'valid'; readonly url: string }
  | { readonly status: 'invalid' | 'untrusted'; readonly message: string };
