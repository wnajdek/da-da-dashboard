import { Component, input } from '@angular/core';
import { JsonPipe } from '@angular/common';
import {
  emitWidgetConfigurationChanged,
  registerAngularWidget,
} from './public-api';

const DEFINITION = {
  manifestVersion: 2,
  type: 'lifecycle-test',
  displayName: 'Lifecycle test',
  version: '1.0.0',
  elementTag: 'angular-lifecycle-content-widget',
  settingsElementTag: 'angular-lifecycle-settings-widget',
  entryBundleUrl: './main.js',
  defaultConfiguration: { location: 'Cracow' },
  preferredLayout: { w: 4, h: 3 },
} as const;

@Component({
  imports: [JsonPipe],
  template: '<p>{{ configuration() | json }}</p>',
})
class LifecycleComponent {
  readonly configuration = input<unknown>();
}

describe('Angular Widget integration', () => {
  beforeAll(async () => {
    await registerAngularWidget({
      definition: DEFINITION,
      contentComponent: LifecycleComponent,
      settingsComponent: LifecycleComponent,
    });
  });

  afterEach(() => {
    document.body.replaceChildren();
  });

  it('applies configuration before connection, after connection, and after a later host update without recreating its component', async () => {
    const element = document.createElement(DEFINITION.elementTag) as HTMLElement & {
      configuration: unknown;
    };

    element.configuration = { location: 'Before connection' };
    document.body.append(element);
    await waitForText(element, 'Before connection');

    const view = element.querySelector('p');
    element.configuration = { location: 'After connection' };
    await waitForText(element, 'After connection');

    document.body.removeChild(element);
    element.configuration = { location: 'While disconnected' };
    document.body.append(element);
    await waitForText(element, 'While disconnected');
    element.configuration = { location: 'Dashboard update' };
    await waitForText(element, 'Dashboard update');

    expect(element.querySelector('p')).toBe(view);
  });

  for (const collidingTag of [
    DEFINITION.elementTag,
    DEFINITION.settingsElementTag,
  ]) {
    it(`rejects a collision for ${collidingTag} without partially registering the Widget`, async () => {
      const registry = {
        get: (tag: string) =>
          tag === collidingTag ? class extends HTMLElement {} : undefined,
        define: () => fail('A colliding Widget must not partially register.'),
      };

      await expectAsync(
        registerAngularWidget(
          {
            definition: DEFINITION,
            contentComponent: LifecycleComponent,
            settingsComponent: LifecycleComponent,
          },
          registry,
        ),
      ).toBeRejectedWithError('Widget element tags are already registered.');
    });
  }

  it('emits a bubbling complete replacement configuration from a settings Element', () => {
    const parent = document.createElement('div');
    const settingsElement = document.createElement(DEFINITION.settingsElementTag);
    const replacement = { location: 'Gdańsk' };
    const changes: CustomEvent<unknown>[] = [];
    parent.append(settingsElement);
    parent.addEventListener('configuration-changed', (event) =>
      changes.push(event as CustomEvent<unknown>),
    );

    emitWidgetConfigurationChanged(settingsElement, replacement);

    expect(changes).toHaveSize(1);
    expect(changes[0].detail).toEqual(replacement);
  });
});

async function waitForText(element: HTMLElement, text: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const deadline = Date.now() + 1_000;
    const check = () => {
      if (element.textContent?.includes(text)) {
        resolve();
      } else if (Date.now() >= deadline) {
        reject(new Error(`Widget did not render ${text}.`));
      } else {
        setTimeout(check, 10);
      }
    };

    check();
  });
}
