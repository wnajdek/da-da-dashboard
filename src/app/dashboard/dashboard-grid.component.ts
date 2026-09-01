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
  isKnownWidgetInstance,
  UnavailableWidgetInstance,
  WidgetInstance,
  WidgetLayoutChange,
} from './dashboard.models';
import { DemoDataService } from './demo-data.service';
import { GridStackLayoutAdapter } from './gridstack-layout.adapter';
import { WidgetDataGateway } from './widget-data-gateway';
import { WidgetRendererComponent } from './widget-renderer.component';
import { UnavailableWidgetCardComponent } from './unavailable-widget-card.component';

@Component({
  selector: 'app-dashboard-grid',
  standalone: true,
  imports: [UnavailableWidgetCardComponent, WidgetRendererComponent],
  providers: [{ provide: WidgetDataGateway, useExisting: DemoDataService }],
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
            @if (isUnavailableWidget(widget)) {
              <app-unavailable-widget-card
                [widgetType]="widget.type"
                [configuration]="widget.configuration"
                (removed)="widgetRemoved.emit(widget.id)"
              />
            } @else {
              <div class="widget-content">
                <app-widget-renderer
                  [widgetType]="widget.type"
                  [configuration]="widget.configuration"
                  (resolved)="widgetResolved(widget.id)"
                  (unavailable)="widgetRemoved.emit(widget.id)"
                />
              </div>
              @if (isWidgetResolved(widget.id)) {
                <div class="widget-controls">
                  <button
                    type="button"
                    class="widget-drag-handle"
                    [attr.aria-label]="'Move ' + widget.configuration.title"
                  >
                    Move
                  </button>
                  <button
                    type="button"
                    class="edit-widget"
                    [attr.data-testid]="'edit-' + widget.configuration.title"
                    (click)="widgetSelected.emit(widget.id)"
                  >
                    Edit {{ widget.configuration.title }}
                  </button>
                  <button
                    type="button"
                    class="remove-widget"
                    [attr.data-testid]="'remove-' + widget.configuration.title"
                    (click)="widgetRemoved.emit(widget.id)"
                  >
                    Remove {{ widget.configuration.title }}
                  </button>
                </div>
              }
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
  readonly widgetSelected = output<string>();
  readonly widgetRemoved = output<string>();
  protected readonly narrowScreen = signal(window.innerWidth <= 767);
  readonly #resolvedWidgetIds = signal<ReadonlySet<string>>(new Set());

  private readonly gridElement =
    viewChild.required<ElementRef<HTMLElement>>('grid');
  readonly #destroyRef = inject(DestroyRef);
  readonly #injector = inject(Injector);
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
        handle: '.widget-drag-handle',
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

  protected gridStackWidget(widget: WidgetInstance) {
    return GridStackLayoutAdapter.toGridStackWidget(widget);
  }

  protected isUnavailableWidget(
    widget: WidgetInstance,
  ): widget is UnavailableWidgetInstance {
    return !isKnownWidgetInstance(widget);
  }

  protected isWidgetResolved(id: string): boolean {
    return this.#resolvedWidgetIds().has(id);
  }

  protected widgetResolved(id: string): void {
    this.#resolvedWidgetIds.update((resolvedIds) => {
      const nextResolvedIds = new Set(resolvedIds);
      nextResolvedIds.add(id);
      return nextResolvedIds;
    });
  }
}
