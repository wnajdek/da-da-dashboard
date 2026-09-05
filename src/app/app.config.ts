import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideTrustedManifestOrigins } from './dashboard/widget-runtime.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    // Operator-owned configuration. An empty list fails closed until trusted origins are set.
    provideTrustedManifestOrigins([
      'http://localhost:4200',
      'http://localhost:4201',
    ]),
  ],
};
