import { FOCUS_TIMER_WIDGET_DEFINITION } from './widget.definition';

/** The complete, JSON-safe value exchanged through the browser Widget contract. */
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

/**
 * Converts an untrusted boundary value into the complete configuration the UI
 * can safely render. Both Elements call this because `configuration` is a
 * browser property: anyone can assign any JavaScript value to it.
 */
export function readWidgetConfiguration(
  value: unknown,
): WidgetConfigurationReadResult {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return invalidConfiguration('Enter a task.');
  }

  // The shape check above makes this narrow cast safe; each field is still
  // checked below because an arbitrary object may omit or mistype it.
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

  // Return a fresh, normalized complete replacement—not the caller's object.
  return { status: 'valid', configuration: { task, durationMinutes } };
}

/** Invalid input never leaks into the UI; use the manifest's safe default instead. */
function invalidConfiguration(message: string): WidgetConfigurationReadResult {
  return {
    status: 'invalid',
    configuration: DEFAULT_WIDGET_CONFIGURATION,
    message,
  };
}
