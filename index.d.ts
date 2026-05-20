/**
 * Type declarations for well-known-probe-js.
 * Hand-written, not generated — the source is pure JS by design.
 */

export const VERSION: string;

export interface SpecPath {
  readonly url: string;
  readonly discriminator: string | null;
}

export const SUITE_PATHS: Readonly<{
  aeo: SpecPath;
  agents: SpecPath;
  prompts: SpecPath;
  evidence: SpecPath;
  toolCards: SpecPath;
  tutorCards: SpecPath;
  studentAI: SpecPath;
  classroomAUP: SpecPath;
  clinicalAI: SpecPath;
  incidents: SpecPath;
  decisions: SpecPath;
}>;

export type SuiteSlug = keyof typeof SUITE_PATHS;

export type Tier = "comprehensive" | "strong" | "partial" | "minimal" | "none";

export interface ProbeOptions {
  /** Per-fetch timeout in milliseconds. Default 5000. */
  timeout?: number;
  /** External AbortSignal to cancel the entire probe. */
  signal?: AbortSignal;
  /** Custom fetch implementation. Useful for tests + instrumentation. */
  fetch?: typeof fetch;
  /** URL scheme. Default `'https'`; pass `'http'` for localhost testing. */
  scheme?: "http" | "https";
}

export interface DocumentResult {
  status: number;
  found: boolean;
  url?: string;
  json?: unknown;
  version?: string;
  error?: string;
}

export interface ProbeResult {
  domain: string;
  probedAt: string;
  score: number;
  tier: Tier;
  documents: Record<SuiteSlug, DocumentResult>;
  published: SuiteSlug[];
  missing: SuiteSlug[];
}

export function probeWellKnown(
  domain: string,
  options?: ProbeOptions,
): Promise<ProbeResult>;

export function scoreResult(input: { found: number; total: number }): {
  score: number;
  tier: Tier;
};

export function tierFromScore(score: number): Tier;
