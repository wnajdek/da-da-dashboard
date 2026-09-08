import {
  AfterViewInit,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  effect,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import {
  Dashboard,
  WidgetConfigurationChange,
  WidgetLayoutChange,
} from '../workspace/dashboard.models';
import { BROWSER_VIEWPORT } from './browser-viewport';
import { DASHBOARD_GRID_CONFIG } from './dashboard-grid.config';
import {
  DASHBOARD_GRID,
  GridStackDashboardGrid,
} from './gridstack-dashboard-grid';
import { UnavailableWidgetCardComponent } from '../widget-element-host/unavailable-widget-card.component';
import { WidgetElementComponent } from '../widget-element-host/widget-element.component';
import { WidgetInstallationService } from '../widget-installation/widget-installation.service';

@Component({
  selector: 'app-dashboard-grid',
  imports: [UnavailableWidgetCardComponent, WidgetElementComponent],
  providers: [{ provide: DASHBOARD_GRID, useClass: GridStackDashboardGrid }],
  templateUrl: './dashboard-grid.component.html',
  styleUrl: './dashboard-grid.component.scss',
})
export class DashboardGridComponent implements AfterViewInit {
  readonly dashboard = input.required<Dashboard>();
  readonly layoutCommitted = output<readonly WidgetLayoutChange[]>();
  readonly widgetConfigurationChanged = output<WidgetConfigurationChange>();
  readonly widgetRemoved = output<string>();
  protected readonly narrowScreen = computed(
    () => this.viewport.width() <= DASHBOARD_GRID_CONFIG.narrowScreenBreakpoint,
  );

  private readonly gridElement =
    viewChild.required<ElementRef<HTMLElement>>('grid');
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly installations = inject(WidgetInstallationService);
  private readonly grid = inject(DASHBOARD_GRID);
  private readonly viewport = inject(BROWSER_VIEWPORT);

  constructor() {
    effect(() => {
      this.dashboard();
      afterNextRender(() => this.synchronizeGridItems(), {
        injector: this.injector,
      });
    });
    effect(() => this.grid.setNarrowScreen(this.narrowScreen()));
  }

  ngAfterViewInit(): void {
    this.grid.initialize(this.gridElement().nativeElement, (changes) =>
      this.layoutCommitted.emit(changes),
    );
    this.grid.setNarrowScreen(this.narrowScreen());
    this.destroyRef.onDestroy(() => this.grid.destroy());
  }

  protected installationFor(type: string) {
    return this.installations.installationFor(type);
  }

  private synchronizeGridItems(): void {
    this.grid.synchronize(this.dashboard().widgets);
  }
}
