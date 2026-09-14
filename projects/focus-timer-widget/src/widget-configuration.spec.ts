import { readWidgetConfiguration } from './widget-configuration';

describe('readWidgetConfiguration', () => {
  it('returns explicit feedback for an invalid runtime configuration', () => {
    expect(
      readWidgetConfiguration({ task: '  ', durationMinutes: 25 }),
    ).toEqual({
      status: 'invalid',
      configuration: { task: 'Focus session', durationMinutes: 25 },
      message: 'Enter a task.',
    });
  });

  it('rejects a duration outside the focused-session range', () => {
    expect(
      readWidgetConfiguration({
        task: 'Write the release notes',
        durationMinutes: 0,
      }),
    ).toEqual({
      status: 'invalid',
      configuration: { task: 'Focus session', durationMinutes: 25 },
      message: 'Choose a duration between 1 and 120 minutes.',
    });
  });

  it('returns a complete normalized timer configuration', () => {
    expect(
      readWidgetConfiguration({
        task: '  Write the release notes  ',
        durationMinutes: 45,
      }),
    ).toEqual({
      status: 'valid',
      configuration: { task: 'Write the release notes', durationMinutes: 45 },
    });
  });
});
