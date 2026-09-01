import { NgComponentOutlet } from '@angular/common';
import {
  Component,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import type { Type } from '@angular/core';
import type {
  UnavailableWidgetConfiguration,
  WidgetConfiguration,
  WidgetType,
} from './dashboard.models';
import { isBuiltInWidgetType } from './dashboard.models';
import { UnavailableWidgetCardComponent } from './unavailable-widget-card.component';
import { WIDGET_REGISTRY } from './widget-registry';

type ResolutionState = 'loading' | 'resolved' | 'unavailable';

@Component({
  selector: 'app-widget-renderer',
  imports: [NgComponentOutlet, UnavailableWidgetCardComponent],
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
    } @else if (resolutionState() === 'unavailable') {
      <app-unavailable-widget-card
        [widgetType]="widgetType()"
        [configuration]="configuration()"
        (removed)="unavailable.emit()"
      />
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
  readonly configuration = input.required<
    WidgetConfiguration | UnavailableWidgetConfiguration
  >();
  readonly resolved = output<void>();
  readonly unavailable = output<void>();

  protected readonly resolutionState = signal<ResolutionState>('loading');
  protected readonly resolvedComponent = signal<Type<unknown> | null>(null);
  readonly #registry = inject(WIDGET_REGISTRY);

  constructor() {
    effect(() => {
      const widgetType = this.widgetType();

      this.resolutionState.set('loading');
      this.resolvedComponent.set(null);
      void this.#loadImplementation(widgetType).catch(() => undefined);
    });
  }

  async #loadImplementation(widgetType: WidgetType): Promise<void> {
    if (!isBuiltInWidgetType(widgetType)) {
      this.#setUnavailableIfCurrent(widgetType);
      return;
    }

    try {
      const component = await this.#registry[widgetType].loadImplementation();

      if (this.widgetType() !== widgetType) {
        return;
      }

      this.resolvedComponent.set(component);
      this.resolutionState.set('resolved');
      this.resolved.emit();
    } catch {
      this.#setUnavailableIfCurrent(widgetType);
    }
  }

  #setUnavailableIfCurrent(widgetType: WidgetType): void {
    if (this.widgetType() === widgetType) {
      this.resolvedComponent.set(null);
      this.resolutionState.set('unavailable');
    }
  }
}
