export type JsonValue =
  | null
  | boolean
  | number
  | string
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue };

export type JsonObject = { readonly [key: string]: JsonValue };

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
  return isJsonValueWithActiveObjects(value, new WeakSet<object>());
}

export function isJsonObject(value: unknown): value is JsonObject {
  return (
    isRecord(value) &&
    isJsonValueWithActiveObjects(value, new WeakSet<object>())
  );
}

function isJsonValueWithActiveObjects(
  value: unknown,
  activeObjects: WeakSet<object>,
): value is JsonValue {
  if (
    value === null ||
    typeof value === 'boolean' ||
    typeof value === 'string'
  ) {
    return true;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value);
  }

  if (Array.isArray(value)) {
    if (activeObjects.has(value)) {
      return false;
    }

    activeObjects.add(value);

    try {
      return value.every((item) =>
        isJsonValueWithActiveObjects(item, activeObjects),
      );
    } finally {
      activeObjects.delete(value);
    }
  }

  if (!isRecord(value)) {
    return false;
  }

  if (activeObjects.has(value)) {
    return false;
  }

  activeObjects.add(value);

  try {
    return Object.values(value).every((item) =>
      isJsonValueWithActiveObjects(item, activeObjects),
    );
  } finally {
    activeObjects.delete(value);
  }
}
