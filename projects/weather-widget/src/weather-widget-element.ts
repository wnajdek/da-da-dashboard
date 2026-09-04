import { ApplicationRef, createComponent } from '@angular/core';
import { WeatherWidgetComponent } from './weather-widget.component';

export function createWeatherWidgetElement(
  application: Promise<ApplicationRef>,
): CustomElementConstructor {
  return class extends HTMLElement {
    #component: ReturnType<
      typeof createComponent<WeatherWidgetComponent>
    > | null = null;
    #application: ApplicationRef | null = null;
    #attached = false;
    #connected = false;
    #configuration: unknown = undefined;

    get configuration(): unknown {
      return this.#configuration;
    }

    set configuration(value: unknown) {
      this.#configuration = value;
      this.#component?.setInput('configuration', value);

      if (this.#attached && this.#component !== null) {
        this.#component.changeDetectorRef.detectChanges();
      }
    }

    connectedCallback(): void {
      this.#connected = true;
      void this.#attach();
    }

    disconnectedCallback(): void {
      this.#connected = false;

      if (
        this.#attached &&
        this.#application !== null &&
        this.#component !== null
      ) {
        this.#application.detachView(this.#component.hostView);
        this.#attached = false;
      }
    }

    async #attach(): Promise<void> {
      const app = await application;

      if (!this.#connected) {
        return;
      }

      if (this.#component === null) {
        this.#component = createComponent(WeatherWidgetComponent, {
          environmentInjector: app.injector,
          hostElement: this,
        });
      }

      this.#application = app;

      if (!this.#attached) {
        app.attachView(this.#component.hostView);
        this.#attached = true;
      }

      if (this.#configuration !== undefined) {
        this.#component.setInput('configuration', this.#configuration);
      }
      this.#component.changeDetectorRef.detectChanges();
    }
  };
}
