import { access, readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { relative, resolve, sep } from "node:path";
import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";
import {
  SUPPORTED_WIDGET_MANIFEST_VERSION,
  isRecord,
  isJsonObject,
  validateWidgetManifest,
} from "@da-da/widget-contract";

const MANIFEST_FILE_NAME = "widget-manifest.json";
const BROWSER_TIMEOUT_MS = 25_000;

/**
 * Check the static files a host will receive, rather than trusting a successful
 * Angular compilation. It verifies both Manifest metadata and runtime browser
 * behavior at the Custom Element boundary.
 */
export async function inspectBuildOutput(outputDirectory) {
  const resolvedOutputDirectory = resolve(outputDirectory);
  const manifestPath = resolve(resolvedOutputDirectory, MANIFEST_FILE_NAME);
  const manifest = await readManifest(manifestPath);

  if (!isRecord(manifest)) {
    throw new Error(
      'Manifest field "root" violates the version-two Widget contract (invalid).',
    );
  }

  if (manifest.manifestVersion !== SUPPORTED_WIDGET_MANIFEST_VERSION) {
    throw new Error(
      `Manifest field "manifestVersion" violates the version-two Widget contract; expected ${SUPPORTED_WIDGET_MANIFEST_VERSION}.`,
    );
  }

  const validation = validateWidgetManifest(
    manifest,
    "https://widget-author.invalid/widget-manifest.json",
  );

  if (validation.status !== "valid") {
    throw new Error(
      `Manifest field "${
        validation.reason === "untrusted-entry-bundle"
          ? "entryBundleUrl"
          : invalidManifestField(manifest)
      }" violates the version-two Widget contract (${validation.reason}).`,
    );
  }

  const entryBundlePath = resolve(
    resolvedOutputDirectory,
    manifest.entryBundleUrl,
  );

  if (!isWithinDirectory(entryBundlePath, resolvedOutputDirectory)) {
    throw new Error(
      'Manifest field "entryBundleUrl" must refer to a bundle within the build output directory.',
    );
  }

  try {
    await access(entryBundlePath);
  } catch {
    throw new Error(
      `Manifest field "entryBundleUrl" declares "${manifest.entryBundleUrl}", but that bundle is absent from the production output.`,
    );
  }

  return {
    outputDirectory: resolvedOutputDirectory,
    manifest,
    manifestPath,
    entryBundlePath,
  };
}

export async function checkBuiltWidget(outputDirectory, browserPath) {
  const build = await inspectBuildOutput(outputDirectory);
  const server = await serveBuildOutput(build.outputDirectory, build.manifest);

  try {
    const result = await runHeadlessBrowser(
      browserPath,
      `${server.url}/_conformance/check.html`,
    );

    if (result.status !== "passed") {
      throw new Error(result.diagnostic);
    }

    // Registration must be all-or-nothing: a collision on either tag cannot
    // leave a Dashboard with only one half of this Widget available.
    for (const tag of [
      build.manifest.elementTag,
      build.manifest.settingsElementTag,
    ]) {
      const collisionResult = await runHeadlessBrowser(
        browserPath,
        `${server.url}/_conformance/collision.html?tag=${encodeURIComponent(tag)}`,
      );

      if (collisionResult.status !== "passed") {
        throw new Error(collisionResult.diagnostic);
      }
    }
  } finally {
    await server.close();
  }

  return build;
}

async function readManifest(manifestPath) {
  let source;

  try {
    source = await readFile(manifestPath, "utf8");
  } catch {
    throw new Error(
      `Production output is missing ${MANIFEST_FILE_NAME}. Run the Widget build before checking it.`,
    );
  }

  try {
    return JSON.parse(source);
  } catch {
    throw new Error(`Production ${MANIFEST_FILE_NAME} is not valid JSON.`);
  }
}

function isWithinDirectory(path, directory) {
  const pathFromDirectory = relative(directory, path);
  return (
    pathFromDirectory !== "" &&
    !pathFromDirectory.startsWith(`..${sep}`) &&
    pathFromDirectory !== ".."
  );
}

function invalidManifestField(manifest) {
  if (
    manifest === null ||
    typeof manifest !== "object" ||
    Array.isArray(manifest)
  ) {
    return "root";
  }

  const fields = [
    "type",
    "displayName",
    "version",
    "elementTag",
    "settingsElementTag",
    "entryBundleUrl",
  ];

  for (const field of fields) {
    if (typeof manifest[field] !== "string" || manifest[field].trim() === "") {
      return field;
    }
  }

  if (manifest["elementTag"] === manifest["settingsElementTag"]) {
    return "settingsElementTag";
  }

  if (!isCustomElementTag(manifest["elementTag"])) {
    return "elementTag";
  }

  if (!isCustomElementTag(manifest["settingsElementTag"])) {
    return "settingsElementTag";
  }

  if (!isJsonObject(manifest["defaultConfiguration"])) {
    return "defaultConfiguration";
  }

  const layout = manifest["preferredLayout"];

  if (
    layout === null ||
    typeof layout !== "object" ||
    Array.isArray(layout) ||
    typeof layout["w"] !== "number" ||
    typeof layout["h"] !== "number"
  ) {
    return "preferredLayout";
  }

  return "root";
}

function isCustomElementTag(value) {
  return /^[a-z][.0-9_a-z]*-[.0-9_a-z-]*$/.test(value);
}

async function serveBuildOutput(outputDirectory, manifest) {
  let serverUrl = null;
  const server = createServer(async (request, response) => {
    const requestUrl = new URL(request.url ?? "/", "http://localhost");
    // The built Manifest has a relative bundle URL. The conformance page needs
    // an absolute URL because it is generated under a private test route.
    const browserManifest = {
      ...manifest,
      entryBundleUrl: new URL(
        manifest.entryBundleUrl,
        `${serverUrl}/widget-manifest.json`,
      ).href,
    };

    if (requestUrl.pathname === "/_conformance/check.html") {
      respondHtml(response, createCheckPage(browserManifest));
      return;
    }

    if (requestUrl.pathname === "/_conformance/collision.html") {
      const collisionTag = requestUrl.searchParams.get("tag");
      respondHtml(
        response,
        createCollisionPage(
          browserManifest,
          collisionTag === browserManifest.settingsElementTag
            ? browserManifest.settingsElementTag
            : browserManifest.elementTag,
        ),
      );
      return;
    }

    const filePath = resolve(
      outputDirectory,
      `.${decodeURIComponent(requestUrl.pathname)}`,
    );

    if (!isWithinDirectory(filePath, outputDirectory)) {
      response.writeHead(403).end();
      return;
    }

    try {
      const body = await readFile(filePath);
      response.writeHead(200, {
        "content-type": contentType(filePath),
        "access-control-allow-origin": "*",
      });
      response.end(body);
    } catch {
      response.writeHead(404).end();
    }
  });

  await new Promise((resolveServer, rejectServer) => {
    server.once("error", rejectServer);
    server.listen(0, "127.0.0.1", resolveServer);
  });

  const address = server.address();

  if (address === null || typeof address === "string") {
    await closeServer(server);
    throw new Error("Could not start a local server for browser conformance.");
  }

  serverUrl = `http://127.0.0.1:${address.port}`;

  return {
    url: serverUrl,
    close: () => closeServer(server),
  };
}

function respondHtml(response, body) {
  response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  response.end(body);
}

function contentType(filePath) {
  return filePath.endsWith(".js")
    ? "text/javascript; charset=utf-8"
    : filePath.endsWith(".json")
      ? "application/json; charset=utf-8"
      : "application/octet-stream";
}

function closeServer(server) {
  return new Promise((resolveServer, rejectServer) => {
    server.closeAllConnections();
    server.close((error) =>
      error === undefined ? resolveServer() : rejectServer(error),
    );
  });
}

function createCheckPage(manifest) {
  return `<!doctype html><body><pre id="result">running</pre><script type="module">
    const manifest = ${JSON.stringify(manifest)};
    const result = document.querySelector('#result');
    const declaredTags = [manifest.elementTag, manifest.settingsElementTag];
    const definitions = [];
    const originalDefine = customElements.define.bind(customElements);
    let stage = 'importing the entry bundle';
    // Observe tags registered by the entry bundle so the Manifest cannot claim
    // tags that differ from the ones the browser actually receives.
    customElements.define = (tag, constructor, options) => {
      definitions.push(tag);
      return originalDefine(tag, constructor, options);
    };

    try {
      await Promise.race([
        verifyContract(),
        verificationTimeout(),
      ]);
      result.textContent = JSON.stringify({ status: 'passed' });
    } catch (error) {
      result.textContent = JSON.stringify({
        status: 'failed',
        diagnostic: error instanceof Error ? error.message : String(error),
      });
    }

    async function verifyContract() {
      await loadEntryBundle(manifest.entryBundleUrl);
      stage = 'waiting for declared Element tags';
      await Promise.all(declaredTags.map((tag) => customElements.whenDefined(tag)));
      stage = 'checking declared Element tags';
      assertSameTags(definitions, declaredTags);
      stage = 'checking content Element configuration';
      await assertConfigurationAssignment(manifest.elementTag);
      stage = 'checking settings Element configuration';
      await assertConfigurationAssignment(manifest.settingsElementTag);
      stage = 'checking settings configuration-change event';
      await assertSettingsEvent(manifest.settingsElementTag);
    }

    function assertSameTags(actual, expected) {
      if (actual.length !== expected.length || actual.some((tag) => !expected.includes(tag))) {
        throw new Error('Entry bundle registered Element tags ' + JSON.stringify(actual) +
          ', but Manifest fields "elementTag" and "settingsElementTag" declare ' + JSON.stringify(expected) + '.');
      }
    }

    async function assertConfigurationAssignment(tag) {
      // A host may configure an Element before or after it connects to the DOM.
      // Both timings are part of the browser contract.
      const beforeConnection = document.createElement(tag);
      const beforeValue = { phase: 'before-connection' };
      beforeConnection.configuration = beforeValue;
      document.body.append(beforeConnection);
      await nextTask();
      assertConfigurationValue(tag, beforeConnection, beforeValue, 'before connection');

      const afterValue = { phase: 'after-connection' };
      beforeConnection.configuration = afterValue;
      await nextTask();
      assertConfigurationValue(tag, beforeConnection, afterValue, 'after connection');
      beforeConnection.remove();
    }

    function assertConfigurationValue(tag, element, expected, phase) {
      if (!areJsonValuesEqual(element.configuration, expected)) {
        throw new Error('Element tag "' + tag + '" does not retain configuration assigned ' + phase + '.');
      }
    }

    async function assertSettingsEvent(tag) {
      // The event is listened for on the page body, proving it bubbles out of the
      // Settings Element as the Dashboard requires.
      const settings = document.createElement(tag);
      settings.configuration = manifest.defaultConfiguration;
      document.body.append(settings);
      await waitFor(() => settings.querySelector('button') !== null);

      const eventPromise = new Promise((resolveEvent) => {
        document.body.addEventListener('configuration-changed', resolveEvent, { once: true });
      });
      settings.querySelector('button').click();
      const event = await Promise.race([eventPromise, timeout('Element tag "' + tag + '" did not emit a bubbling configuration-changed event.')]);

      if (!isJsonSafeObject(event.detail)) {
        throw new Error('Element tag "' + tag + '" emitted configuration-changed with non-object or non-JSON-safe detail.');
      }
      if (!areJsonValuesEqual(event.detail, manifest.defaultConfiguration)) {
        throw new Error('Element tag "' + tag + '" emitted configuration-changed without a complete replacement configuration.');
      }
      settings.remove();
    }

    function isJsonSafeObject(value, ancestors = new Set()) {
      if (
        value === null ||
        Array.isArray(value) ||
        typeof value !== 'object' ||
        (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) ||
        ancestors.has(value)
      ) return false;
      ancestors.add(value);
      const valid = Object.values(value).every((item) => isJsonSafeValue(item, ancestors));
      ancestors.delete(value);
      return valid;
    }

    function isJsonSafeValue(value, ancestors) {
      if (value === null || typeof value === 'string' || typeof value === 'boolean') return true;
      if (typeof value === 'number') return Number.isFinite(value);
      if (Array.isArray(value)) {
        if (ancestors.has(value)) return false;
        ancestors.add(value);
        const valid = value.every((item) => isJsonSafeValue(item, ancestors));
        ancestors.delete(value);
        return valid;
      }
      return isJsonSafeObject(value, ancestors);
    }

    function areJsonValuesEqual(left, right) {
      if (Object.is(left, right)) return true;
      if (Array.isArray(left) && Array.isArray(right)) {
        return left.length === right.length && left.every((item, index) => areJsonValuesEqual(item, right[index]));
      }
      if (
        left !== null && right !== null &&
        typeof left === 'object' && typeof right === 'object' &&
        !Array.isArray(left) && !Array.isArray(right)
      ) {
        const leftKeys = Object.keys(left);
        const rightKeys = Object.keys(right);
        return leftKeys.length === rightKeys.length && leftKeys.every((key) =>
          Object.hasOwn(right, key) && areJsonValuesEqual(left[key], right[key]),
        );
      }
      return false;
    }

    function nextTask() { return new Promise((resolveTask) => setTimeout(resolveTask, 0)); }
    function loadEntryBundle(url) {
      return new Promise((resolveLoad, rejectLoad) => {
        const script = document.createElement('script');
        script.type = 'module';
        script.src = url;
        script.addEventListener('load', resolveLoad, { once: true });
        script.addEventListener('error', () => rejectLoad(new Error('Manifest field "entryBundleUrl" points to a bundle the browser could not import.')), { once: true });
        document.head.append(script);
      });
    }
    function verificationTimeout() { return new Promise((_, reject) => setTimeout(() => reject(new Error('Browser conformance timed out while ' + stage + '.')), 10000)); }
    async function waitFor(predicate) {
      for (let attempt = 0; attempt < 100; attempt += 1) {
        if (predicate()) return;
        await nextTask();
      }
      throw new Error('Widget Element did not finish connecting.');
    }
    function timeout(message, duration = 1000) { return new Promise((_, reject) => setTimeout(() => reject(new Error(message)), duration)); }
  </script>`;
}

function createCollisionPage(manifest, collisionTag) {
  const remainingTag =
    collisionTag === manifest.elementTag
      ? manifest.settingsElementTag
      : manifest.elementTag;

  // Pre-register one tag, then ensure the bundle never leaves the other tag
  // partially registered when its atomic registration detects the collision.
  return `<!doctype html><body><pre id="result">running</pre><script type="module">
    customElements.define(${JSON.stringify(collisionTag)}, class extends HTMLElement {});
    window.addEventListener('unhandledrejection', (event) => event.preventDefault());
    await new Promise((resolveLoad, rejectLoad) => {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = ${JSON.stringify(manifest.entryBundleUrl)};
      script.addEventListener('load', resolveLoad, { once: true });
      script.addEventListener('error', rejectLoad, { once: true });
      document.head.append(script);
    });
    await new Promise((resolveTask) => setTimeout(resolveTask, 50));
    const partial = customElements.get(${JSON.stringify(remainingTag)}) !== undefined;
    document.querySelector('#result').textContent = JSON.stringify(
      partial
        ? {
            status: 'failed',
            diagnostic: 'Element tag "${remainingTag}" was partially registered after a collision on "${collisionTag}".',
          }
        : { status: 'passed' },
    );
  </script>`;
}

async function runHeadlessBrowser(browserPath, url) {
  const output = await runProcess(browserPath, [
    "--headless",
    "--no-sandbox",
    "--disable-gpu",
    "--dump-dom",
    "--virtual-time-budget=15000",
    url,
  ]);
  const match = output.match(/<pre id="result">([\s\S]*?)<\/pre>/);

  if (match === null) {
    throw new Error(
      `Headless browser did not return a conformance result: ${output.slice(-500)}`,
    );
  }

  return JSON.parse(match[1]);
}

function runProcess(command, arguments_) {
  return new Promise((resolveProcess, rejectProcess) => {
    const browser = spawn(command, arguments_, {
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    let errors = "";
    const timeout = setTimeout(() => browser.kill(), BROWSER_TIMEOUT_MS);
    browser.stdout.on("data", (chunk) => (output += chunk));
    browser.stderr.on("data", (chunk) => (errors += chunk));
    browser.once("error", rejectProcess);
    browser.once("close", (code) => {
      clearTimeout(timeout);
      code === 0
        ? resolveProcess(output)
        : rejectProcess(
            new Error(`Headless browser exited with ${code}: ${errors}`),
          );
    });
  });
}

async function main() {
  const [outputDirectory] = process.argv.slice(2);

  if (outputDirectory === undefined) {
    throw new Error(
      "Usage: node check-built-widget.mjs <production-output-directory>",
    );
  }

  await checkBuiltWidget(
    outputDirectory,
    process.env["CHROME_BIN"] ?? "/usr/bin/brave-browser",
  );
  console.log(
    "Widget output is static-hosting-ready and conforms to the browser Widget contract.",
  );
}

if (
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  await main();
}
