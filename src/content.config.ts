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
  loader: glob({ pattern: "**/index.md", base: "./src/content/articles" }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { articles };
