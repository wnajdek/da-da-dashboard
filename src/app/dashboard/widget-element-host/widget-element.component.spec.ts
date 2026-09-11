import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { WidgetConfiguration } from '../workspace/dashboard.models';
import { WidgetElementLoaderService } from '../widget-installation/widget-element-loader.service';
import type { WidgetInstallation } from '../widget-installation/widget-installation.models';
import { WidgetElementComponent } from './widget-element.component';

const INSTALLATION: WidgetInstallation = {
  manifestUrl: 'https://widgets.example.test/host/manifest.json',
  manifestVersion: 2,
  type: 'host-widget',
  displayName: 'Host Widget',
  version: '1.0.0',
  elementTag: 'host-lifecycle-widget',
  settingsElementTag: 'host-lifecycle-widget-settings',
  entryBundleUrl: 'https://widgets.example.test/host/entry.js',
  defaultConfiguration: { location: 'Warsaw' },
  preferredLayout: { w: 4, h: 3 },
};

const THROWING_INSTALLATION: WidgetInstallation = {
  ...INSTALLATION,
  type: 'throwing-host-widget',
  elementTag: 'throwing-host-lifecycle-widget',
};

describe('WidgetElementComponent', () => {
  beforeAll(() => {
    if (customElements.get(INSTALLATION.elementTag) === undefined) {
      customElements.define(INSTALLATION.elementTag, LifecycleWidgetElement);
    }

    if (customElements.get(THROWING_INSTALLATION.elementTag) === undefined) {
      customElements.define(
        THROWING_INSTALLATION.elementTag,
        ThrowingConfigurationWidgetElement,
      );
    }
  });

  it('emits each valid configuration replacement once and updates its mounted element in place', async () => {
    const fixture = await createFixture(INSTALLATION);
    const changes: unknown[] = [];
    fixture.componentInstance.changed.subscribe((change) =>
      changes.push(change),
    );
    await renderMountedElement(fixture);

    const element = getWidgetElement(fixture);
    const initialConfiguration = { location: 'Warsaw' };
    const replacementConfiguration = { location: 'Kraków' };

    expect(element.assignments).toEqual([initialConfiguration]);

    element.dispatchEvent(
      new CustomEvent('configuration-changed', {
        bubbles: true,
        detail: replacementConfiguration,
      }),
    );

    expect(changes).toEqual([
      { id: 'widget-id', configuration: replacementConfiguration },
    ]);

    fixture.componentRef.setInput('configuration', replacementConfiguration);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(getWidgetElement(fixture)).toBe(element);
    expect(element.assignments).toEqual([
      initialConfiguration,
      replacementConfiguration,
    ]);
  });

  it('keeps an asynchronously loaded Widget Element mounted after the ready state renders', async () => {
    let finishLoading: (() => void) | undefined;
    const fixture = await createFixture(INSTALLATION, {
      load: () =>
        new Promise<void>((resolve) => {
          finishLoading = resolve;
        }),
    });
    await fixture.whenStable();

    if (finishLoading === undefined) {
      throw new Error('The Widget Element load did not begin.');
    }

    finishLoading();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(getWidgetElement(fixture)).not.toBeNull();
  });

  it('ignores malformed and throwing configuration-change event details', async () => {
    const fixture = await createFixture(INSTALLATION);
    const changes: unknown[] = [];
    fixture.componentInstance.changed.subscribe((change) =>
      changes.push(change),
    );
    await renderMountedElement(fixture);
    const element = getWidgetElement(fixture);
    const malformedEvent = new Event('configuration-changed');
    Object.defineProperty(malformedEvent, 'detail', {
      get: () => {
        throw new Error('unreadable event detail');
      },
    });

    element.dispatchEvent(
      new CustomEvent('configuration-changed', {
        bubbles: true,
        detail: ['not an object'],
      }),
    );
    element.dispatchEvent(malformedEvent);

    expect(changes).toEqual([]);
    expect(getWidgetElement(fixture)).toBe(element);
    expect(JSON.stringify(element.assignments)).toBe('[{"location":"Warsaw"}]');
  });

  it('contains a configuration update failure as an unavailable Widget', async () => {
    const fixture = await createFixture(THROWING_INSTALLATION);
    const unavailable = jasmine.createSpy('unavailable');
    fixture.componentInstance.unavailable.subscribe(unavailable);

    await renderMountedElement(fixture);
    fixture.componentRef.setInput('configuration', { location: 'Kraków' });
    fixture.detectChanges();
    await fixture.whenStable();

    expect(
      fixture.nativeElement.querySelector('[data-testid="unavailable-widget"]'),
    ).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector(THROWING_INSTALLATION.elementTag),
    ).toBeNull();
    expect(unavailable).toHaveBeenCalledTimes(1);
  });

  it('keeps a superseding Widget Element mounted and cleans up the previous listener', async () => {
    let resolveSupersededLoad: (() => void) | undefined;
    const supersededInstallation = {
      ...INSTALLATION,
      entryBundleUrl: 'https://widgets.example.test/host/superseded.js',
    };
    const replacementInstallation = {
      ...INSTALLATION,
      entryBundleUrl: 'https://widgets.example.test/host/replacement.js',
    };
    const fixture = await createFixture(INSTALLATION);
    const elementLoader = fixture.debugElement.injector.get(
      WidgetElementLoaderService,
    );
    const load = spyOn(elementLoader, 'load').and.callFake((installation) => {
      if (installation === supersededInstallation) {
        return new Promise<void>((resolve) => {
          resolveSupersededLoad = resolve;
        });
      }

      return Promise.resolve();
    });
    const changes: unknown[] = [];
    fixture.componentInstance.changed.subscribe((change) =>
      changes.push(change),
    );
    await renderMountedElement(fixture);
    const previousElement = getWidgetElement(fixture);
    fixture.componentRef.setInput('installation', supersededInstallation);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentRef.setInput('installation', replacementInstallation);
    fixture.detectChanges();
    await fixture.whenStable();

    if (resolveSupersededLoad === undefined) {
      throw new Error('The superseded Widget Element load did not begin.');
    }

    resolveSupersededLoad();
    await fixture.whenStable();
    await renderMountedElement(fixture);

    previousElement.dispatchEvent(
      new CustomEvent('configuration-changed', {
        bubbles: true,
        detail: { stale: true },
      }),
    );

    expect(getWidgetElement(fixture)).not.toBe(previousElement);
    expect(changes).toEqual([]);
    expect(load).toHaveBeenCalledWith(replacementInstallation);
  });

  it('does not attach a pending Widget Element after component destruction', async () => {
    let resolvePendingLoad: (() => void) | undefined;
    const pendingInstallation = {
      ...INSTALLATION,
      entryBundleUrl: 'https://widgets.example.test/host/pending.js',
    };
    const fixture = await createFixture(INSTALLATION);
    const elementLoader = fixture.debugElement.injector.get(
      WidgetElementLoaderService,
    );
    spyOn(elementLoader, 'load').and.callFake((installation) => {
      if (installation === pendingInstallation) {
        return new Promise<void>((resolve) => {
          resolvePendingLoad = resolve;
        });
      }

      return Promise.resolve();
    });
    const changes: unknown[] = [];
    fixture.componentInstance.changed.subscribe((change) =>
      changes.push(change),
    );
    await renderMountedElement(fixture);
    const previousElement = getWidgetElement(fixture);
    fixture.componentRef.setInput('installation', pendingInstallation);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.destroy();

    if (resolvePendingLoad === undefined) {
      throw new Error('The pending Widget Element load did not begin.');
    }

    resolvePendingLoad();
    await fixture.whenStable();
    previousElement.dispatchEvent(
      new CustomEvent('configuration-changed', {
        bubbles: true,
        detail: { stale: true },
      }),
    );

    expect(
      fixture.nativeElement.querySelector(INSTALLATION.elementTag),
    ).toBeNull();
    expect(changes).toEqual([]);
  });
});

