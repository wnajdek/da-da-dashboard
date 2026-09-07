import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideWidgetInstallationPersistence } from './dashboard/widget-installation/widget-installation-persistence.service';
import { provideTrustedManifestOrigins } from './dashboard/widget-installation/widget-runtime.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideWidgetInstallationPersistence(),
    // Operator-owned configuration. An empty list fails closed until trusted origins are set.
    provideTrustedManifestOrigins([
      'http://localhost:4200',
      'http://localhost:4201',
    ]),
  ],
};
