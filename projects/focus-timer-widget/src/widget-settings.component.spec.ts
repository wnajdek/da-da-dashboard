import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { WidgetSettingsComponent } from './widget-settings.component';

describe('WidgetSettingsComponent', () => {
  it('emits a complete validated replacement configuration', async () => {
    await TestBed.configureTestingModule({
      imports: [WidgetSettingsComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
    const fixture = TestBed.createComponent(WidgetSettingsComponent);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const taskInput = host.querySelector<HTMLInputElement>('#task-input');
    const durationInput =
      host.querySelector<HTMLInputElement>('#duration-input');
    const form = host.querySelector<HTMLFormElement>('form');
    const changes: CustomEvent<unknown>[] = [];

    if (taskInput === null || durationInput === null || form === null) {
      throw new Error('Timer settings form is missing.');
    }
    host.addEventListener('configuration-changed', (event) =>
      changes.push(event as CustomEvent<unknown>),
    );
    taskInput.value = 'Write the release notes';
    taskInput.dispatchEvent(new Event('input', { bubbles: true }));
    durationInput.value = '45';
    durationInput.dispatchEvent(new Event('input', { bubbles: true }));
    form.dispatchEvent(
      new SubmitEvent('submit', { bubbles: true, cancelable: true }),
    );

    expect(changes).toHaveSize(1);
    expect(changes[0].detail).toEqual({
      task: 'Write the release notes',
      durationMinutes: 45,
    });
  });
});
