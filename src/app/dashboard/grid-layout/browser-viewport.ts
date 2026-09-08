import { InjectionToken, Signal, signal } from '@angular/core';

export interface BrowserViewport {
  readonly width: Signal<number>;
}

export const BROWSER_VIEWPORT = new InjectionToken<BrowserViewport>(
  'Browser viewport',
  {
    providedIn: 'root',
    factory: () => new WindowBrowserViewport(),
  },
);

class WindowBrowserViewport implements BrowserViewport {
  readonly width = signal(window.innerWidth);

  constructor() {
    window.addEventListener('resize', () => this.width.set(window.innerWidth));
  }
}
