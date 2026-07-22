import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/**
 * Articles collection (E1). One folder per article under src/content/articles/,
 * each with an index.md, so image assets can live beside their post later.
 *
 * `date` is the pre-date (decision #3): the site is new, but posts about older
 * work carry historical dates. Homepage lists title + date, description optional
 * in the template (#2).
 */
const articles = defineCollection({
  loader: glob({
    pattern: "**/index.md",
    base: "./src/content/articles",
    // one folder per article: use the folder name as the id (drop /index)
    generateId: ({ entry }) => entry.replace(/\/index\.md$/, ""),
  }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    // Optional ledger-ordering override, independent of the DISPLAYED `date`.
    // The homepage log and RSS sort by (sortDate ?? date) descending, while
    // every surface still SHOWS `date`. Lets a deliberately pre-dated entry
    // (the 2014 Facebook piece) sit beside its sibling in the ledger without
    // faking its publish date. Omit to sort by `date`.
    sortDate: z.coerce.date().optional(),
    draft: z.boolean().default(false),
    // Publish gate (item 11). Unlike `draft` (which hides an entry from the
    // log entirely), `published: false` keeps the entry LISTED on the homepage
    // as a "coming soon" row but generates no article page (getStaticPaths),
    // excludes it from RSS, and keeps the chat from linking to it. All entries
    // are unpublished today; to bring one back, set `published: true` in that
    // article's frontmatter (its page, RSS item, homepage link, and chat link
    // all return automatically). External entries stay linked to their
    // off-site URL regardless (they never had a generated page and never 404).
    published: z.boolean().default(false),
    // External log entries (Brian's writing published elsewhere). When set,
    // the homepage log links out to this URL and no article page is generated.
    external: z.string().url().optional(),
    // Per-article scene identity (#111, wired B3): the theme names the sky
    // palette + tide peak + mark the article page mounts (see the PEAKS and
    // THEME_SOURCE tables in src/scripts/scene/index.ts). Omit for the site
    // default (the BR letterform).
    theme: z
      .enum([
        "default",
        "eight",
        "news",
        "android",
        "atg",
        "goldcoast",
        "twilio",
      ])
      .default("default"),
    // Lifted stat band under the title (#67 C article variant): the ONLY
    // designed home for standout numbers besides terminal excerpts; inline
    // numbers stay in the body face (VOICE.md: numbers persuade, they should
    // not fight the sentence). Optional; omit for articles without headline
    // metrics.
    stats: z
      .array(z.object({ n: z.string(), label: z.string() }))
      .max(4)
      .optional(),
  }),
});

export const collections = { articles };
