import {
  decodeJsonObject,
  MAX_JSON_CONFIGURATION_DEPTH,
  MAX_JSON_CONFIGURATION_VALUES,
} from './json-value';

describe('decodeJsonObject', () => {
  it('decodes nested values into an application-owned JSON tree', () => {
    const shared = { enabled: true };
    const input = {
      settings: { regions: ['Warsaw', 'Kraków'], shared },
      fallback: shared,
    };

    const decoded = decodeJsonObject(input);

    expect(JSON.stringify(decoded)).toBe(JSON.stringify(input));
    expect(decoded).not.toBe(input);
    expect(decoded?.['settings'] as unknown).not.toBe(input.settings);
    expect((decoded?.['settings'] as { shared: unknown })['shared']).not.toBe(
      shared,
    );
    expect(decoded?.['fallback'] as unknown).not.toBe(shared);
    expect((decoded?.['settings'] as { shared: unknown })['shared']).not.toBe(
      decoded?.['fallback'] as unknown,
    );

    shared.enabled = false;
    expect(JSON.stringify(decoded)).toBe(
      '{"settings":{"regions":["Warsaw","Kraków"],"shared":{"enabled":true}},"fallback":{"enabled":true}}',
    );
  });

  it('rejects malformed or hostile values without throwing', () => {
    const value: Record<string, unknown> = {};
    value['self'] = value;
    const deepValue: Record<string, unknown> = {};
    let deepCursor = deepValue;

    for (let index = 0; index <= MAX_JSON_CONFIGURATION_DEPTH; index += 1) {
      const next: Record<string, unknown> = {};
      deepCursor['next'] = next;
      deepCursor = next;
    }

    const throwingProxy = new Proxy(
      {},
      { getPrototypeOf: () => { throw new Error('untrusted proxy'); } },
    );

    expect(() => {
      expect(decodeJsonObject(value)).toBeNull();
      expect(decodeJsonObject({ value: Number.NaN })).toBeNull();
      expect(decodeJsonObject(deepValue)).toBeNull();
      expect(
        decodeJsonObject({
          values: Array.from(
            { length: MAX_JSON_CONFIGURATION_VALUES + 1 },
            () => 0,
          ),
        }),
      ).toBeNull();
      expect(decodeJsonObject(throwingProxy)).toBeNull();
      expect(decodeJsonObject(new Proxy({}, {}))).toBeNull();
      expect(decodeJsonObject({ value: new Date() })).toBeNull();
    }).not.toThrow();
  });
});
