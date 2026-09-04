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
} from './dashboard.models';
import { isJsonObject } from './json-value';
import { UnavailableWidgetCardComponent } from './unavailable-widget-card.component';
import type { WidgetInstallation } from './widget-installation-persistence.service';
import { WidgetRuntimeService } from './widget-runtime.service';

interface WidgetElement extends HTMLElement {
  configuration: WidgetConfiguration;
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
  private readonly runtime = inject(WidgetRuntimeService);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  #element: WidgetElement | null = null;
  #onConfigurationChanged: ((event: Event) => void) | null = null;
  #mountRevision = 0;
  #destroyed = false;

  constructor() {
    effect(() => {
      const installation = this.installation();
      afterNextRender(() => void this.#mount(installation), {
        injector: this.injector,
      });
    });

    effect(() => {
      const element = this.#element;
      const configuration = this.configuration();

      if (element !== null) {
        element.configuration = configuration;
      }
    });

    this.destroyRef.onDestroy(() => {
      this.#destroyed = true;
      this.#mountRevision += 1;
      this.#unmount();
    });
  }

  async #mount(installation: WidgetInstallation): Promise<void> {
    const revision = ++this.#mountRevision;
    this.#unmount();
    this.state.set('loading');

    try {
      await this.runtime.loadElement(installation);

      if (this.#destroyed || revision !== this.#mountRevision) {
        return;
      }

      const element = document.createElement(
        installation.elementTag,
      ) as WidgetElement;
      this.#onConfigurationChanged = (event: Event) => {
        const detail = (event as CustomEvent<unknown>).detail;

        if (isJsonObject(detail)) {
          this.changed.emit({ id: this.widgetId(), configuration: detail });
        }
      };
      element.addEventListener(
        'configuration-changed',
        this.#onConfigurationChanged,
      );
      this.#element = element;
      this.state.set('ready');
      afterNextRender(
        () => {
          const readyHost = this.elementHost()?.nativeElement;

          if (
            readyHost === undefined ||
            this.#element !== element ||
            this.#destroyed ||
            revision !== this.#mountRevision
          ) {
            return;
          }

          element.configuration = this.configuration();
          readyHost.replaceChildren(element);
        },
        { injector: this.injector },
      );
    } catch {
      if (!this.#destroyed && revision === this.#mountRevision) {
        this.state.set('unavailable');
      }
    }
  }

  #unmount(): void {
    if (this.#element !== null && this.#onConfigurationChanged !== null) {
      this.#element.removeEventListener(
        'configuration-changed',
        this.#onConfigurationChanged,
      );
    }

    this.#element?.remove();
    this.#element = null;
    this.#onConfigurationChanged = null;
  }
}
