/**
 * well-known-probe-js
 *
 * Zero-dependency probe for the eleven Kinetic Gain Protocol Suite documents
 * at any domain's `/.well-known/` paths. Runs in modern browsers, Node 18+,
 * Deno, Bun — anywhere `fetch` exists.
 *
 * Public surface:
 *   - probeWellKnown(domain, options?) → Promise<ProbeResult>
 *   - SUITE_PATHS  (the 11 paths probed by default)
 *   - tierFromScore(score) → 'comprehensive' | 'strong' | 'partial' | 'minimal' | 'none'
 */

export { probeWellKnown, SUITE_PATHS } from "./probe.js";
export { scoreResult, tierFromScore } from "./scoring.js";

export const VERSION = "0.1.0";
