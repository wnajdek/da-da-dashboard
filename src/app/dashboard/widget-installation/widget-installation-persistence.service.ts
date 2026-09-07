import { inject, Injectable, InjectionToken } from '@angular/core';
import { DASHBOARD_STORAGE } from '../workspace/dashboard-persistence.service';
import { isRecord } from '../workspace/json-value';
import {
  normalizeHttpUrl,
  validateWidgetManifest,
  type WidgetManifest,
} from './widget-manifest';

export const WIDGET_INSTALLATIONS_STORAGE_KEY =
  'configurable-dashboard.widget-installations';
export const WIDGET_INSTALLATIONS_STORAGE = new InjectionToken<Storage>(
  'Widget installations storage',
  { providedIn: 'root', factory: () => inject(DASHBOARD_STORAGE) },
);

export interface WidgetInstallation extends WidgetManifest {
  readonly manifestUrl: string;
}

export interface WidgetInstallationsSnapshotV1 {
  readonly schemaVersion: 1;
  readonly installations: readonly WidgetInstallation[];
}

export type WidgetInstallationsLoadResult =
  | { readonly status: 'missing' }
  | {
      readonly status: 'ready';
      readonly installations: readonly WidgetInstallation[];
    }
  | { readonly status: 'recovery'; readonly message: string };

@Injectable({ providedIn: 'root' })
export class WidgetInstallationPersistenceService {
  private readonly storage = inject(WIDGET_INSTALLATIONS_STORAGE);

  load(): WidgetInstallationsLoadResult {
    let savedSnapshot: string | null;

    try {
      savedSnapshot = this.storage.getItem(WIDGET_INSTALLATIONS_STORAGE_KEY);
    } catch {
      return {
        status: 'recovery',
        message: 'Saved Widget Installations could not be read.',
      };
    }

    if (savedSnapshot === null) {
      return { status: 'missing' };
    }

    try {
      const snapshot: unknown = JSON.parse(savedSnapshot);

      if (!isRecord(snapshot) || snapshot['schemaVersion'] !== 1) {
        return {
          status: 'recovery',
          message: 'Saved Widget Installations use an unsupported version.',
        };
      }

      if (!Array.isArray(snapshot['installations'])) {
        return {
          status: 'recovery',
          message: 'Saved Widget Installations are invalid.',
        };
      }

      const installations = snapshot['installations'].map(
        readWidgetInstallation,
      );
      const validInstallations = installations.filter(
        (installation): installation is WidgetInstallation =>
          installation !== null,
      );

      if (
        validInstallations.length !== installations.length ||
        new Set(validInstallations.map((installation) => installation.type))
          .size !== validInstallations.length ||
        new Set(
          validInstallations.map((installation) => installation.elementTag),
        ).size !== validInstallations.length
      ) {
        return {
          status: 'recovery',
          message: 'Saved Widget Installations are invalid.',
        };
      }

      return {
        status: 'ready',
        installations: validInstallations,
      };
    } catch {
      return {
        status: 'recovery',
        message: 'Saved Widget Installations could not be read.',
      };
    }
  }

  save(installations: readonly WidgetInstallation[]): boolean {
    const snapshot: WidgetInstallationsSnapshotV1 = {
      schemaVersion: 1,
      installations,
    };

    try {
      this.storage.setItem(
        WIDGET_INSTALLATIONS_STORAGE_KEY,
        JSON.stringify(snapshot),
      );
      return true;
    } catch {
      return false;
    }
  }
}

function readWidgetInstallation(value: unknown): WidgetInstallation | null {
  if (!isRecord(value) || typeof value['manifestUrl'] !== 'string') {
    return null;
  }

  const manifestUrl = normalizeHttpUrl(value['manifestUrl']);

  if (manifestUrl === null || manifestUrl !== value['manifestUrl']) {
    return null;
  }

  const result = validateWidgetManifest(value, manifestUrl);

  if (result.status !== 'valid') {
    return null;
  }

  return { manifestUrl, ...result.manifest };
}
