## Agent skills

### Issue tracker

Issues live as local Markdown files under `.scratch/`. See `docs/agents/issue-tracker.md`.

### Domain docs

This is a single-context repository. See `docs/agents/domain.md`.

### Testing
Angular unit tests use Karma with Brave as the Chromium browser.

Run headless tests with:

CHROME_BIN="${CHROME_BIN:-/usr/bin/brave-browser}" \
npx ng test --no-watch --browsers=ChromeHeadless

If ChromeHeadless cannot launch, verify CHROME_BIN and the Brave executable
before concluding that browser tests cannot be run.

## TypeScript conventions

Use the TypeScript `private` keyword for private fields, methods, and accessors.
Do not use ECMAScript `#` private members. Use `protected` for Angular component
members that are referenced only by the component template.
