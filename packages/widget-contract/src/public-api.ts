export const SUPPORTED_WIDGET_MANIFEST_VERSION = 2 as const;

export const WIDGET_CONFIGURATION_CHANGED_EVENT =
  'configuration-changed' as const;

export type JsonValue =
  | null
  | boolean
  | number
  | string
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue };

export type JsonObject = { readonly [key: string]: JsonValue };

export type WidgetConfiguration = JsonObject;

export interface WidgetElementConfiguration {
  configuration: WidgetConfiguration;
}

export type WidgetConfigurationChangedEventDetail = WidgetConfiguration;

export interface WidgetPreferredLayout {
  readonly w: number;
  readonly h: number;
}

export interface WidgetManifest {
  readonly manifestVersion: typeof SUPPORTED_WIDGET_MANIFEST_VERSION;
  readonly type: string;
  readonly displayName: string;
  readonly description?: string;
  readonly version: string;
  readonly elementTag: string;
  readonly settingsElementTag: string;
  readonly entryBundleUrl: string;
  readonly defaultConfiguration: WidgetConfiguration;
  readonly preferredLayout: WidgetPreferredLayout;
}

export type WidgetManifestValidationResult =
  | { readonly status: 'valid'; readonly manifest: WidgetManifest }
  | {
      readonly status: 'invalid';
      readonly reason:
        'invalid' | 'unsupported-version' | 'untrusted-entry-bundle';
    };

export const MAX_JSON_CONFIGURATION_DEPTH = 64;
export const MAX_JSON_CONFIGURATION_VALUES = 10_000;

const INVALID_JSON_VALUE = Symbol('invalid-json-value');

interface DecoderContext {
  readonly activeObjects: WeakSet<object>;
  valueCount: number;
}

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
  const defaultConfiguration = decodeJsonObject(value['defaultConfiguration']);
  const preferredLayout = decodeWidgetPreferredLayout(value['preferredLayout']);

  if (
    !isWidgetType(type) ||
    !isNonEmptyString(displayName) ||
    (description !== undefined && typeof description !== 'string') ||
    !isNonEmptyString(version) ||
    !isCustomElementTag(elementTag) ||
    !isCustomElementTag(settingsElementTag) ||
    settingsElementTag === elementTag ||
    !isNonEmptyString(entryBundleUrl) ||
    defaultConfiguration === null ||
    preferredLayout === null
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
      settingsElementTag,
      entryBundleUrl: resolvedEntryBundleUrl,
      defaultConfiguration,
      preferredLayout,
    },
  };
}

export function decodeJsonObject(value: unknown): JsonObject | null {
  try {
    const decoded = decodeJsonValue(value, 0, {
      activeObjects: new WeakSet<object>(),
      valueCount: 0,
    });

    return isJsonObjectValue(decoded) && isStructuredCloneable(value)
      ? decoded
      : null;
  } catch {
    return null;
  }
}

export function isJsonValue(value: unknown): value is JsonValue {
  try {
    return (
      decodeJsonValue(value, 0, {
        activeObjects: new WeakSet<object>(),
        valueCount: 0,
      }) !== INVALID_JSON_VALUE
    );
  } catch {
    return false;
  }
}

export function isJsonObject(value: unknown): value is JsonObject {
  return decodeJsonObject(value) !== null;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  try {
    const prototype = Object.getPrototypeOf(value);

    return prototype === Object.prototype || prototype === null;
  } catch {
    return false;
  }
}

export function normalizeHttpUrl(value: string | URL): string | null {
  const url = toHttpUrl(value);

  if (url === null) {
    return null;
  }

  url.hash = '';
  return url.href;
}

function decodeJsonValue(
  value: unknown,
  depth: number,
  context: DecoderContext,
): JsonValue | typeof INVALID_JSON_VALUE {
  if (context.valueCount >= MAX_JSON_CONFIGURATION_VALUES) {
    return INVALID_JSON_VALUE;
  }

  context.valueCount += 1;

  if (
    value === null ||
    typeof value === 'boolean' ||
    typeof value === 'string'
  ) {
    return value;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : INVALID_JSON_VALUE;
  }

  if (depth >= MAX_JSON_CONFIGURATION_DEPTH || typeof value !== 'object') {
    return INVALID_JSON_VALUE;
  }

  if (context.activeObjects.has(value)) {
    return INVALID_JSON_VALUE;
  }

  context.activeObjects.add(value);

  try {
    return Array.isArray(value)
      ? decodeJsonArray(value, depth, context)
      : decodeJsonRecord(value, depth, context);
  } finally {
    context.activeObjects.delete(value);
  }
}

