export type JsonValue =
  | null
  | boolean
  | number
  | string
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue };

export type JsonObject = { readonly [key: string]: JsonValue };

export const MAX_JSON_CONFIGURATION_DEPTH = 64;
export const MAX_JSON_CONFIGURATION_VALUES = 10_000;

const INVALID_JSON_VALUE = Symbol('invalid-json-value');

interface DecoderContext {
  readonly activeObjects: WeakSet<object>;
  valueCount: number;
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
    lengthDescriptor.value >
      MAX_JSON_CONFIGURATION_VALUES - context.valueCount
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

    const propertyValue = decodeJsonValue(
      descriptor.value,
      depth + 1,
      context,
    );

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

function isStructuredCloneable(value: unknown): boolean {
  try {
    structuredClone(value);
    return true;
  } catch {
    return false;
  }
}
