// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

// Static output for Cloudflare Pages (decisions #1, #5, #17).
// No adapter: pure static, no Keystatic/SSR baggage (prior-project-conventions).
export default defineConfig({
  site: "https://brohde.com",
  trailingSlash: "ignore",
  build: {
    // Inline the single ~5 KB (gzip) stylesheet into each document's <head>
    // so first paint never waits on a second round-trip for render-blocking
    // CSS. The whole site shares one sheet and internal moves are ClientRouter
    // swaps (no full reload), so a full document load only happens on site
    // entry: exactly when we want the fastest possible paint (#62).
    inlineStylesheets: "always",
  },
  // Terminal-style navigation feel (#24): prefetch everything so route swaps
  // land instantly. View Transitions handle the swap itself (ClientRouter).
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "hover",
  },
  integrations: [
    sitemap({
      // Keep internal / preview / noindex surfaces out of the sitemap
      // (/contact is noindex like /chat; article stubs stay listed because
      // they flip published soon and the ledger already links them).
      filter: (page) =>
        !page.includes("/styleguide") &&
        !page.includes("/chat") &&
        !page.includes("/contact"),
      // Sitemap URLs must agree with the canonical tags, which strip the
      // trailing slash everywhere except the root (SEO.astro).
      serialize: (item) => {
        const u = new URL(item.url);
        if (u.pathname !== "/") {
          item.url = item.url.replace(/\/$/, "");
        }
        return item;
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
