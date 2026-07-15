// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

// Static output for Cloudflare Pages (decisions #1, #5, #17).
// No adapter: pure static, no Keystatic/SSR baggage (prior-project-conventions).
export default defineConfig({
  site: "https://brohde.com",
  trailingSlash: "ignore",
  // Terminal-style navigation feel (#24): prefetch everything so route swaps
  // land instantly. View Transitions handle the swap itself (ClientRouter).
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "hover",
  },
  integrations: [
    sitemap({
      // Keep internal / preview surfaces out of the sitemap.
      filter: (page) =>
        !page.includes("/styleguide") && !page.includes("/chat"),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
