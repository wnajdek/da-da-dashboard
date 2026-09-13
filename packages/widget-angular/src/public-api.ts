import {
  ApplicationRef,
  ComponentRef,
  createComponent,
  provideZonelessChangeDetection,
  type Type,
} from '@angular/core';
import { createApplication } from '@angular/platform-browser';
import type { WidgetConfiguration, WidgetManifest } from '@da-da/widget-contract';
import { WIDGET_CONFIGURATION_CHANGED_EVENT } from '@da-da/widget-contract';

export interface AngularWidgetComponents {
  readonly contentComponent: Type<unknown>;
  readonly settingsComponent: Type<unknown>;
}

export interface AngularWidgetRegistration extends AngularWidgetComponents {
  readonly definition: WidgetManifest;
}

export interface CustomElementRegistryPort {
  get(name: string): CustomElementConstructor | undefined;
  define(name: string, constructor: CustomElementConstructor): void;
}

export async function registerAngularWidget(
  registration: AngularWidgetRegistration,
  registry: CustomElementRegistryPort = customElements,
): Promise<void> {
  const { definition } = registration;

  if (
    registry.get(definition.elementTag) !== undefined ||
    registry.get(definition.settingsElementTag) !== undefined
  ) {
    throw new Error('Widget element tags are already registered.');
  }

  const application = createApplication({
    providers: [provideZonelessChangeDetection()],
  });

  registry.define(
    definition.elementTag,
    createAngularWidgetElement(application, registration.contentComponent),
  );
  registry.define(
    definition.settingsElementTag,
    createAngularWidgetElement(application, registration.settingsComponent),
  );
}

export function emitWidgetConfigurationChanged(
  element: HTMLElement,
  configuration: WidgetConfiguration,
): void {
  element.dispatchEvent(
    new CustomEvent(WIDGET_CONFIGURATION_CHANGED_EVENT, {
      bubbles: true,
      detail: configuration,
    }),
  );
}

function createAngularWidgetElement(
  application: Promise<ApplicationRef>,
  componentType: Type<unknown>,
): CustomElementConstructor {
  return class extends HTMLElement {
    private component: ComponentRef<unknown> | null = null;
    private application: ApplicationRef | null = null;
    private attached = false;
    private connected = false;
    private configurationValue: unknown = undefined;

    get configuration(): unknown {
      return this.configurationValue;
    }

    set configuration(value: unknown) {
      this.configurationValue = value;
      this.component?.setInput('configuration', value);

      if (this.attached && this.component !== null) {
        this.component.changeDetectorRef.detectChanges();
      }
    }

    connectedCallback(): void {
      this.connected = true;
      void this.attach();
    }

    disconnectedCallback(): void {
      this.connected = false;

      if (
        this.attached &&
        this.application !== null &&
        this.component !== null
      ) {
        this.application.detachView(this.component.hostView);
        this.attached = false;
      }
    }

    private async attach(): Promise<void> {
      const applicationRef = await application;

      if (!this.connected) {
        return;
      }

      if (this.component === null) {
        this.component = createComponent(componentType, {
          environmentInjector: applicationRef.injector,
          hostElement: this,
        });
      }

      this.application = applicationRef;

      if (!this.attached) {
        applicationRef.attachView(this.component.hostView);
        this.attached = true;
      }

      if (this.configurationValue !== undefined) {
        this.component.setInput('configuration', this.configurationValue);
      }
      this.component.changeDetectorRef.detectChanges();
    }
  };
}
