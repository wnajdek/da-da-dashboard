import {
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import {
  DEFAULT_WIDGET_CONFIGURATION,
  readWidgetConfiguration,
} from './widget-configuration';

@Component({
  selector: 'widget-content',
  template: `
    <article aria-labelledby="widget-title">
      <p class="eyebrow">Focus timer</p>
      @if (message(); as feedback) {
        <p role="alert">{{ feedback }}</p>
      } @else {
        <h1 id="widget-title">{{ task() }}</h1>
        <p class="countdown" aria-live="polite">
          {{ minutes() }}:{{ seconds() }}
        </p>
        <p class="status">
          {{ isRunning() ? 'Focus session in progress' : 'Ready when you are' }}
        </p>
        <div class="controls">
          <button type="button" (click)="toggleTimer()">
            {{ isRunning() ? 'Pause' : 'Start' }}
          </button>
          <button
            type="button"
            class="secondary"
            data-testid="reset-timer"
            (click)="resetTimer()"
          >
            Reset
          </button>
        </div>
      }
    </article>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
      font:
        16px/1.5 system-ui,
        sans-serif;
    }
    article {
      box-sizing: border-box;
      min-height: 12rem;
      height: 100%;
      padding: 1.25rem;
      color: #172033;
      background: #fff;
      border: 1px solid #c8d1df;
      border-radius: 0.75rem;
    }
    .eyebrow {
      margin: 0 0 0.25rem;
      color: #526079;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    h1 {
      margin: 0 0 0.25rem;
    }
    p[role='alert'] {
      color: #b42318;
    }
    .countdown {
      margin: 0.5rem 0;
      color: #075b67;
      font-size: 2.25rem;
      font-variant-numeric: tabular-nums;
      font-weight: 700;
    }
    .status {
      margin: 0 0 1rem;
      color: #526079;
    }
    .controls {
      display: flex;
      gap: 0.5rem;
    }
    button {
      min-height: 2.25rem;
      padding: 0.25rem 0.75rem;
      border: 1px solid #075b67;
      border-radius: 0.375rem;
      color: #fff;
      background: #075b67;
      font: inherit;
      cursor: pointer;
    }
    .secondary {
      color: #075b67;
      background: #fff;
    }
  `,
})
export class WidgetComponent {
  readonly configuration = input<unknown>(DEFAULT_WIDGET_CONFIGURATION);
  protected readonly task = signal(DEFAULT_WIDGET_CONFIGURATION.task);
  protected readonly message = signal<string | null>(null);
  protected readonly remainingSeconds = signal(
    DEFAULT_WIDGET_CONFIGURATION.durationMinutes * 60,
  );
  protected readonly isRunning = signal(false);
  private readonly destroyRef = inject(DestroyRef);
  private countdownInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => this.stopTimer());

    effect(() => {
      const result = readWidgetConfiguration(this.configuration());
      this.stopTimer();
      this.task.set(result.configuration.task);
      this.remainingSeconds.set(result.configuration.durationMinutes * 60);
      this.message.set(result.status === 'invalid' ? result.message : null);
    });
  }

  protected minutes(): string {
    return String(Math.floor(this.remainingSeconds() / 60)).padStart(2, '0');
  }

  protected seconds(): string {
    return String(this.remainingSeconds() % 60).padStart(2, '0');
  }

  protected toggleTimer(): void {
    if (this.isRunning()) {
      this.stopTimer();
      return;
    }

    if (this.remainingSeconds() === 0) {
      this.resetTimer();
    }

    this.isRunning.set(true);
    this.countdownInterval = setInterval(() => this.tick(), 1_000);
  }

  protected resetTimer(): void {
    this.stopTimer();
    const result = readWidgetConfiguration(this.configuration());
    this.remainingSeconds.set(result.configuration.durationMinutes * 60);
  }

  private tick(): void {
    const nextRemainingSeconds = this.remainingSeconds() - 1;

    if (nextRemainingSeconds <= 0) {
      this.remainingSeconds.set(0);
      this.stopTimer();
      return;
    }

    this.remainingSeconds.set(nextRemainingSeconds);
  }

  private stopTimer(): void {
    if (this.countdownInterval !== null) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }

    this.isRunning.set(false);
  }
}
