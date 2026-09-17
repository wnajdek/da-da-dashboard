# @da-da/widget-angular

Angular integration for Dashboard Widgets. It registers Angular content and
settings components as the Custom Elements declared by a Widget Manifest, and
provides the configuration-change event helper for settings components.

## Install

```bash
npm install @da-da/widget-angular @da-da/widget-contract
```

This package has peer dependencies on Angular 20 (`@angular/common`,
`@angular/core`, and `@angular/platform-browser`) and
`@da-da/widget-contract`.

## Register a Widget

Define a `WidgetManifest` with `@da-da/widget-contract`, then register one
content component and one settings component. Both components must expose an
Angular input named `configuration`.

```ts
import { Component, ElementRef, inject, input } from "@angular/core";
import { emitWidgetConfigurationChanged, registerAngularWidget } from "@da-da/widget-angular";
import type { WidgetConfiguration } from "@da-da/widget-contract";
import { weatherManifest } from "./weather-widget.definition";

@Component({ template: "<p>Weather</p>" })
class WeatherContentComponent {
  readonly configuration = input<WidgetConfiguration>();
}

@Component({ template: '<button (click)="save()">Save</button>' })
class WeatherSettingsComponent {
  readonly configuration = input<WidgetConfiguration>();
  private readonly hostElement = inject(ElementRef<HTMLElement>).nativeElement;

  save(): void {
    emitWidgetConfigurationChanged(this.hostElement, {
      location: "Gdańsk",
      units: "metric",
    });
  }
}

await registerAngularWidget({
  definition: weatherManifest,
  contentComponent: WeatherContentComponent,
  settingsComponent: WeatherSettingsComponent,
});
```

`registerAngularWidget` uses the browser's `customElements` registry by
default. It rejects before registering either element if either manifest tag is
already taken. Pass a `CustomElementRegistryPort` only when registering into a
different registry.

## Configuration lifecycle

The adapter forwards the host element's `configuration` property to the Angular
input before first DOM attachment, after reconnecting, and after later changes.
Later updates reuse the existing component instance.

The settings component emits a complete JSON-safe replacement configuration;
it does not persist anything itself. The Dashboard validates the event detail,
persists an accepted replacement, and supplies that value back to both
elements.

## Related package

[`@da-da/widget-contract`](../widget-contract/README.md) defines the manifest,
configuration, validation, and framework-neutral Custom Element contract.
