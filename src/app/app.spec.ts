import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DASHBOARD_STORAGE } from './dashboard/dashboard-persistence.service';
import { MemoryStorage } from './testing/memory-storage';
import { App } from './app';

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
    expect(compiled.textContent).toContain('Jan–Apr · steady growth');
    expect(compiled.textContent).toContain('Team notes');
    expect(compiled.textContent).toContain(
      'Review monthly progress with the team on Friday.',
    );
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
    expect(
      JSON.parse(storage.getItem('configurable-dashboard.snapshot')!).dashboard
        .widgets,
    ).toHaveSize(6);

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