class LifecycleWidgetElement extends HTMLElement {
  readonly assignments: WidgetConfiguration[] = [];

  set configuration(value: WidgetConfiguration) {
    this.assignments.push(value);
  }
}

class ThrowingConfigurationWidgetElement extends HTMLElement {
  private hasConfiguration = false;

  set configuration(_value: WidgetConfiguration) {
    if (this.hasConfiguration) {
      throw new Error('configuration rejected');
    }

    this.hasConfiguration = true;
  }
}

async function createFixture(
  installation: WidgetInstallation,
  loader: Pick<WidgetElementLoaderService, 'load'> = {
    load: async () => undefined,
  },
): Promise<ComponentFixture<WidgetElementComponent>> {
  TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection()],
  });
  TestBed.overrideComponent(WidgetElementComponent, {
    add: {
      providers: [{ provide: WidgetElementLoaderService, useValue: loader }],
    },
  });
  const fixture = TestBed.createComponent(WidgetElementComponent);
  fixture.componentRef.setInput('installation', installation);
  fixture.componentRef.setInput('widgetId', 'widget-id');
  fixture.componentRef.setInput('configuration', { location: 'Warsaw' });
  fixture.detectChanges();

  return fixture;
}

async function renderMountedElement(
  fixture: ComponentFixture<WidgetElementComponent>,
): Promise<void> {
  for (let render = 0; render < 3; render += 1) {
    await fixture.whenStable();
    fixture.detectChanges();
  }
}

function getWidgetElement(
  fixture: ComponentFixture<WidgetElementComponent>,
): LifecycleWidgetElement {
  const host = fixture.nativeElement as HTMLElement;
  const element = host.querySelector<LifecycleWidgetElement>(
    INSTALLATION.elementTag,
  );

  if (element === null) {
    throw new Error('The Widget Element did not mount.');
  }

  return element;
}
