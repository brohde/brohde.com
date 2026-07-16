/**
 * Single source of truth for site-wide constants: metadata, author identity,
 * social links, and the article route base. Imported by SEO, the header, the
 * command router, and JSON-LD builders so nothing drifts.
 *
 * Copy rules (VOICE.md, decision #18): no en/em dashes anywhere a reader sees.
 * Identity rule (#27/#31): never expose age or anything enabling age math.
 */

export const SITE = {
  name: "brohde.com",
  url: "https://brohde.com",
  /* #77: "AI Product Engineer" is the title identity; "full-stack" stays as
     a supporting keyword in descriptions only (copywriter's phrasing). */
  title: "Brian Rohde: AI Product Engineer",
  description:
    "Brian Rohde is an AI Product Engineer in San Francisco who ships full-stack AI products end to end. Project deep dives and notes on AI-assisted engineering.",
  author: "Brian Rohde",
  locale: "en_US",
  lang: "en",
  email: "brian@brohde.com",
  ogImage: "/og-default.svg",
} as const;

/** Profile + resume links shown in the header (#25, #33). */
export const LINKS = {
  linkedin: "https://www.linkedin.com/in/brian-rohde-4ba3558/",
  x: "https://x.com/brianxbuilds",
  xHandle: "@brianxbuilds",
  resume: "/resume.pdf",
} as const;

/** Company links inside the bio lines (#39): official sites, quiet styling. */
export const COMPANIES = {
  eightAngle: "https://eightangle.com",
  gong: "https://www.gong.io",
  twilio: "https://www.twilio.com",
  beyond: "https://bynd.com",
} as const;

/** Where the article collection is served. Unbranded: just "the log". */
export const LOG_BASE = "/log";

export function logHref(id: string): string {
  return `${LOG_BASE}/${id}`;
}

/** ISO date, no dashes-as-punctuation issue: hyphens in an ISO date are fine. */
export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Homepage / log timestamp format: [YYYY-MM-DD]. */
export function logStamp(d: Date): string {
  return `[${isoDate(d)}]`;
}
