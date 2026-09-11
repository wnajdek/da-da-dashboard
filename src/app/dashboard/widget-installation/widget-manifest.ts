import type {
  GridLayout,
  WidgetConfiguration,
  WidgetType,
} from '../workspace/dashboard.models';
import {
  decodeGridLayoutSize,
  decodeWidgetType,
} from '../workspace/dashboard-decoder';
import { decodeJsonObject, isRecord } from '../workspace/json-value';

export const SUPPORTED_WIDGET_MANIFEST_VERSION = 2 as const;

export interface WidgetManifest {
  readonly manifestVersion: typeof SUPPORTED_WIDGET_MANIFEST_VERSION;
  readonly type: WidgetType;
  readonly displayName: string;
  readonly description?: string;
  readonly version: string;
  readonly elementTag: string;
  readonly settingsElementTag: string;
  readonly entryBundleUrl: string;
  readonly defaultConfiguration: WidgetConfiguration;
  readonly preferredLayout: Pick<GridLayout, 'w' | 'h'>;
}

export type WidgetManifestValidationResult =
  | { readonly status: 'valid'; readonly manifest: WidgetManifest }
  | {
      readonly status: 'invalid';
      readonly reason:
        'invalid' | 'unsupported-version' | 'untrusted-entry-bundle';
    };

export function validateWidgetManifest(
  value: unknown,
  manifestUrl: string | URL,
): WidgetManifestValidationResult {
  const baseUrl = toHttpUrl(manifestUrl);

  if (baseUrl === null || !isRecord(value)) {
    return { status: 'invalid', reason: 'invalid' };
  }

  if (value['manifestVersion'] !== SUPPORTED_WIDGET_MANIFEST_VERSION) {
    return {
      status: 'invalid',
      reason:
        typeof value['manifestVersion'] === 'number'
          ? 'unsupported-version'
          : 'invalid',
    };
  }

  const type = value['type'];
  const displayName = value['displayName'];
  const description = value['description'];
  const version = value['version'];
  const elementTag = value['elementTag'];
  const settingsElementTag = value['settingsElementTag'];
  const entryBundleUrl = value['entryBundleUrl'];
  const defaultConfiguration = value['defaultConfiguration'];
  const preferredLayout = value['preferredLayout'];

  const decodedType = decodeWidgetType(type);
  const decodedConfiguration = decodeJsonObject(defaultConfiguration);
  const decodedPreferredLayout = decodeGridLayoutSize(preferredLayout);

  if (
    decodedType === null ||
    !isNonEmptyString(displayName) ||
    (description !== undefined && typeof description !== 'string') ||
    !isNonEmptyString(version) ||
    !isCustomElementTag(elementTag) ||
    !isCustomElementTag(settingsElementTag) ||
    settingsElementTag === elementTag ||
    !isNonEmptyString(entryBundleUrl) ||
    decodedConfiguration === null ||
    decodedPreferredLayout === null
  ) {
    return { status: 'invalid', reason: 'invalid' };
  }

  const resolvedEntryBundleUrl = resolveTrustedEntryBundleUrl(
    entryBundleUrl,
    baseUrl,
  );

  if (resolvedEntryBundleUrl === null) {
    return { status: 'invalid', reason: 'untrusted-entry-bundle' };
  }

  return {
    status: 'valid',
    manifest: {
      manifestVersion: SUPPORTED_WIDGET_MANIFEST_VERSION,
      type: decodedType,
      displayName: displayName.trim(),
      ...(description === undefined ? {} : { description: description.trim() }),
      version: version.trim(),
      elementTag,
      settingsElementTag,
      entryBundleUrl: resolvedEntryBundleUrl,
      defaultConfiguration: decodedConfiguration,
      preferredLayout: decodedPreferredLayout,
    },
  };
}

export function normalizeHttpUrl(value: string | URL): string | null {
  const url = toHttpUrl(value);

  if (url === null) {
    return null;
  }

  url.hash = '';
  return url.href;
}

function toHttpUrl(value: string | URL): URL | null {
  try {
    const url = new URL(value);

    if (
      (url.protocol !== 'http:' && url.protocol !== 'https:') ||
      url.username.length > 0 ||
      url.password.length > 0
    ) {
      return null;
    }

    return url;
  } catch {
    return null;
  }
}

function resolveTrustedEntryBundleUrl(
  value: string,
  manifestUrl: URL,
): string | null {
  try {
    const url = new URL(value, manifestUrl);

    if (
      (url.protocol !== 'http:' && url.protocol !== 'https:') ||
      url.origin !== manifestUrl.origin ||
      url.username.length > 0 ||
      url.password.length > 0
    ) {
      return null;
    }

    url.hash = '';
    return url.href;
  } catch {
    return null;
  }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isCustomElementTag(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length <= 128 &&
    /^[a-z][a-z0-9._-]*-[a-z0-9._-]+$/.test(value)
  );
}
