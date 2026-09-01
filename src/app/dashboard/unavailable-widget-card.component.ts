import { Component, input, output } from '@angular/core';
import type {
  UnavailableWidgetConfiguration,
  WidgetConfiguration,
  WidgetType,
} from './dashboard.models';

type WidgetCardConfiguration =
  Pick<WidgetConfiguration, 'title'> | UnavailableWidgetConfiguration;

@Component({
  selector: 'app-unavailable-widget-card',
  template: `
    <article
      class="widget-card widget-unavailable"
      data-testid="unavailable-widget"
      aria-live="polite"
    >
      <p class="widget-kind">Unavailable widget</p>
      <h2>{{ displayTitle() }}</h2>
      <p class="widget-caption">
        The “{{ widgetType() }}” Widget Type is not available in this session.
      </p>
      <button
        type="button"
        class="remove-widget"
        data-testid="remove-unavailable-widget"
        (click)="removed.emit()"
      >
        Remove widget
      </button>
    </article>
  `,
  styleUrl: './widget-card.scss',
})
export class UnavailableWidgetCardComponent {
  readonly widgetType = input.required<WidgetType>();
  readonly configuration = input.required<WidgetCardConfiguration>();
  readonly removed = output<void>();

  protected displayTitle(): string {
    const title = this.configuration().title;

    return typeof title === 'string' && title.length > 0
      ? title
      : 'Widget unavailable';
  }
}
