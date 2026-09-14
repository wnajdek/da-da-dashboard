import {
  Component,
  ElementRef,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { emitWidgetConfigurationChanged } from '@da-da/widget-angular';
import {
  DEFAULT_WIDGET_CONFIGURATION,
  readWidgetConfiguration,
} from './widget-configuration';

@Component({
  selector: 'widget-settings',
  template: `
    <form (submit)="save($event)" novalidate>
      <label for="task-input">Task</label>
      <input
        id="task-input"
        type="text"
        [value]="draftTask()"
        (input)="updateTask($event)"
        autocomplete="off"
      />
      <label for="duration-input">Duration in minutes</label>
      <input
        id="duration-input"
        type="number"
        min="1"
        max="120"
        [value]="draftDurationMinutes()"
        (input)="updateDurationMinutes($event)"
      />
      @if (message(); as feedback) {
        <p role="alert">{{ feedback }}</p>
      }
      <button type="submit">Save settings</button>
    </form>
  `,
  styles: `
    :host {
      display: block;
      font:
        16px/1.5 system-ui,
        sans-serif;
    }
    form {
      display: grid;
      gap: 0.5rem;
    }
    input,
    button {
      min-height: 2.25rem;
      border: 1px solid #9aa6ba;
      border-radius: 0.375rem;
      font: inherit;
    }
    input {
      padding: 0.25rem 0.5rem;
    }
    button {
      padding: 0.25rem 0.75rem;
      color: #fff;
      background: #075b67;
      border-color: #075b67;
    }
    p {
      margin: 0;
      color: #b42318;
    }
  `,
})
export class WidgetSettingsComponent {
  readonly configuration = input<unknown>(DEFAULT_WIDGET_CONFIGURATION);
  protected readonly draftTask = signal(DEFAULT_WIDGET_CONFIGURATION.task);
  protected readonly draftDurationMinutes = signal(
    String(DEFAULT_WIDGET_CONFIGURATION.durationMinutes),
  );
  protected readonly message = signal<string | null>(null);
  private readonly hostElement = inject(ElementRef<HTMLElement>);

  constructor() {
    effect(() => {
      const result = readWidgetConfiguration(this.configuration());
      this.draftTask.set(result.configuration.task);
      this.draftDurationMinutes.set(
        String(result.configuration.durationMinutes),
      );
      this.message.set(result.status === 'invalid' ? result.message : null);
    });
  }

  protected updateTask(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.draftTask.set(event.target.value);
      this.message.set(null);
    }
  }

  protected updateDurationMinutes(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.draftDurationMinutes.set(event.target.value);
      this.message.set(null);
    }
  }

  protected save(event: SubmitEvent): void {
    event.preventDefault();
    const result = readWidgetConfiguration({
      task: this.draftTask(),
      durationMinutes: Number(this.draftDurationMinutes()),
    });

    if (result.status === 'invalid') {
      this.message.set(result.message);
      return;
    }

    this.message.set(null);
    emitWidgetConfigurationChanged(
      this.hostElement.nativeElement,
      result.configuration,
    );
  }
}
