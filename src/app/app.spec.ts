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
