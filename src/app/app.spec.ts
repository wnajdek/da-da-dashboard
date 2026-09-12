import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideWidgetInstallationPersistence } from './dashboard/widget-installation/widget-installation-persistence.service';
import { DASHBOARD_STORAGE } from './dashboard/workspace/dashboard-persistence.service';
import { MemoryStorage } from './testing/memory-storage';
import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
  it('shows an empty Dashboard before a Widget is installed', async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter(routes),
        { provide: DASHBOARD_STORAGE, useValue: new MemoryStorage() },
        provideWidgetInstallationPersistence(),
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl('/');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('My dashboard');
    expect(
      fixture.nativeElement.querySelectorAll('.grid-stack-item'),
    ).toHaveSize(0);
  });
});
