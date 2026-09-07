import { InjectionToken } from '@angular/core';

export interface WidgetManifestSource {
  load(url: string): Promise<unknown>;
}

export const WIDGET_MANIFEST_SOURCE = new InjectionToken<WidgetManifestSource>(
  'Widget manifest source',
  {
    providedIn: 'root',
    factory: () => browserWidgetManifestSource,
  },
);

const browserWidgetManifestSource: WidgetManifestSource = {
  async load(url: string): Promise<unknown> {
    const response = await fetch(url, { redirect: 'error' });

    if (!response.ok) {
      throw new Error(
        `Manifest request failed with status ${response.status}.`,
      );
    }

    return (await response.json()) as unknown;
  },
};
