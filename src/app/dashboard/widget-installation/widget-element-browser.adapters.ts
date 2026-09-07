import { InjectionToken } from '@angular/core';

export interface WidgetEntryBundleLoader {
  load(url: string): Promise<void>;
}

export interface WidgetElementRegistry {
  isRegistered(tag: string): boolean;
}

export const WIDGET_ENTRY_BUNDLE_LOADER =
  new InjectionToken<WidgetEntryBundleLoader>('Widget entry bundle loader', {
    providedIn: 'root',
    factory: () => browserWidgetEntryBundleLoader,
  });

export const WIDGET_ELEMENT_REGISTRY = new InjectionToken<WidgetElementRegistry>(
  'Widget Element registry',
  {
    providedIn: 'root',
    factory: () => browserWidgetElementRegistry,
  },
);

const browserWidgetEntryBundleLoader: WidgetEntryBundleLoader = {
  load(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = url;
      script.onload = () => resolve();
      script.onerror = () =>
        reject(new Error('Widget entry bundle failed to load.'));
      document.head.append(script);
    });
  },
};

const browserWidgetElementRegistry: WidgetElementRegistry = {
  isRegistered(tag: string): boolean {
    return customElements.get(tag) !== undefined;
  },
};
