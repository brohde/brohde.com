/**
 * JSON-LD builders (audit-astro proposal 2). The Person/WebSite/ProfilePage/
 * BlogPosting/BreadcrumbList blocks were hand-written inline in index.astro,
 * about.astro, and [slug].astro, with real drift (two different Person shapes)
 * and jobTitle hardcoded in three places. Single-sourced here, mirroring the
 * src/lib/site.ts pattern.
 *
 * These objects are serialized by SEO.astro via JSON.stringify, so KEY ORDER is
 * load-bearing: each builder reproduces the previous inline literal key-for-key
 * so the emitted JSON-LD stays byte-identical. Do not reorder keys.
 *
 * Copy rule (VOICE.md, #18): no en/em dashes in any reader-visible string.
 */
import { SITE, LINKS, COMPANIES, isoDate } from "@/lib/site";

/** The one job-title string (#77). Was duplicated across the homepage Person,
    the about ProfilePage Person, and nowhere else it should drift. */
export const JOB_TITLE = "AI Product Engineer";

/** Shared sameAs profile list (identical order in both Person blocks). */
const SAME_AS = [LINKS.linkedin, LINKS.x, COMPANIES.eightAngle];

/** Homepage Person: the rich identity (address + knowsAbout). */
export function personLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: SITE.author,
    url: SITE.url,
    jobTitle: JOB_TITLE,
    address: {
      "@type": "PostalAddress",
      addressLocality: "San Francisco",
      addressRegion: "CA",
      addressCountry: "US",
    },
    sameAs: SAME_AS,
    knowsAbout: [
      "Machine learning",
      "iOS development",
      "Astro",
      "Web performance",
      "AI-assisted engineering",
    ],
  };
}

/** Homepage WebSite. */
export function websiteLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE.url,
    author: { "@type": "Person", name: SITE.author },
  };
}

/** About page ProfilePage (wraps a leaner Person: jobTitle + sameAs, no
    address/knowsAbout, matching the previous about.astro literal exactly). */
export function profilePageLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: {
      "@type": "Person",
      name: SITE.author,
      jobTitle: JOB_TITLE,
      url: SITE.url,
      sameAs: SAME_AS,
    },
  };
}

/** Article BlogPosting. `description` is omitted when falsy, exactly as the
    prior inline spread did, so a description-less article emits no key. */
export function articleLd(input: {
  title: string;
  description?: string;
  date: Date;
  canonical: string;
}): Record<string, unknown> {
  const { title, description, date, canonical } = input;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    ...(description ? { description } : {}),
    datePublished: isoDate(date),
    dateModified: isoDate(date),
    author: { "@type": "Person", name: SITE.author, url: SITE.url },
    publisher: { "@type": "Person", name: SITE.author },
    mainEntityOfPage: canonical,
    url: canonical,
  };
}

/** Article BreadcrumbList: home > this article (A2). */
export function breadcrumbLd(input: {
  title: string;
  canonical: string;
}): Record<string, unknown> {
  const { title, canonical } = input;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: SITE.name, item: SITE.url },
      { "@type": "ListItem", position: 2, name: title, item: canonical },
    ],
  };
}
