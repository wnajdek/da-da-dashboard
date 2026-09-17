/** The Widget Manifest version accepted by this release of the contract. */
export const SUPPORTED_WIDGET_MANIFEST_VERSION = 2 as const;

/** The bubbling Custom Event emitted when a Widget replaces its configuration. */
export const WIDGET_CONFIGURATION_CHANGED_EVENT =
  'configuration-changed' as const;

/**
 * A JSON-safe value accepted by the Widget contract.
 *
 * Runtime validators additionally reject non-finite numbers, cyclic values,
 * sparse arrays, values with accessors, and values beyond the current decoder
 * safeguards.
 */
export type JsonValue =
  | null
  | boolean
  | number
  | string
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue };

/** A JSON-safe object with string keys. */
export type JsonObject = { readonly [key: string]: JsonValue };

/** Settings owned by one Widget Type and persisted by the Dashboard. */
export type WidgetConfiguration = JsonObject;

/** The `configuration` property exposed by a Widget Element. */
export interface WidgetElementConfiguration {
  configuration: WidgetConfiguration;
}

/** The complete replacement configuration carried by `configuration-changed`. */
export type WidgetConfigurationChangedEventDetail = WidgetConfiguration;

/** The preferred initial width and height of a Widget Instance on the Grid Layout. */
export interface WidgetPreferredLayout {
  /** A positive integer grid-column width. */
  readonly w: number;

  /** A positive integer grid-row height. */
  readonly h: number;
}

/**
 * The declarative definition of one Widget Type published by a Widget Author.
 *
 * The manifest identifies a Widget's Custom Elements and entry bundle; it does
 * not contain Dashboard instance identity, placement, order, or persisted
 * configuration.
 *
 * @example
 * ```ts
 * import {
 *   SUPPORTED_WIDGET_MANIFEST_VERSION,
 *   type WidgetManifest,
 * } from '@da-da/widget-contract';
 *
 * export const weatherManifest: WidgetManifest = {
 *   manifestVersion: SUPPORTED_WIDGET_MANIFEST_VERSION,
 *   type: 'weather',
 *   displayName: 'Weather',
 *   version: '1.0.0',
 *   elementTag: 'example-weather-widget',
 *   settingsElementTag: 'example-weather-widget-settings',
 *   entryBundleUrl: './main.js',
 *   defaultConfiguration: { location: 'Warsaw', units: 'metric' },
 *   preferredLayout: { w: 4, h: 3 },
 * };
 * ```
 */
export interface WidgetManifest {
  /** The contract version, currently {@link SUPPORTED_WIDGET_MANIFEST_VERSION}. */
  readonly manifestVersion: typeof SUPPORTED_WIDGET_MANIFEST_VERSION;

  /**
   * A Widget Type identifier up to 128 characters: it starts with a lowercase
   * letter or digit and uses only lowercase letters, digits, `.`, `_`, or `-`.
   */
  readonly type: string;

  /** A display name that is non-empty after trimming, shown by the Dashboard. */
  readonly displayName: string;

  /** Optional author-provided display description. */
  readonly description?: string;

  /** A version string supplied by the Widget Author, non-empty after trimming. */
  readonly version: string;

  /**
   * A Widget Element tag up to 128 characters: it starts with a lowercase
   * letter, contains a hyphen, and otherwise uses lowercase letters, digits,
   * `.`, `_`, or `-`.
   */
  readonly elementTag: string;

  /**
   * A distinct Widget Settings Element tag with the same Custom Element tag
   * rules as {@link WidgetManifest.elementTag}.
   */
  readonly settingsElementTag: string;

  /** An HTTP(S) entry-bundle URL or a URL relative to the manifest. */
  readonly entryBundleUrl: string;

  /** The complete JSON-safe configuration used for a newly added Widget. */
  readonly defaultConfiguration: WidgetConfiguration;

  /** Positive grid dimensions preferred when the Widget is first added. */
  readonly preferredLayout: WidgetPreferredLayout;
}

/** The outcome of validating an unknown value as a Widget Manifest. */
export type WidgetManifestValidationResult =
  /** A normalized, safe manifest ready for use. */
  | { readonly status: 'valid'; readonly manifest: WidgetManifest }
  /** A manifest that cannot safely be used by this contract release. */
  | {
      readonly status: 'invalid';
      /** Why validation failed. */
      readonly reason:
        /** Malformed data or an invalid manifest URL. */
        'invalid' | 'unsupported-version' | 'untrusted-entry-bundle';
    };

/**
 * The current maximum nesting depth accepted by the JSON decoders.
 *
 * This is a defensive safeguard, not a compatibility promise.
 */
export const MAX_JSON_CONFIGURATION_DEPTH = 64;

/**
 * The current maximum number of JSON values accepted by the JSON decoders.
 *
 * This is a defensive safeguard, not a compatibility promise.
 */
export const MAX_JSON_CONFIGURATION_VALUES = 10_000;

const INVALID_JSON_VALUE = Symbol('invalid-json-value');

interface DecoderContext {
  readonly activeObjects: WeakSet<object>;
  valueCount: number;
}

/**
 * Validates and normalizes an unknown Widget Manifest relative to its URL.
 *
 * The manifest URL and resolved entry bundle must be credential-free HTTP(S)
 * URLs. The bundle must be on the manifest's origin; accepted URL fragments are
 * removed. The result trims display text, resolves the entry URL, and decodes
 * a detached JSON-safe default configuration.
 *
 * A numeric version other than {@link SUPPORTED_WIDGET_MANIFEST_VERSION}
 * produces `unsupported-version`. Malformed values or an invalid manifest URL
 * produce `invalid`; an otherwise valid bundle URL on another origin produces
 * `untrusted-entry-bundle`.
 *
 * @example
 * ```ts
 * const result = validateWidgetManifest(
 *   await (await fetch(manifestUrl)).json(),
 *   manifestUrl,
 * );
 *
 * if (result.status === 'valid') {
 *   loadWidget(result.manifest);
 * } else if (result.reason === 'unsupported-version') {
 *   showUpgradeMessage();
 * } else {
 *   rejectManifest(result.reason);
 * }
 * ```
 */
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

/**
 * Decodes an unknown value into a detached, JSON-safe plain object.
 *
 * Returns `null` unless `value` is an ordinary object with string-keyed,
 * enumerable data properties containing finite JSON values. It rejects Dates,
 * functions, cyclic values, sparse arrays, accessors, and values beyond the
 * current {@link MAX_JSON_CONFIGURATION_DEPTH} and
 * {@link MAX_JSON_CONFIGURATION_VALUES} safeguards.
 */
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

/**
 * Returns whether a value is JSON-safe for the Widget contract.
 *
 * See {@link decodeJsonObject} for the rejected value kinds and current decoder
 * safeguards.
 */
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

/**
 * Returns whether a value is a JSON-safe object suitable for Widget
 * Configuration.
 */
export function isJsonObject(value: unknown): value is JsonObject {
  return decodeJsonObject(value) !== null;
}

/**
 * Returns whether a value is an ordinary object with `Object.prototype` or a
 * null prototype. Arrays, `null`, class instances, and other exotic objects
 * are not records.
 */
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

/**
 * Normalizes an absolute, credential-free HTTP(S) URL and removes its fragment.
 *
 * Returns `null` for malformed, relative, non-HTTP(S), or credential-bearing
 * URLs. Unlike {@link validateWidgetManifest}, this helper does not require a
 * particular origin.
 */
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
