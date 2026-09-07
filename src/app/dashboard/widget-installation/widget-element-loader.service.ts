import { inject, Injectable } from '@angular/core';
import {
  WIDGET_ELEMENT_REGISTRY,
  WIDGET_ENTRY_BUNDLE_LOADER,
} from './widget-element-browser.adapters';
import type { WidgetInstallation } from './widget-installation.models';
import { WidgetTrustPolicy } from './widget-trust-policy';

@Injectable({ providedIn: 'root' })
export class WidgetElementLoaderService {
  private readonly entryBundleLoader = inject(WIDGET_ENTRY_BUNDLE_LOADER);
  private readonly elementRegistry = inject(WIDGET_ELEMENT_REGISTRY);
  private readonly trustPolicy = inject(WidgetTrustPolicy);
  private readonly entryBundlePromises = new Map<string, Promise<void>>();
  private readonly elementSources = new Map<string, string>();

  async load(installation: WidgetInstallation): Promise<void> {
    if (!this.trustPolicy.isTrustedInstallation(installation)) {
      throw new Error('The Widget Installation is no longer trusted.');
    }

    const existingSource = this.elementSources.get(installation.elementTag);

    if (existingSource !== undefined) {
      if (existingSource === installation.entryBundleUrl) {
        return;
      }

      throw new Error(
        `The Widget Element tag ${installation.elementTag} is already loaded from another bundle.`,
      );
    }

    if (this.elementRegistry.isRegistered(installation.elementTag)) {
      throw new Error(
        `The Widget Element tag ${installation.elementTag} is already registered.`,
      );
    }

    let load = this.entryBundlePromises.get(installation.entryBundleUrl);

    if (load === undefined) {
      load = this.entryBundleLoader.load(installation.entryBundleUrl);
      this.entryBundlePromises.set(installation.entryBundleUrl, load);
    }

    try {
      await load;
    } catch (error) {
      this.entryBundlePromises.delete(installation.entryBundleUrl);
      throw error;
    }

    if (!this.elementRegistry.isRegistered(installation.elementTag)) {
      throw new Error(
        `The Widget bundle did not register ${installation.elementTag}.`,
      );
    }

    this.elementSources.set(
      installation.elementTag,
      installation.entryBundleUrl,
    );
  }
}
