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
} from '../workspace/dashboard.models';
import { GridStackLayoutAdapter } from './gridstack-layout.adapter';
import { UnavailableWidgetCardComponent } from '../widget-element-host/unavailable-widget-card.component';
import { WidgetElementComponent } from '../widget-element-host/widget-element.component';
import { WidgetRuntimeService } from '../widget-installation/widget-runtime.service';

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
        @let installation = installationFor(widget.type);
        <section
          class="grid-stack-item"
          [attr.gs-id]="gridWidget.id"
          [attr.gs-x]="gridWidget.x"
          [attr.gs-y]="gridWidget.y"
          [attr.gs-w]="gridWidget.w"
          [attr.gs-h]="gridWidget.h"
        >
          <div class="grid-stack-item-content">
            @if (installation; as resolvedInstallation) {
              <app-widget-element
                [installation]="resolvedInstallation"
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
            <div class="widget-controls">
              <button
                type="button"
                class="widget-drag-handle"
                data-testid="move-widget-instance"
                aria-label="Move widget"
              >
                Move
              </button>
              @if (installation) {
                <button
                  type="button"
                  class="remove-widget"
                  data-testid="remove-widget-instance"
                  aria-label="Remove widget"
                  (click)="widgetRemoved.emit(widget.id)"
                >
                  Remove widget
                </button>
              }
            </div>
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
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly runtime = inject(WidgetRuntimeService);
  private grid: GridStack | null = null;

  constructor() {
    effect(() => {
      this.dashboard();
      afterNextRender(() => this.synchronizeGridItems(), {
        injector: this.injector,
      });
    });
  }

  ngAfterViewInit(): void {
    this.grid = GridStack.init(
      {
        column: 12,
        cellHeight: 96,
        margin: 8,
        handle: '.widget-drag-handle',
      },
      this.gridElement().nativeElement,
    );
    this.grid.on('dragstop resizestop', () => this.commitFinalLayout());
    this.updateGridInteractivity();
    this.destroyRef.onDestroy(() => this.grid?.destroy(false));
  }

  @HostListener('window:resize')
  protected updateScreenPresentation(): void {
    const isNarrowScreen = window.innerWidth <= 767;

    if (isNarrowScreen === this.narrowScreen()) {
      return;
    }

    this.narrowScreen.set(isNarrowScreen);
    this.updateGridInteractivity();
  }

  protected gridStackWidget(widget: WidgetInstance) {
    return GridStackLayoutAdapter.toGridStackWidget(widget);
  }

  protected installationFor(type: string) {
    return this.runtime.installationFor(type);
  }

  private synchronizeGridItems(): void {
    const grid = this.grid;

    if (grid === null) {
      return;
    }

    const widgetsById = new Map(
      this.dashboard().widgets.map((widget) => [widget.id, widget]),
    );
    const widgetIds = new Set(widgetsById.keys());

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
      const id =
        node?.id === undefined ? item.getAttribute('gs-id') : String(node.id);
      const widget = id === null ? undefined : widgetsById.get(id);

      if (widget === undefined && node !== undefined) {
        grid.removeWidget(item, false);
      } else if (node === undefined) {
        if (widget !== undefined) {
          grid.makeWidget(
            item,
            GridStackLayoutAdapter.toGridStackWidget(widget),
          );
        }
      } else if (widget !== undefined) {
        grid.update(item, GridStackLayoutAdapter.toGridStackWidget(widget));
      }
    }
  }

  private commitFinalLayout(): void {
    const grid = this.grid;

    if (grid === null) {
      return;
    }

    const changes = grid.engine.nodes
      .map((node: GridStackNode) => GridStackLayoutAdapter.toLayoutChange(node))
      .filter((change): change is WidgetLayoutChange => change !== null);

    this.layoutCommitted.emit(changes);
  }

  private updateGridInteractivity(): void {
    if (this.grid === null) {
      return;
    }

    if (this.narrowScreen()) {
      this.grid.disable();
      return;
    }

    this.grid.enable();
  }
}
