import { isJsonObject } from './json-value';

describe('isJsonObject', () => {
  it('rejects cyclic values without overflowing the stack', () => {
    const value: Record<string, unknown> = {};
    value['self'] = value;

    expect(isJsonObject(value)).toBeFalse();
  });

  it('accepts a shared nested object because sharing is JSON serializable', () => {
    const shared = { enabled: true };

    expect(isJsonObject({ first: shared, second: shared })).toBeTrue();
  });
});
