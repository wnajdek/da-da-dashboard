import { InjectionToken } from '@angular/core';
import type { WidgetManifest } from './widget-manifest';

export interface WidgetInstallation extends WidgetManifest {
  readonly manifestUrl: string;
}

export type WidgetInstallationsLoadResult =
  | { readonly status: 'missing' }
  | {
      readonly status: 'ready';
      readonly installations: readonly WidgetInstallation[];
    }
  | { readonly status: 'recovery'; readonly message: string };

export interface WidgetInstallationPersistence {
  load(): WidgetInstallationsLoadResult;
  save(installations: readonly WidgetInstallation[]): boolean;
}

export const WIDGET_INSTALLATION_PERSISTENCE =
  new InjectionToken<WidgetInstallationPersistence>(
    'Widget Installation persistence',
  );

export interface WidgetInstallationFeedback {
  readonly status: 'success' | 'error';
  readonly message: string;
}

export type WidgetInstallationRejection = {
  readonly status: 'rejected';
  readonly message: string;
};

export type WidgetInstallationResult =
  | { readonly status: 'installed'; readonly installation: WidgetInstallation }
  | WidgetInstallationRejection;

export type WidgetInstallationRemovalResult =
  | { readonly status: 'removed'; readonly installation: WidgetInstallation }
  | WidgetInstallationRejection;
