import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  Injector,
  afterNextRender,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { GridItemHTMLElement, GridStack, GridStackNode } from 'gridstack';
import {
  Dashboard,
  WidgetConfigurationChange,
  WidgetInstance,
  WidgetLayoutChange,
} from './dashboard.models';
import { GridStackLayoutAdapter } from './gridstack-layout.adapter';
import { UnavailableWidgetCardComponent } from './unavailable-widget-card.component';
import { WidgetElementComponent } from './widget-element.component';
import { WidgetRuntimeService } from './widget-runtime.service';

@Component({
  selector: 'app-dashboard-grid',
  imports: [UnavailableWidgetCardComponent, WidgetElementComponent],
  template: `
    <section
      #grid
      class="grid-stack"
      [class.grid-stack--single-column]="narrowScreen()"
      aria-label="Dashboard widgets"
    >
      @for (widget of dashboard().widgets; track widget.id) {
        @let gridWidget = gridStackWidget(widget);
        <section
          class="grid-stack-item"
          [attr.gs-id]="gridWidget.id"
          [attr.gs-x]="gridWidget.x"
          [attr.gs-y]="gridWidget.y"
          [attr.gs-w]="gridWidget.w"
          [attr.gs-h]="gridWidget.h"
        >
          <div class="grid-stack-item-content">
            @if (installationFor(widget.type); as installation) {
              <app-widget-element
                [installation]="installation"
                [widgetId]="widget.id"
                [configuration]="widget.configuration"
                (changed)="widgetConfigurationChanged.emit($event)"
                (removed)="widgetRemoved.emit(widget.id)"
              />
            } @else {
              <app-unavailable-widget-card
                [widgetType]="widget.type"
                [configuration]="widget.configuration"
                (removed)="widgetRemoved.emit(widget.id)"
              />
            }
          </div>
        </section>
      }
    </section>
  `,
  styleUrl: './dashboard-grid.component.scss',
})
export class DashboardGridComponent implements AfterViewInit {
  readonly dashboard = input.required<Dashboard>();
  readonly layoutCommitted = output<readonly WidgetLayoutChange[]>();
  readonly widgetConfigurationChanged = output<WidgetConfigurationChange>();
  readonly widgetRemoved = output<string>();
  protected readonly narrowScreen = signal(window.innerWidth <= 767);

  private readonly gridElement =
    viewChild.required<ElementRef<HTMLElement>>('grid');
  readonly #destroyRef = inject(DestroyRef);
  readonly #injector = inject(Injector);
  private readonly runtime = inject(WidgetRuntimeService);
  #grid: GridStack | null = null;

  constructor() {
    effect(() => {
      this.dashboard();
      afterNextRender(() => this.#synchronizeGridItems(), {
        injector: this.#injector,
      });
    });
  }

  ngAfterViewInit(): void {
    this.#grid = GridStack.init(
      {
        column: 12,
        cellHeight: 96,
        margin: 8,
      },
      this.gridElement().nativeElement,
    );
    this.#grid.on('dragstop resizestop', () => this.#commitFinalLayout());
    this.#updateGridInteractivity();
    this.#destroyRef.onDestroy(() => this.#grid?.destroy(false));
  }

  @HostListener('window:resize')
  protected updateScreenPresentation(): void {
    const isNarrowScreen = window.innerWidth <= 767;

    if (isNarrowScreen === this.narrowScreen()) {
      return;
    }

    this.narrowScreen.set(isNarrowScreen);
    this.#updateGridInteractivity();
  }

  protected gridStackWidget(widget: WidgetInstance) {
    return GridStackLayoutAdapter.toGridStackWidget(widget);
  }

  protected installationFor(type: string) {
    return this.runtime.installationFor(type);
  }

  #synchronizeGridItems(): void {
    const grid = this.#grid;

    if (grid === null) {
      return;
    }

    const widgetIds = new Set(
      this.dashboard().widgets.map((widget) => widget.id),
    );

    for (const node of [...grid.engine.nodes]) {
      if (typeof node.id === 'string' && !widgetIds.has(node.id) && node.el) {
        grid.removeWidget(node.el, false);
      }
    }

    const items = [
      ...this.gridElement().nativeElement.querySelectorAll<GridItemHTMLElement>(
        '.grid-stack-item',
      ),
    ];

    for (const item of items) {
      const node = item.gridstackNode;

      if (node?.id !== undefined && !widgetIds.has(String(node.id))) {
        grid.removeWidget(item, false);
      } else if (node === undefined) {
        grid.makeWidget(item);
      }
    }
  }

  #commitFinalLayout(): void {
    const grid = this.#grid;

    if (grid === null) {
      return;
    }

    const changes = grid.engine.nodes
      .map((node: GridStackNode) => GridStackLayoutAdapter.toLayoutChange(node))
      .filter((change): change is WidgetLayoutChange => change !== null);

    this.layoutCommitted.emit(changes);
  }

  #updateGridInteractivity(): void {
    if (this.#grid === null) {
      return;
    }

    if (this.narrowScreen()) {
      this.#grid.disable();
      return;
    }

    this.#grid.enable();
  }
}
