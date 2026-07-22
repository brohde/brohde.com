/**
 * One source of truth for LEDGER ORDER, so the homepage log (ArticleLog),
 * RSS (rss.xml.ts), and the article prev/next chain ([slug].astro) can never
 * disagree about which entry sits above which.
 *
 * Ordering rule (mirrors content.config.ts): sort by (sortDate ?? date)
 * descending. Everything still DISPLAYS `date`; only the sort key uses
 * sortDate, so the deliberately pre-dated Facebook piece (2014) can sit beside
 * its sibling in the ledger without faking its stamp.
 *
 * Copy rule (VOICE.md, #18): no en/em dashes anywhere a reader sees.
 */
import { getCollection, type CollectionEntry } from "astro:content";

export type Article = CollectionEntry<"articles">;

/** Ledger sort key: (sortDate ?? date) as a millisecond value. */
export const orderKey = (data: Article["data"]): number =>
  (data.sortDate ?? data.date).valueOf();

/** Ledger comparator, newest first. Sort ANY article array through this. */
export const byLedgerDesc = (a: Article, b: Article): number =>
  orderKey(b.data) - orderKey(a.data);

/**
 * getCollection("articles", filter) + the one ledger sort, in a single call.
 * Pass the same predicate each surface already used:
 *   ArticleLog: (e) => !e.data.draft
 *   RSS:        (e) => !e.data.draft && e.data.published
 * Omit the filter to order the whole collection.
 */
export async function orderedArticles(
  filter?: (entry: Article) => unknown
): Promise<Article[]> {
  const posts = await getCollection(
    "articles",
    filter as Parameters<typeof getCollection>[1]
  );
  return posts.sort(byLedgerDesc);
}

/**
 * The prev/next CHAIN: internal, non-draft articles (the entries that actually
 * have a page, matching getStaticPaths' `!draft && !external`), in ledger
 * order. External entries own no page and never enter the chain. Stub
 * (unpublished) entries DO have a page (a "Coming soon" stub), so they stay in
 * the chain.
 */
export async function articleChain(): Promise<Article[]> {
  return orderedArticles((e) => !e.data.draft && !e.data.external);
}

/**
 * Given a ledger-ordered chain and an id, return the adjacent PAGES: `newer`
 * is the entry above (later in the ledger's newest-first order), `older` is the
 * entry below. Either is null at the ends of the chain (first article has no
 * newer, last has no older), so the caller renders no empty control. Because
 * the chain already excludes external entries, an external neighbor is skipped:
 * the hop lands on the next real page.
 */
export function neighborsOf(
  chain: Article[],
  id: string
): { newer: Article | null; older: Article | null } {
  const i = chain.findIndex((p) => p.id === id);
  if (i === -1) return { newer: null, older: null };
  return {
    newer: i > 0 ? chain[i - 1] : null,
    older: i < chain.length - 1 ? chain[i + 1] : null,
  };
}
