import { test } from "node:test";
import assert from "node:assert/strict";

import { probeWellKnown, SUITE_PATHS } from "../src/probe.js";

/**
 * A tiny in-process fake-fetch factory. Routes pre-defined responses by URL
 * suffix; everything unmatched is treated as a 404. No network anywhere.
 */
function makeFakeFetch(routes) {
  return async function fakeFetch(url, _init) {
    const path = new URL(url).pathname;
    const match = Object.keys(routes).find((suffix) => path.endsWith(suffix));
    if (!match) {
      return jsonResponse(404, "");
    }
    const r = routes[match];
    if (r.throws) throw r.throws;
    return jsonResponse(r.status ?? 200, r.body ?? "");
  };
}

function jsonResponse(status, body) {
  const text = typeof body === "string" ? body : JSON.stringify(body);
  return {
    status,
    headers: new Map(),
    async json() {
      if (text === "") throw new Error("empty body");
      return JSON.parse(text);
    },
  };
}

test("SUITE_PATHS exposes exactly 11 specs", () => {
  assert.equal(Object.keys(SUITE_PATHS).length, 11);
});

test("rejects empty / non-string domain", async () => {
  await assert.rejects(() => probeWellKnown("", { fetch: makeFakeFetch({}) }), TypeError);
  await assert.rejects(() => probeWellKnown(123, { fetch: makeFakeFetch({}) }), TypeError);
});

test("complete miss: all 11 paths 404 → score=0, tier=none", async () => {
  const result = await probeWellKnown("example.com", { fetch: makeFakeFetch({}) });
  assert.equal(result.score, 0);
  assert.equal(result.tier, "none");
  assert.equal(result.published.length, 0);
  assert.equal(result.missing.length, 11);
  assert.equal(result.domain, "example.com");
});

test("complete hit: all 11 paths return valid content → score=100, tier=comprehensive", async () => {
  const fetch = makeFakeFetch({
    "/.well-known/aeo.json": { body: { aeo_version: "0.1", entity: "example" } },
    "/.well-known/agents/index.json": { body: [] },
    "/.well-known/prompts/index.json": { body: [] },
    "/.well-known/evidence/index.json": { body: [] },
    "/.well-known/tool-cards/index.json": { body: [] },
    "/.well-known/tutor-cards/index.json": { body: [] },
    "/.well-known/student-ai/index.json": { body: [] },
    "/.well-known/aup.json": { body: { aup_version: "0.1" } },
    "/.well-known/clinical-ai/index.json": { body: [] },
    "/.well-known/incidents/index.json": { body: [] },
    "/.well-known/decisions/index.json": { body: [] },
  });
  const result = await probeWellKnown("example.com", { fetch });
  assert.equal(result.score, 100);
  assert.equal(result.tier, "comprehensive");
  assert.equal(result.published.length, 11);
  assert.equal(result.documents.aeo.version, "0.1");
});

test("AEO 200 without discriminator → counted as not-found", async () => {
  const fetch = makeFakeFetch({
    "/.well-known/aeo.json": { body: { something: "else" } },
  });
  const result = await probeWellKnown("example.com", { fetch });
  assert.equal(result.documents.aeo.found, false);
  assert.match(result.documents.aeo.error ?? "", /discriminator/);
});

test("non-JSON 200 → counted as not-found", async () => {
  const fetch = makeFakeFetch({
    "/.well-known/agents/index.json": { body: "this is plaintext" },
  });
  const result = await probeWellKnown("example.com", { fetch });
  assert.equal(result.documents.agents.found, false);
});

test("partial hit: 4/11 → score=36, tier=partial", async () => {
  const fetch = makeFakeFetch({
    "/.well-known/aeo.json": { body: { aeo_version: "0.1" } },
    "/.well-known/agents/index.json": { body: [] },
    "/.well-known/decisions/index.json": { body: [] },
    "/.well-known/incidents/index.json": { body: [] },
  });
  const result = await probeWellKnown("example.com", { fetch });
  assert.equal(result.published.length, 4);
  assert.equal(result.missing.length, 7);
  assert.equal(result.score, 36);
  assert.equal(result.tier, "partial");
});

test("network error on a single path is captured in documents[slug].error", async () => {
  const fetch = makeFakeFetch({
    "/.well-known/aeo.json": { throws: new TypeError("network down") },
    "/.well-known/agents/index.json": { body: [] },
  });
  const result = await probeWellKnown("example.com", { fetch });
  assert.equal(result.documents.aeo.found, false);
  assert.match(result.documents.aeo.error ?? "", /network down/);
  assert.equal(result.documents.agents.found, true);
});

test("requires a fetch implementation", async () => {
  // Save & remove globalThis.fetch so the default fallback fails.
  const savedFetch = globalThis.fetch;
  // @ts-ignore — intentionally delete for the assertion
  globalThis.fetch = undefined;
  try {
    await assert.rejects(() => probeWellKnown("example.com"), TypeError);
  } finally {
    globalThis.fetch = savedFetch;
  }
});

test("normalizes input: 'example.com', 'https://example.com', and 'http://example.com/foo' all resolve to the same hostname", async () => {
  const fetch = makeFakeFetch({
    "/.well-known/aeo.json": { body: { aeo_version: "0.1" } },
  });
  const a = await probeWellKnown("example.com", { fetch });
  const b = await probeWellKnown("https://example.com", { fetch });
  const c = await probeWellKnown("http://example.com/foo", { fetch, scheme: "http" });
  assert.equal(a.domain, "example.com");
  assert.equal(b.domain, "example.com");
  assert.equal(c.domain, "example.com");
});
