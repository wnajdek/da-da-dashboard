import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DASHBOARD_STORAGE } from './dashboard/dashboard-persistence.service';
import { MemoryStorage } from './testing/memory-storage';
import { App } from './app';

async function waitForChartRender(
  fixture: ComponentFixture<App>,
): Promise<void> {
  await fixture.whenStable();
  await new Promise<void>((resolve) => window.setTimeout(resolve));
  fixture.detectChanges();
}

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideZonelessChangeDetection(),
        { provide: DASHBOARD_STORAGE, useValue: new MemoryStorage() },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('shows the seeded dashboard with each supported widget type', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('h1')?.textContent).toContain('My dashboard');
    expect(compiled.textContent).toContain('Monthly revenue');
    expect(compiled.textContent).toContain('$124,500');
    expect(compiled.textContent).toContain('Revenue trend');
    expect(
      compiled
        .querySelector('[data-testid="time-series-chart"]')
        ?.getAttribute('aria-label'),
    ).toBe('Revenue trend chart, January to April: $94k, $101k, $109k, $117k');
    expect(compiled.textContent).toContain('Team notes');
    expect(compiled.textContent).toContain(
      'Review monthly progress with the team on Friday.',
    );
  });

  it('renders the Time-Series Widget as an ECharts canvas', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await waitForChartRender(fixture);

    expect(
      fixture.nativeElement.querySelector(
        '[data-testid="time-series-chart"] canvas',
      ),
    ).not.toBeNull();
  });

  it('gives every Widget Instance a dedicated drag handle outside its content', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const widgets = [...compiled.querySelectorAll('.grid-stack-item')];

    expect(widgets).toHaveSize(3);
    expect(
      widgets.every(
        (widget) =>
          widget.querySelector('.widget-drag-handle') !== null &&
          widget.querySelector('.widget-content .widget-drag-handle') === null,
      ),
    ).toBeTrue();
  });

  it('presents Widgets in one column on a narrow screen without changing their desktop Grid Layout', () => {
    const storage = new MemoryStorage();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideZonelessChangeDetection(),
        { provide: DASHBOARD_STORAGE, useValue: storage },
      ],
    });
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const originalInnerWidth = Object.getOwnPropertyDescriptor(
      window,
      'innerWidth',
    );
    const savedLayouts = JSON.parse(
      storage.getItem('configurable-dashboard.snapshot')!,
    ).dashboard.widgets.map((widget: { layout: unknown }) => widget.layout);

    try {
      Object.defineProperty(window, 'innerWidth', {
        configurable: true,
        value: 600,
      });
      window.dispatchEvent(new Event('resize'));
      fixture.detectChanges();

      const cards = [...compiled.querySelectorAll<HTMLElement>('.widget-card')];

      expect(cards).toHaveSize(3);
      const cardBounds = cards.map((card) => card.getBoundingClientRect());
      expect(
        cardBounds
          .slice(1)
          .every((card, index) => card.top >= cardBounds[index].bottom),
      ).toBeTrue();
      expect(
        JSON.parse(
          storage.getItem('configurable-dashboard.snapshot')!,
        ).dashboard.widgets.map((widget: { layout: unknown }) => widget.layout),
      ).toEqual(savedLayouts);

      Object.defineProperty(window, 'innerWidth', {
        configurable: true,
        value: 1_024,
      });
      window.dispatchEvent(new Event('resize'));
      fixture.detectChanges();

      expect(
        JSON.parse(
          storage.getItem('configurable-dashboard.snapshot')!,
        ).dashboard.widgets.map((widget: { layout: unknown }) => widget.layout),
      ).toEqual(savedLayouts);
    } finally {
      if (originalInnerWidth !== undefined) {
        Object.defineProperty(window, 'innerWidth', originalInnerWidth);
      }
    }
  });

  it('adds the chosen built-in Widget Instance and persists it', () => {
    const storage = new MemoryStorage();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideZonelessChangeDetection(),
        { provide: DASHBOARD_STORAGE, useValue: storage },
      ],
    });
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const widgetTypeSelect = compiled.querySelector(
      '#widget-type',
    ) as HTMLSelectElement;

    expect([...widgetTypeSelect.options].map((option) => option.text)).toEqual([
      'KPI',
      'Time series',
      'Notes',
    ]);

    for (const widgetType of ['kpi', 'time-series', 'notes'] as const) {
      widgetTypeSelect.value = widgetType;
      widgetTypeSelect.dispatchEvent(new Event('change'));
      (
        compiled.querySelector(
          '[data-testid="add-widget"]',
        ) as HTMLButtonElement
      ).click();
      fixture.detectChanges();
    }

    expect(compiled.querySelectorAll('.widget-card').length).toBe(6);
    expect(compiled.textContent).toContain('New note');
    const addedWidgets = JSON.parse(
      storage.getItem('configurable-dashboard.snapshot')!,
    ).dashboard.widgets.slice(3);

    expect(addedWidgets).toEqual([
      jasmine.objectContaining({
        type: 'kpi',
        layout: { x: 0, y: 3, w: 3, h: 2 },
        configuration: {
          title: 'Monthly revenue',
          dataSource: 'monthly-revenue',
          displayFormat: 'currency',
        },
      }),
      jasmine.objectContaining({
        type: 'time-series',
        layout: { x: 0, y: 5, w: 3, h: 2 },
        configuration: {
          title: 'Revenue trend',
          dataSource: 'monthly-revenue-trend',
        },
      }),
      jasmine.objectContaining({
        type: 'notes',
        layout: { x: 0, y: 7, w: 3, h: 2 },
        configuration: {
          title: 'New note',
          body: 'Add your notes here.',
        },
      }),
    ]);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideZonelessChangeDetection(),
        { provide: DASHBOARD_STORAGE, useValue: storage },
      ],
    });
    const reloadedFixture = TestBed.createComponent(App);
    reloadedFixture.detectChanges();

    expect(
      reloadedFixture.nativeElement.querySelectorAll('.widget-card').length,
    ).toBe(6);
  });

  it('removes a Widget Instance and restores it with undo', () => {
    const storage = new MemoryStorage();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideZonelessChangeDetection(),
        { provide: DASHBOARD_STORAGE, useValue: storage },
      ],
    });
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    (
      compiled.querySelector(
        '[data-testid="remove-Team notes"]',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();

    expect(compiled.textContent).not.toContain('Team notes');
    expect(
      compiled.querySelector('[data-testid="undo-removal"]'),
    ).not.toBeNull();
    expect(
      JSON.parse(storage.getItem('configurable-dashboard.snapshot')!).dashboard
        .widgets,
    ).toHaveSize(2);

    (
      compiled.querySelector(
        '[data-testid="undo-removal"]',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();

    expect(compiled.textContent).toContain('Team notes');
    expect(compiled.querySelectorAll('.widget-card')).toHaveSize(3);
    expect(
      JSON.parse(storage.getItem('configurable-dashboard.snapshot')!).dashboard
        .widgets,
    ).toHaveSize(3);
  });

  it('refreshes the visible KPI and Time-Series Widget data', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const widgetTypeSelect = compiled.querySelector(
      '#widget-type',
    ) as HTMLSelectElement;

    for (const widgetType of ['kpi', 'time-series'] as const) {
      widgetTypeSelect.value = widgetType;
      widgetTypeSelect.dispatchEvent(new Event('change'));
      (
        compiled.querySelector(
          '[data-testid="add-widget"]',
        ) as HTMLButtonElement
      ).click();
      fixture.detectChanges();
    }

    (
      compiled.querySelector(
        '[data-testid="refresh-dashboard"]',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    await waitForChartRender(fixture);

    expect(compiled.textContent).toContain('$127,000');
    expect([...compiled.querySelectorAll('.kpi-value')]).toHaveSize(2);
    expect(
      [...compiled.querySelectorAll('.kpi-value')].every((value) =>
        value.textContent?.includes('$127,000'),
      ),
    ).toBeTrue();
    expect([
      ...compiled.querySelectorAll('[data-testid="time-series-chart"]'),
    ]).toHaveSize(2);
    expect(
      [...compiled.querySelectorAll('[data-testid="time-series-chart"]')].every(
        (chart) =>
          chart.getAttribute('aria-label') ===
          'Revenue trend chart, January to April: $96k, $103k, $111k, $119k',
      ),
    ).toBeTrue();
    expect(
      [...compiled.querySelectorAll('[data-testid="time-series-chart"]')].every(
        (chart) => chart.querySelector('canvas') !== null,
      ),
    ).toBeTrue();
  });

  it('edits a selected Notes Widget Instance and restores it after reload', () => {
    const storage = new MemoryStorage();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideZonelessChangeDetection(),
        { provide: DASHBOARD_STORAGE, useValue: storage },
      ],
    });
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    (
      compiled.querySelector(
        '[data-testid="edit-Team notes"]',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    const title = compiled.querySelector('#notes-title') as HTMLInputElement;
    title.value = 'Friday plan';
    title.dispatchEvent(new Event('input'));
    (
      compiled.querySelector('[data-testid="save-widget"]') as HTMLButtonElement
    ).click();
    fixture.detectChanges();

    expect(compiled.textContent).toContain('Friday plan');

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideZonelessChangeDetection(),
        { provide: DASHBOARD_STORAGE, useValue: storage },
      ],
    });
    const reloadedFixture = TestBed.createComponent(App);
    reloadedFixture.detectChanges();

    expect(reloadedFixture.nativeElement.textContent).toContain('Friday plan');
  });

  it('shows only the selected Widget Type fields in the editor', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    (
      compiled.querySelector(
        '[data-testid="edit-Monthly revenue"]',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    expect(compiled.querySelector('#kpi-data-source')).not.toBeNull();
    expect(compiled.querySelector('#kpi-display-format')).not.toBeNull();
    expect(compiled.querySelector('#notes-body')).toBeNull();

    (
      compiled.querySelector('[aria-label="Close editor"]') as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    (
      compiled.querySelector(
        '[data-testid="edit-Revenue trend"]',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    expect(compiled.querySelector('#time-series-data-source')).not.toBeNull();
    expect(compiled.querySelector('#kpi-display-format')).toBeNull();
    expect(compiled.querySelector('#notes-body')).toBeNull();

    (
      compiled.querySelector('[aria-label="Close editor"]') as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    (
      compiled.querySelector(
        '[data-testid="edit-Team notes"]',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    expect(compiled.querySelector('#notes-body')).not.toBeNull();
    expect(compiled.querySelector('#notes-title')).not.toBeNull();
    expect(compiled.querySelector('#kpi-data-source')).toBeNull();
  });

  it('shows validation errors and keeps invalid Widget Configuration out of the Dashboard', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    (
      compiled.querySelector(
        '[data-testid="edit-Team notes"]',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    const title = compiled.querySelector('#notes-title') as HTMLInputElement;
    title.value = '';
    title.dispatchEvent(new Event('input'));
    (
      compiled.querySelector('[data-testid="save-widget"]') as HTMLButtonElement
    ).click();
    fixture.detectChanges();

    expect(compiled.textContent).toContain(
      'A title of up to 60 characters is required.',
    );
    expect(compiled.querySelectorAll('.widget-card')[2].textContent).toContain(
      'Team notes',
    );

    title.value = 'Team notes';
    title.dispatchEvent(new Event('input'));
    const body = compiled.querySelector('#notes-body') as HTMLTextAreaElement;
    body.value = 'x'.repeat(1_001);
    body.dispatchEvent(new Event('input'));
    (
      compiled.querySelector('[data-testid="save-widget"]') as HTMLButtonElement
    ).click();
    fixture.detectChanges();

    expect(compiled.textContent).toContain(
      'Notes can contain up to 1,000 characters.',
    );
  });

  it('shows recovery and lets the user explicitly reset invalid saved data', () => {
    TestBed.resetTestingModule();
    const storage = new MemoryStorage();
    storage.setItem('configurable-dashboard.snapshot', 'not JSON');
    TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideZonelessChangeDetection(),
        { provide: DASHBOARD_STORAGE, useValue: storage },
      ],
    });
    const fixture = TestBed.createComponent(App);

    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'The saved Dashboard could not be read.',
    );

    (
      fixture.nativeElement.querySelector('button') as HTMLButtonElement
    ).click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain(
      'My dashboard',
    );
  });
});
