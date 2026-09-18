import type { WidgetManifest } from '@da-da/widget-contract';

/**
 * The single source of truth for this Widget Project's public identity.
 *
 * Build scripts turn this object into `widget-manifest.json`, while `main.ts`
 * uses the same tags to register the browser Custom Elements. Keeping those
 * two outputs derived from one typed value prevents their contracts drifting.
 */
export const FOCUS_TIMER_WIDGET_DEFINITION = {
  // Version two requires both a content Element and a Settings Element.
  manifestVersion: 2,
  // `type` is stable persisted identity; the remaining text is catalog metadata.
  type: 'focus-timer',
  displayName: 'Focus timer',
  description: 'A local countdown for a single focused task',
  version: '1.0.0',
  elementTag: 'sample-focus-timer-widget',
  settingsElementTag: 'sample-focus-timer-widget-settings',
  entryBundleUrl: './main.js',
  defaultConfiguration: { task: 'Focus session', durationMinutes: 25 },
  preferredLayout: { w: 3, h: 2 },
// Preserve literal values while asking TypeScript to verify the public contract.
} as const satisfies WidgetManifest;
