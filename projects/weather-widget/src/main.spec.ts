describe('weather widget entry bundle', () => {
  it('registers both v2 manifest elements with a configuration property', async () => {
    await import('./main');
    await waitForElementRegistration('sample-weather-widget');
    await waitForElementRegistration('sample-weather-widget-settings');

    for (const tag of [
      'sample-weather-widget',
      'sample-weather-widget-settings',
    ]) {
      const element = document.createElement(tag) as HTMLElement & {
        configuration: unknown;
      };
      const configuration = { location: 'Cracow', units: 'metric' };

      element.configuration = configuration;

      expect(element.configuration).toEqual(configuration);
    }
  });

  it('rejects a tag collision instead of combining elements from different bundles', async () => {
    const { registerWeatherWidget } = await import('./main');
    const registry = {
      get: (tag: string) =>
        tag === 'sample-weather-widget'
          ? class extends HTMLElement {}
          : undefined,
      define: () =>
        fail('The entry bundle must not define a tag after a collision.'),
    };

    await expectAsync(registerWeatherWidget(registry)).toBeRejectedWithError(
      'Weather widget element tags are already registered.',
    );
  });
});

async function waitForElementRegistration(tag: string): Promise<void> {
  await Promise.race([
    customElements.whenDefined(tag),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${tag} was not registered.`)), 100),
    ),
  ]);
}
