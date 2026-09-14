import type { WidgetManifest } from '@da-da/widget-contract';

export const FOCUS_TIMER_WIDGET_DEFINITION = {
  manifestVersion: 2,
  type: 'focus-timer',
  displayName: 'Focus timer',
  description: 'A local countdown for a single focused task',
  version: '1.0.0',
  elementTag: 'sample-focus-timer-widget',
  settingsElementTag: 'sample-focus-timer-widget-settings',
  entryBundleUrl: './main.js',
  defaultConfiguration: { task: 'Focus session', durationMinutes: 25 },
  preferredLayout: { w: 3, h: 2 },
} as const satisfies WidgetManifest;
