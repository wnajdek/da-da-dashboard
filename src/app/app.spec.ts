import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DASHBOARD_STORAGE } from './dashboard/workspace/dashboard-persistence.service';
import { MemoryStorage } from './testing/memory-storage';
import { App } from './app';

describe('App', () => {
  it('shows an empty Dashboard before a Widget is installed', async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideZonelessChangeDetection(),
        { provide: DASHBOARD_STORAGE, useValue: new MemoryStorage() },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('My dashboard');
    expect(
      fixture.nativeElement.querySelectorAll('.grid-stack-item'),
    ).toHaveSize(0);
  });
});
