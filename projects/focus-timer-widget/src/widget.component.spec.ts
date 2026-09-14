import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { WidgetComponent } from './widget.component';

describe('WidgetComponent', () => {
  afterEach(() => jasmine.clock().uninstall());

  it('runs and resets a local countdown from its complete configuration', async () => {
    jasmine.clock().install();
    await TestBed.configureTestingModule({
      imports: [WidgetComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
    const fixture = TestBed.createComponent(WidgetComponent);
    fixture.componentRef.setInput('configuration', {
      task: 'Write the release notes',
      durationMinutes: 1,
    });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const startButton = host.querySelector<HTMLButtonElement>('button');

    if (startButton === null) {
      throw new Error('Timer controls are missing.');
    }

    expect(host.textContent).toContain('Write the release notes');
    expect(host.textContent).toContain('01:00');

    startButton.click();
    jasmine.clock().tick(1_000);
    fixture.detectChanges();

    expect(host.textContent).toContain('00:59');
    expect(startButton.textContent).toContain('Pause');

    host
      .querySelector<HTMLButtonElement>('[data-testid="reset-timer"]')
      ?.click();
    fixture.detectChanges();

    expect(host.textContent).toContain('01:00');
    expect(startButton.textContent).toContain('Start');
  });
});
