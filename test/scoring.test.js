import { test } from "node:test";
import assert from "node:assert/strict";

import { scoreResult, tierFromScore } from "../src/scoring.js";

test("scoreResult: 0/11 → 0 / none", () => {
  const { score, tier } = scoreResult({ found: 0, total: 11 });
  assert.equal(score, 0);
  assert.equal(tier, "none");
});

test("scoreResult: 11/11 → 100 / comprehensive", () => {
  const { score, tier } = scoreResult({ found: 11, total: 11 });
  assert.equal(score, 100);
  assert.equal(tier, "comprehensive");
});

test("scoreResult: 7/11 ≈ 64 / strong", () => {
  const { score, tier } = scoreResult({ found: 7, total: 11 });
  assert.equal(score, 64);
  assert.equal(tier, "strong");
});

test("scoreResult: 1/11 ≈ 9 / minimal", () => {
  const { score, tier } = scoreResult({ found: 1, total: 11 });
  assert.equal(score, 9);
  assert.equal(tier, "minimal");
});

test("scoreResult: total=0 is safe and returns none", () => {
  const { score, tier } = scoreResult({ found: 0, total: 0 });
  assert.equal(score, 0);
  assert.equal(tier, "none");
});

test("tierFromScore boundary: 90 = comprehensive, 89 = strong", () => {
  assert.equal(tierFromScore(90), "comprehensive");
  assert.equal(tierFromScore(89), "strong");
});

test("tierFromScore boundary: 60 = strong, 59 = partial", () => {
  assert.equal(tierFromScore(60), "strong");
  assert.equal(tierFromScore(59), "partial");
});

test("tierFromScore boundary: 30 = partial, 29 = minimal, 0 = none", () => {
  assert.equal(tierFromScore(30), "partial");
  assert.equal(tierFromScore(29), "minimal");
  assert.equal(tierFromScore(1), "minimal");
  assert.equal(tierFromScore(0), "none");
});
