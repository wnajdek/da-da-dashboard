import { NgComponentOutlet } from '@angular/common';
import { Component, effect, input, signal } from '@angular/core';
import type { Type } from '@angular/core';
import type { WidgetConfiguration, WidgetType } from './dashboard.models';
import { BUILT_IN_WIDGET_REGISTRY } from './widget-registry';

type ResolutionState = 'loading' | 'resolved';

@Component({
  selector: 'app-widget-renderer',
  imports: [NgComponentOutlet],
  template: `
    @if (resolutionState() === 'loading') {
      <article
        class="widget-card widget-loading"
        data-testid="widget-loading"
        aria-live="polite"
      >
        <p class="widget-kind">Widget</p>
        <p>Loading {{ configuration().title }}…</p>
      </article>
    } @else if (resolvedComponent(); as component) {
      <ng-container
        [ngComponentOutlet]="component"
        [ngComponentOutletInputs]="{ configuration: configuration() }"
      />
    }
  `,
  styleUrl: './widget-card.scss',
})
export class WidgetRendererComponent {
  readonly widgetType = input.required<WidgetType>();
  readonly configuration = input.required<WidgetConfiguration>();

  protected readonly resolutionState = signal<ResolutionState>('loading');
  protected readonly resolvedComponent = signal<Type<unknown> | null>(null);

  constructor() {
    effect(() => {
      const widgetType = this.widgetType();

      this.resolutionState.set('loading');
      this.resolvedComponent.set(null);
      void this.#loadImplementation(widgetType).catch(() => undefined);
    });
  }

  async #loadImplementation(widgetType: WidgetType): Promise<void> {
    const component =
      await BUILT_IN_WIDGET_REGISTRY[widgetType].loadImplementation();

    if (this.widgetType() !== widgetType) {
      return;
    }

    this.resolvedComponent.set(component);
    this.resolutionState.set('resolved');
  }
}
