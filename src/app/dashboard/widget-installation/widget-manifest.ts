import type {
  GridLayout,
  WidgetConfiguration,
  WidgetType,
} from '../workspace/dashboard.models';
import { isJsonObject, isRecord } from '../workspace/json-value';

export const SUPPORTED_WIDGET_MANIFEST_VERSION = 1 as const;

export interface WidgetManifest {
  readonly manifestVersion: typeof SUPPORTED_WIDGET_MANIFEST_VERSION;
  readonly type: WidgetType;
  readonly displayName: string;
  readonly description?: string;
  readonly version: string;
  readonly elementTag: string;
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
  const entryBundleUrl = value['entryBundleUrl'];
  const defaultConfiguration = value['defaultConfiguration'];
  const preferredLayout = value['preferredLayout'];

  if (
    !isStableWidgetType(type) ||
    !isNonEmptyString(displayName) ||
    (description !== undefined && typeof description !== 'string') ||
    !isNonEmptyString(version) ||
    !isCustomElementTag(elementTag) ||
    !isNonEmptyString(entryBundleUrl) ||
    !isJsonObject(defaultConfiguration) ||
    !isPreferredLayout(preferredLayout)
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
      type,
      displayName: displayName.trim(),
      ...(description === undefined ? {} : { description: description.trim() }),
      version: version.trim(),
      elementTag,
      entryBundleUrl: resolvedEntryBundleUrl,
      defaultConfiguration,
      preferredLayout: {
        w: preferredLayout.w,
        h: preferredLayout.h,
      },
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

function isStableWidgetType(value: unknown): value is WidgetType {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= 128 &&
    /^[a-z0-9][a-z0-9._-]*$/.test(value)
  );
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

function isPreferredLayout(
  value: unknown,
): value is Pick<GridLayout, 'w' | 'h'> {
  return (
    isRecord(value) &&
    isPositiveInteger(value['w']) &&
    value['w'] <= 12 &&
    isPositiveInteger(value['h'])
  );
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}
