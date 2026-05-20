# well-known-probe-js

> Zero-dependency vanilla JavaScript probe for the eleven [Kinetic Gain Protocol Suite](https://github.com/mizcausevic-dev/kinetic-gain-protocol-suite) documents at any domain's `/.well-known/` paths.

```js
import { probeWellKnown } from "@kineticgain/well-known-probe";

const result = await probeWellKnown("kineticgain.com");
console.log(`Score: ${result.score}/100 — tier: ${result.tier}`);
console.log(`Published: ${result.published.join(", ")}`);
console.log(`Missing:   ${result.missing.join(", ")}`);
```

Runs **in the browser, Node 18+, Deno, and Bun** — anywhere `fetch` exists. **No dependencies.** No bundler. No build step. Drop it in.

## Why this exists

The Suite specifies that vendors publish disclosure documents at predictable `/.well-known/` paths — `aeo.json`, `agents/index.json`, `decisions/index.json`, eleven total. Reading those endpoints from a browser tab, a CI check, a Greasemonkey userscript, an Express middleware, or a Node CLI is the same shape of code — fetch + JSON parse + score. This library is that code, factored out, with zero dependencies.

It's the shared core of the [Vendor AI Disclosure Inspector browser extension](https://github.com/mizcausevic-dev/kineticgain-vendor-inspector) and the [companion Tampermonkey/Greasemonkey userscript](https://greasyfork.org/) (both coming in the same trio). You can also drop it into your own app — vendor self-validation widget, build-time crawl, anywhere.

## Install

```bash
npm install @kineticgain/well-known-probe
```

Or, since it's zero-dep ESM with no build step, just copy `src/` into your project and import directly.

## Usage

### Browser

```html
<script type="module">
  import { probeWellKnown } from "https://unpkg.com/@kineticgain/well-known-probe/src/index.js";

  const result = await probeWellKnown("vendor.example.com");
  document.getElementById("score").textContent = result.score;
</script>
```

### Node CLI

```bash
node examples/cli.js kineticgain.com
```

```json
{
  "domain": "kineticgain.com",
  "probedAt": "2026-05-18T07:42:11.182Z",
  "score": 27,
  "tier": "minimal",
  "published": ["aeo", "agents", "decisions"],
  "missing": [
    "prompts", "evidence", "toolCards", "tutorCards",
    "studentAI", "classroomAUP", "clinicalAI", "incidents"
  ]
}
```

### Programmatic, with timeouts and a custom transport (e.g. for tests)

```js
import { probeWellKnown } from "@kineticgain/well-known-probe";

const controller = new AbortController();
setTimeout(() => controller.abort(), 30_000); // hard cap on the whole probe

const result = await probeWellKnown("vendor.example.com", {
  timeout: 4000,       // per-fetch timeout (ms)
  signal: controller.signal,
  scheme: "https",
  fetch: globalThis.fetch, // override for instrumentation / proxying
});
```

## API

### `probeWellKnown(domain, options?) → Promise<ProbeResult>`

Probes all eleven Suite paths in parallel. See [`index.d.ts`](./index.d.ts) for the full TypeScript types.

| Option | Default | Purpose |
| --- | --- | --- |
| `timeout` | `5000` | Per-fetch timeout (ms). Each spec has its own budget. |
| `signal` | `undefined` | External `AbortSignal` to cancel the whole probe. |
| `fetch` | `globalThis.fetch` | Override the fetch implementation. Useful for tests, proxies, or running through a CORS-friendly relay. |
| `scheme` | `'https'` | URL scheme. Use `'http'` for localhost testing. |

### `SUITE_PATHS` — the canonical 11 paths

```js
import { SUITE_PATHS } from "@kineticgain/well-known-probe";
// { aeo: { url: "/.well-known/aeo.json", discriminator: "aeo_version" }, ... }
```

Frozen object. Add your own paths by composing — don't mutate this one.

### `tierFromScore(score) → 'comprehensive' | 'strong' | 'partial' | 'minimal' | 'none'`

Pure mapping function. Cutoffs: ≥90 comprehensive · ≥60 strong · ≥30 partial · ≥1 minimal · 0 none. Match the [AI Procurement Pulse](https://pulse.kineticgain.com/) reporting bands.

## Discriminator-aware

For specs that ship a top-level `<thing>_version` field (currently `aeo` and `classroomAUP`), a 200 OK with the wrong JSON shape **does NOT count as published**. You can't game the Pulse by serving a 200 of unrelated JSON at the well-known URL — the probe verifies the discriminator before marking the spec found.

## Composes with

| Repo | How |
| --- | --- |
| [`kineticgain-vendor-inspector`](https://github.com/mizcausevic-dev/kineticgain-vendor-inspector) | Chrome / Firefox extension that uses this lib in its popup |
| Tampermonkey / Greasemonkey userscript | Single `.user.js` file that imports this lib via bundled copy |
| [Procurement Pulse](https://pulse.kineticgain.com/) | Same probe logic, server-side, against ~1,200 domain universe |
| [aeo-crawler](https://github.com/mizcausevic-dev/aeo-crawler) | Heavyweight crawler for the same paths; this lib is the lightweight per-domain version |
| [Kinetic Gain Protocol Suite](https://github.com/mizcausevic-dev/kinetic-gain-protocol-suite) | The specs whose presence this library detects |

## Roadmap

- **v0.2**: enumerate child documents — when `agents/index.json` lists multiple Agent Cards, recursively probe each one + return the deepest `agent_card_version` found
- **v0.3**: signature verification — when a document references a `signing_key_url`, fetch the key and verify the ed25519 signature client-side (Web Crypto API in the browser; node:crypto in Node)
- **v0.4**: drift detection — accept a previous `ProbeResult` and diff against it; useful for monitoring vendor disclosure changes over time

## License

MIT.
