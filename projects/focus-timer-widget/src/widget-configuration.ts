import { FOCUS_TIMER_WIDGET_DEFINITION } from './widget.definition';

export interface WidgetConfiguration {
  readonly [key: string]: string | number;
  readonly task: string;
  readonly durationMinutes: number;
}

export type WidgetConfigurationReadResult =
  | { readonly status: 'valid'; readonly configuration: WidgetConfiguration }
  | {
      readonly status: 'invalid';
      readonly configuration: WidgetConfiguration;
      readonly message: string;
    };

export const DEFAULT_WIDGET_CONFIGURATION: WidgetConfiguration =
  FOCUS_TIMER_WIDGET_DEFINITION.defaultConfiguration;

export function readWidgetConfiguration(
  value: unknown,
): WidgetConfigurationReadResult {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return invalidConfiguration('Enter a task.');
  }

  const record = value as Record<string, unknown>;
  const task = typeof record['task'] === 'string' ? record['task'].trim() : '';
  const durationMinutes = record['durationMinutes'];

  if (task.length === 0) {
    return invalidConfiguration('Enter a task.');
  }

  if (
    typeof durationMinutes !== 'number' ||
    !Number.isInteger(durationMinutes) ||
    durationMinutes < 1 ||
    durationMinutes > 120
  ) {
    return invalidConfiguration('Choose a duration between 1 and 120 minutes.');
  }

  return { status: 'valid', configuration: { task, durationMinutes } };
}

function invalidConfiguration(message: string): WidgetConfigurationReadResult {
  return {
    status: 'invalid',
    configuration: DEFAULT_WIDGET_CONFIGURATION,
    message,
  };
}
