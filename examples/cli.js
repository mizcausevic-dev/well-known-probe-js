#!/usr/bin/env node
/**
 * cli.js — probe a single domain from the command line.
 *
 * Usage:
 *   node examples/cli.js kineticgain.com
 *   node examples/cli.js https://kineticgain.com
 */

import { probeWellKnown } from "../src/index.js";

const domain = process.argv[2];

if (!domain) {
  console.error("usage: node examples/cli.js <domain>");
  process.exit(2);
}

const result = await probeWellKnown(domain, { timeout: 5000 });

console.log(JSON.stringify({
  domain: result.domain,
  probedAt: result.probedAt,
  score: result.score,
  tier: result.tier,
  published: result.published,
  missing: result.missing,
}, null, 2));
