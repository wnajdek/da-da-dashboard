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
});

async function waitForElementRegistration(tag: string): Promise<void> {
  await Promise.race([
    customElements.whenDefined(tag),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${tag} was not registered.`)), 100),
    ),
  ]);
}
