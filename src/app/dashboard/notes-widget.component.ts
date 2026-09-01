import { Component, input } from '@angular/core';
import { NotesWidgetConfiguration } from './dashboard.models';

@Component({
  selector: 'app-notes-widget',
  template: `
    <article class="widget-card">
      <p class="widget-kind">Notes</p>
      <h2>{{ configuration().title }}</h2>
      <p class="notes-body">{{ configuration().body }}</p>
    </article>
  `,
  styleUrl: './widget-card.scss',
})
export class NotesWidgetComponent {
  readonly configuration = input.required<NotesWidgetConfiguration>();
}
