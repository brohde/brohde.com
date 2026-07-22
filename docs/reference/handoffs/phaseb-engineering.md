# Handoff: Phase B engineering docs (D1 rewrite + D8 scene spec)

_Agent: Opus engineer-writer. Date: 2026-07-21. Worktree: agent-a483cedc825dca0db (branch main)._

## Scope

Publish-readiness Phase B, track 1: the engineering documentation. Two fences:

1. **Rewrote `docs/ENGINEERING.md`** (debt D1). The prior version was materially stale after the pre-public reorg: it described deleted components (`TerminalHeader`, `Topbar`, `Prompt`, `CommandMenu`), called `/chat` a "static stub", and asserted the Cloudflare infra (`functions/`, `wrangler.toml`, the Pages project) "does not exist yet". All of that is live now. The rewrite is a fresh, public-facing build reference structured for an external engineering reader, written from the code, not the old decision-gap framing.
2. **Wrote `docs/reference/scene.md`** (debt D8, new file): the prose spec for the production scene module (`src/scripts/scene/*`, `Scene.astro`, `scene.css`) that a cold engineer needs to fix a scene bug without reverse-engineering it against the frozen design lab.

Source of truth was the code only. I read the full reorganized tree (build tooling, functions, both `terminal.ts` and its extracted leaves, the whole scene module and its data tables, `theme.ts`, every component and page, the config files, `public/_headers`, `wrangler.toml`, and the `chat/` bridge) and grounded every named file, command, port, and number in what I read.

No other doc was touched (a parallel agent owns the rest) and no code was changed.

## Files

- `docs/ENGINEERING.md`: full rewrite. Sections: Versions, 1. Build pipeline (the prompt codegen seam first, then `astro check`, then `astro build`), 2. Directory map (post-reorg), 3. Routes, 4. Content collection, 5. Components (the current 12 `.astro` files), 6. Client script architecture (`terminal.ts` + the `dom`/`typing`/`a11y` leaves, the scene module pointer, `theme.ts` session model), 7. The API surface (`chat.ts`, `contact.ts`, `_shared.ts` + hardening posture pointing at the audit annotations), 8. Deploy (Cloudflare Pages, `wrangler.toml` vars, AI Gateway + spend cap, secrets, `_headers`), 9. Local development (`npm run dev`; the `chat/server.mjs` bridge on 8787; `wrangler pages dev` on 8788), 10. Performance discipline (Lighthouse 100 / TBT 0 / CLS 0, critical-CSS inlining, the facade pattern, the scene tick budget).
- `docs/reference/scene.md`: new. Sections: Files, 1. Architecture (facade -> lazy live canvas, staged boot), 2. The tide engine, 3. The data tables (`palettes.ts`/`placements.ts`/`sources.ts`), 4. Identity and the theme/state system (`THEME_SOURCE`, `data-scene-theme` stamping, why the persisted node cannot carry the truth), 5. Travel envelopes and the sky clock (ambient 1400/900/1400, nav 200/140/300, the 2600ms clock), 6. Surge and wake, 7. The navigation gate (`navTravel` + `data-vt-matrix`), 8. Performance budget (`CELL_CAP` 6000, dpr cap, tick pauses), 9. Adding a new mark (the `sources.ts` drawer contract + the #104 ink-trim lesson), 10. Reduced motion and fallback paths, 11. The `__scene` debug handle.

## Verification

- `npm run build`: green. Codegen wrote `functions/api/_chat-prompt.generated.ts` (9652 chars); `astro check` reported 0 errors, 0 warnings, 0 hints across 43 files; 12 pages built plus `rss.xml` and the sitemaps. Every command, path, and port in both docs was confirmed against the source before writing (build script, `wrangler.toml` bindings, `_headers` CSP, the 8787 bridge and 8788 `wrangler pages dev` targets in `chat/server.mjs` and `chat/eval-http.mjs`, the sitemap filter output, the scene constants).
- House rules: verified programmatically. Zero em dashes and zero en dashes in both files; all prose apostrophes are typographic (U+2019) while apostrophes inside code spans (`'self'`, `'unsafe-inline'`, `'none'`) stay ASCII; the word "terminal" is used only for the code identifiers `terminal.ts` / `src/scripts/terminal/` (the client controller’s real filename), never as a noun for the chat surface (called the chat surface / slab / chat panel throughout).
- `docs/` is in `.prettierignore`, so the format step does not touch these files; the editor’s prettier pass reflowed prose only.

## Judgment calls

- **Named the doc "Engineering", dropped "documentation"** from the H1, and rebuilt the structure around a public reader rather than preserving the old section numbering. Alternative: keep the old shape and patch the stale parts. Rejected because the staleness was structural (whole sections described a deleted architecture), and D1’s own framing is that this is the flagship public showcase doc.
- **Kept the AI Gateway account id and KV namespace id out of `ENGINEERING.md`** (shown as `<account>` / `<namespace id>` placeholders), even though the real values sit in `wrangler.toml` in the repo. Alternative: reproduce them. Rejected because the doc ships public and there is no reason to duplicate resource handles into prose; they remain in `wrangler.toml` where the code needs them. Note: whether those handles stay in the public repo at all is R1’s call (the sensitivity prune), not mine.
- **Described Turnstile as "wired but dormant"** and the contact flow’s local-dev degradation as intended, matching the code comments rather than flagging them as gaps.

## Loose ends and flags

- **`ENGINEERING.md` states Perf 100 / TBT 0 / CLS 0 as the standing bar** from the `BaseLayout` contract and prior measurements; I did **not** re-run Lighthouse on `dist` this session. If a fresh number is wanted before publish, someone should measure the built output.
- **Sitemap vs noindex, worth a human glance (not a doc bug):** the sitemap `filter` excludes only `/styleguide` and `/chat`. `/contact` is `noindex` but still appears in `sitemap-0.xml`, as do the unpublished "coming soon" article stubs (also `noindex`). The docs describe the filter accurately; whether the filter *should* also drop `/contact` and the stubs is a code question for the SEO/a11y owner, outside my fence.
- **`README.md` is already current** (its repo map reflects the reorg), so no cross-doc drift was introduced. `docs/STATUS.md` still says "Astro 5" (D2, owned by the parallel docs agent); `ENGINEERING.md` now states Astro ^7.0.9 from `package.json`, so the two will disagree until D2 lands. Flagging so it is not read as a regression.
- The debt-backlog rows D1 and D8 can be marked resolved once these land, but I did not edit `docs/reference/debt-backlog.md` (not in my fence).
