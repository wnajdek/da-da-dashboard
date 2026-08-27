import { Component, input } from '@angular/core';
import { NotesWidgetInstance } from './dashboard.models';

@Component({
  selector: 'app-notes-widget',
  template: `
    <article class="widget-card">
      <p class="widget-kind">Notes</p>
      <h2>{{ widget().configuration.title }}</h2>
      <p class="notes-body">{{ widget().configuration.body }}</p>
    </article>
  `,
  styleUrl: './widget-card.scss'
})
export class NotesWidgetComponent {
  readonly widget = input.required<NotesWidgetInstance>();
}
