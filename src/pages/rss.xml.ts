import type { APIRoute } from "astro";
import { SITE, logHref } from "@/lib/site";
import { orderedArticles } from "@/lib/articles";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export const GET: APIRoute = async () => {
  // Item 11: only PUBLISHED articles ship in the feed (an empty feed is fine
  // while everything is unpublished). External entries are unpublished too, so
  // they stay out until republished.
  // Order by (sortDate ?? date) descending via the shared helper, mirroring the
  // homepage ledger; the item <pubDate> below still reports the real `date`.
  const posts = await orderedArticles(
    (e) => !e.data.draft && e.data.published
  );

  const items = posts
    .map((post) => {
      const url =
        post.data.external ?? new URL(logHref(post.id), SITE.url).href;
      const desc = post.data.description ?? "";
      return `    <item>
      <title>${esc(post.data.title)}</title>
      <link>${url}</link>
      <guid>${url}</guid>
      <pubDate>${post.data.date.toUTCString()}</pubDate>
      <description>${esc(desc)}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${esc(SITE.name)}</title>
    <link>${SITE.url}</link>
    <description>${esc(SITE.description)}</description>
    <language>en-us</language>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
