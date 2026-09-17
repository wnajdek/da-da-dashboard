import {
  ApplicationRef,
  ComponentRef,
  createComponent,
  provideZonelessChangeDetection,
  type Type,
} from '@angular/core';
import { createApplication } from '@angular/platform-browser';
import type {
  WidgetConfiguration,
  WidgetManifest,
} from '@da-da/widget-contract';
import { WIDGET_CONFIGURATION_CHANGED_EVENT } from '@da-da/widget-contract';

export interface AngularWidgetComponents {
  /**
   * The component rendered by the Widget Element declared by
   * {@link AngularWidgetRegistration.definition}.
   *
   * The component must expose an Angular input named `configuration`. The
   * adapter supplies the Dashboard's current Widget Configuration through that
   * input whenever the host element is attached or its configuration changes.
   */
  readonly contentComponent: Type<unknown>;

  /**
   * The component rendered by the Widget Settings Element declared by
   * {@link AngularWidgetRegistration.definition}.
   *
   * The component must expose an Angular input named `configuration`. When it
   * produces a replacement configuration, use
   * {@link emitWidgetConfigurationChanged} to notify the Dashboard.
   */
  readonly settingsComponent: Type<unknown>;
}

/**
 * The Angular components and Widget Manifest used to register one Widget Type.
 */
export interface AngularWidgetRegistration extends AngularWidgetComponents {
  /**
   * The manifest that supplies the content and settings Custom Element tags.
   */
  readonly definition: WidgetManifest;
}

/**
 * The Custom Element registry used by {@link registerAngularWidget}.
 *
 * Supply a registry explicitly when registering into a non-default registry;
 * browser callers normally use the default global `customElements` registry.
 */
export interface CustomElementRegistryPort {
  get(name: string): CustomElementConstructor | undefined;
  define(name: string, constructor: CustomElementConstructor): void;
}

/**
 * Registers Angular content and settings components as the Custom Elements
 * declared by a Widget Manifest.
 *
 * Both components receive the host element's `configuration` property through
 * their `configuration` input. A value assigned before the element is attached
 * to the DOM, while it is detached, or after it is attached is applied when
 * possible. Later updates reuse the existing Angular component instance.
 *
 * The browser's global `customElements` registry is used by default. If either
 * manifest tag is already registered, this function rejects before registering
 * either element.
 *
 * @example
 * ```ts
 * import { Component, ElementRef, inject, input } from '@angular/core';
 * import type { WidgetConfiguration } from '@da-da/widget-contract';
 * import {
 *   emitWidgetConfigurationChanged,
 *   registerAngularWidget,
 * } from '@da-da/widget-angular';
 * import { weatherManifest } from './weather-widget.definition';
 *
 * @Component({ template: '<p>Weather</p>' })
 * class WeatherContentComponent {
 *   readonly configuration = input<WidgetConfiguration>();
 * }
 *
 * @Component({ template: '<button (click)="save()">Save</button>' })
 * class WeatherSettingsComponent {
 *   readonly configuration = input<WidgetConfiguration>();
 *   private readonly hostElement = inject(ElementRef<HTMLElement>).nativeElement;
 *
 *   save(): void {
 *     emitWidgetConfigurationChanged(this.hostElement, {
 *       location: 'Gdańsk',
 *     });
 *   }
 * }
 *
 * await registerAngularWidget({
 *   definition: weatherManifest,
 *   contentComponent: WeatherContentComponent,
 *   settingsComponent: WeatherSettingsComponent,
 * });
 * ```
 *
 * @throws {Error} If either manifest element tag is already registered.
 */
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

/**
 * Dispatches a bubbling `configuration-changed` Custom Event from a Widget
 * Settings Element.
 *
 * `configuration` must be a complete, JSON-safe replacement Widget
 * Configuration, not a partial update. This helper only dispatches the event;
 * the Dashboard validates and persists the replacement configuration.
 *
 * @example
 * ```ts
 * emitWidgetConfigurationChanged(this.hostElement, { location: 'Gdańsk' });
 * ```
 */
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
