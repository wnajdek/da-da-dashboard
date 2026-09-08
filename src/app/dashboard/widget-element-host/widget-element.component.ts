import {
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import type {
  WidgetConfiguration,
  WidgetConfigurationChange,
  WidgetInstance,
} from '../workspace/dashboard.models';
import { decodeJsonObject } from '../workspace/json-value';
import { UnavailableWidgetCardComponent } from './unavailable-widget-card.component';
import type { WidgetInstallation } from '../widget-installation/widget-installation.models';
import { WidgetElementLoaderService } from '../widget-installation/widget-element-loader.service';

interface WidgetElement extends HTMLElement {
  configuration: WidgetConfiguration;
}

interface MountAttempt {
  element: WidgetElement | null;
  onConfigurationChanged: ((event: Event) => void) | null;
}

@Component({
  selector: 'app-widget-element',
  imports: [UnavailableWidgetCardComponent],
  template: `
    @if (state() === 'loading') {
      <article
        class="widget-card widget-loading"
        data-testid="widget-loading"
        aria-live="polite"
      >
        <p class="widget-kind">Loading widget</p>
        <p class="widget-caption">
          Getting {{ installation().displayName }} ready…
        </p>
      </article>
    } @else if (state() === 'unavailable') {
      <app-unavailable-widget-card
        [widgetType]="installation().type"
        [configuration]="configuration()"
        (removed)="removed.emit()"
      />
    } @else {
      <div
        #elementHost
        class="widget-content"
        data-testid="widget-element-host"
      ></div>
    }
  `,
  styleUrl: './widget-card.scss',
})
export class WidgetElementComponent {
  readonly installation = input.required<WidgetInstallation>();
  readonly widgetId = input.required<WidgetInstance['id']>();
  readonly configuration = input.required<WidgetConfiguration>();
  readonly changed = output<WidgetConfigurationChange>();
  readonly removed = output<void>();

  protected readonly state = signal<'loading' | 'ready' | 'unavailable'>(
    'loading',
  );
  private readonly elementHost =
    viewChild<ElementRef<HTMLElement>>('elementHost');
  private readonly elementLoader = inject(WidgetElementLoaderService);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private attempt: MountAttempt | null = null;
  private destroyed = false;

  constructor() {
    effect(() => {
      const installation = this.installation();
      afterNextRender(() => void this.beginMount(installation), {
        injector: this.injector,
      });
    });

    effect(() => {
      const configuration = this.configuration();
      this.updateMountedConfiguration(configuration);
    });

    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
      this.cleanupAttempt(this.attempt);
      this.attempt = null;
    });
  }

  private async beginMount(installation: WidgetInstallation): Promise<void> {
    const attempt = this.startMountAttempt();

    try {
      await this.elementLoader.load(installation);

      if (!this.isCurrentAttempt(attempt)) {
        return;
      }

      const element = document.createElement(
        installation.elementTag,
      ) as WidgetElement;
      attempt.element = element;
      attempt.onConfigurationChanged = (event: Event) =>
        this.handleConfigurationChanged(attempt, event);
      element.addEventListener(
        'configuration-changed',
        attempt.onConfigurationChanged,
      );
      this.assignConfiguration(attempt, this.configuration());
      this.state.set('ready');
      this.attachRenderedElement(attempt);
    } catch {
      this.failAttempt(attempt);
    }
  }

  private startMountAttempt(): MountAttempt {
    this.cleanupAttempt(this.attempt);
    const attempt: MountAttempt = {
      element: null,
      onConfigurationChanged: null,
    };

    this.attempt = attempt;
    this.state.set('loading');

    return attempt;
  }

  private isCurrentAttempt(attempt: MountAttempt): boolean {
    return !this.destroyed && this.attempt === attempt;
  }

  private attachRenderedElement(attempt: MountAttempt): void {
    afterNextRender(
      () => {
        const element = attempt.element;
        const readyHost = this.elementHost()?.nativeElement;

        if (
          element === null ||
          readyHost === undefined ||
          !this.isCurrentAttempt(attempt)
        ) {
          return;
        }

        try {
          readyHost.replaceChildren(element);
        } catch {
          this.failAttempt(attempt);
        }
      },
      { injector: this.injector },
    );
  }

  private updateMountedConfiguration(configuration: WidgetConfiguration): void {
    const attempt = this.attempt;

    if (attempt !== null && attempt.element !== null) {
      try {
        this.assignConfiguration(attempt, configuration);
      } catch {
        this.failAttempt(attempt);
      }
    }
  }

  private assignConfiguration(
    attempt: MountAttempt,
    configuration: WidgetConfiguration,
  ): void {
    if (!this.isCurrentAttempt(attempt) || attempt.element === null) {
      return;
    }

    attempt.element.configuration = configuration;
  }

  private handleConfigurationChanged(
    attempt: MountAttempt,
    event: Event,
  ): void {
    if (!this.isCurrentAttempt(attempt)) {
      return;
    }

    try {
      const detail = (event as CustomEvent<unknown>).detail;
      const configuration = decodeJsonObject(detail);

      if (configuration !== null) {
        this.changed.emit({ id: this.widgetId(), configuration });
      }
    } catch {
      // Widget events are untrusted input at the host boundary.
    }
  }

  private failAttempt(attempt: MountAttempt): void {
    if (!this.isCurrentAttempt(attempt)) {
      return;
    }

    this.cleanupAttempt(attempt);
    this.state.set('unavailable');
  }

  private cleanupAttempt(attempt: MountAttempt | null): void {
    if (attempt === null) {
      return;
    }

    if (attempt.element !== null && attempt.onConfigurationChanged !== null) {
      attempt.element.removeEventListener(
        'configuration-changed',
        attempt.onConfigurationChanged,
      );
    }

    attempt.element?.remove();
    attempt.element = null;
    attempt.onConfigurationChanged = null;
  }
}