function decodeJsonArray(
  value: readonly unknown[],
  depth: number,
  context: DecoderContext,
): JsonValue | typeof INVALID_JSON_VALUE {
  const lengthDescriptor = Object.getOwnPropertyDescriptor(value, 'length');

  if (
    lengthDescriptor === undefined ||
    !isDataProperty(lengthDescriptor) ||
    typeof lengthDescriptor.value !== 'number' ||
    !Number.isSafeInteger(lengthDescriptor.value) ||
    lengthDescriptor.value < 0 ||
    lengthDescriptor.value > MAX_JSON_CONFIGURATION_VALUES - context.valueCount
  ) {
    return INVALID_JSON_VALUE;
  }

  const length = lengthDescriptor.value;
  const keys = Reflect.ownKeys(value);

  if (keys.length !== length + 1) {
    return INVALID_JSON_VALUE;
  }

  const decoded: JsonValue[] = [];

  for (let index = 0; index < length; index += 1) {
    const key = String(index);
    const descriptor = Object.getOwnPropertyDescriptor(value, key);

    if (
      descriptor === undefined ||
      !descriptor.enumerable ||
      !isDataProperty(descriptor)
    ) {
      return INVALID_JSON_VALUE;
    }

    const item = decodeJsonValue(descriptor.value, depth + 1, context);

    if (item === INVALID_JSON_VALUE) {
      return INVALID_JSON_VALUE;
    }

    decoded.push(item);
  }

  return decoded;
}

function decodeJsonRecord(
  value: object,
  depth: number,
  context: DecoderContext,
): JsonValue | typeof INVALID_JSON_VALUE {
  if (!isRecord(value)) {
    return INVALID_JSON_VALUE;
  }

  const keys = Reflect.ownKeys(value);

  if (keys.length > MAX_JSON_CONFIGURATION_VALUES - context.valueCount) {
    return INVALID_JSON_VALUE;
  }

  const decoded: { [key: string]: JsonValue } = {};

  for (const key of keys) {
    if (typeof key !== 'string') {
      return INVALID_JSON_VALUE;
    }

    const descriptor = Object.getOwnPropertyDescriptor(value, key);

    if (
      descriptor === undefined ||
      !descriptor.enumerable ||
      !isDataProperty(descriptor)
    ) {
      return INVALID_JSON_VALUE;
    }

    const propertyValue = decodeJsonValue(descriptor.value, depth + 1, context);

    if (propertyValue === INVALID_JSON_VALUE) {
      return INVALID_JSON_VALUE;
    }

    Object.defineProperty(decoded, key, {
      configurable: true,
      enumerable: true,
      value: propertyValue,
      writable: true,
    });
  }

  return decoded;
}

function decodeWidgetPreferredLayout(
  value: unknown,
): WidgetPreferredLayout | null {
  if (
    !isRecord(value) ||
    !isPositiveInteger(value['w']) ||
    !isPositiveInteger(value['h'])
  ) {
    return null;
  }

  return { w: value['w'], h: value['h'] };
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

function isCustomElementTag(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length <= 128 &&
    /^[a-z][a-z0-9._-]*-[a-z0-9._-]+$/.test(value)
  );
}

function isDataProperty(
  descriptor: PropertyDescriptor,
): descriptor is PropertyDescriptor & { readonly value: unknown } {
  return 'value' in descriptor;
}

function isJsonObjectValue(
  value: JsonValue | typeof INVALID_JSON_VALUE,
): value is JsonObject {
  return (
    value !== INVALID_JSON_VALUE &&
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  );
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

function isStructuredCloneable(value: unknown): boolean {
  try {
    structuredClone(value);
    return true;
  } catch {
    return false;
  }
}

function isWidgetType(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= 128 &&
    /^[a-z0-9][a-z0-9._-]*$/.test(value)
  );
}
