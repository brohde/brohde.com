# Handoff: typographic apostrophe sweep

**Date:** 2026-07-21
**Convention (new, site-wide):** typographic apostrophes (`’` U+2019) in all USER-VISIBLE copy, replacing straight `'` wherever it functions as an apostrophe or right single quote. Paired single-quote quotations also get proper curly pairs (`‘…’`, U+2018 opening / U+2019 closing).
**Build:** `npm run build` green (astro check + astro build, 12 pages). Zero em dashes introduced. Cancel/stop and input-matching regexes untouched.

## Method

Every candidate `'` was judged per file (not a blind global replace): apostrophe/quotation vs code syntax vs measurement mark vs comparison operand. Article markdown bodies were confirmed to contain no code-span apostrophes (backtick spans are `<br>`, `aria-hidden`, `wp-content`, `AVPictureInPictureController` — none carry `'`) and no measurement marks, so a per-file mechanical apply was safe there after the audit; the two paired-quotation openings and the one HTML comment were then corrected/preserved by hand. Code files (`.astro`, `.ts`) were edited per-occurrence because single quotes there double as string delimiters and attribute syntax.

## Files touched + conversion counts

### Article bodies / frontmatter (`src/content/articles/*/index.md`) — 71 apostrophes curled
Includes titles, descriptions, body prose, alt text, figcaptions.

| File | Notes |
| --- | --- |
| `facebook-newsroom/index.md` | title + description + body; incl. apostrophe inside a `"…"` quotation (`someone else’s`) |
| `google-android-for-work/index.md` | title + description + body |
| `atg-llm-migration/index.md` | body; the `247.7MB → 26.0MB` arrow (U+2192) left as-is (not a dash) |
| `eight-angle-ml/index.md` | body |
| `gold-coast/index.md` | body + **3 single-quote quotation pairs** curled as `‘life’`, `‘20+’`, `‘not’` (opening U+2018, closing U+2019) |
| `twilio-signal-pong/index.md` | description + body. **Left straight on purpose:** `Cloudflare Pages'` on line 26 is inside an HTML comment (invisible) |
| `brohde-com-build/index.md` | description (`you’re`); article is `draft: true` but source copy normalized for consistency |

Double straight quotes (`"…"`) used as quotation marks were left straight throughout (convention is apostrophes only; curling doubles would be scope creep — flag if Brian wants a separate double-quote pass).

### Astro pages + components — 8 conversions
- `src/pages/about.astro` — `I’m`, `company’s`, `Google’s` (body prose)
- `src/pages/credits.astro` — `article’s` (body prose)
- `src/pages/chat.astro` — `Brian Rohde’s` (SEO/meta `description` prop)
- `src/components/SiteHeader.astro` — placeholder `Ask Brian’s AI anything`
- `src/pages/index.astro` — placeholder `Ask Brian’s AI anything`
- `src/pages/styleguide.astro` — placeholder `Ask Brian’s AI anything` (specimen)

`src/lib/site.ts` needed **no change**: `SITE.description` uses "end to end" with no contraction; its only `'` occurrences are in code comments.

### App scripts — 3 strings
- `src/scripts/terminal.ts`
  - Hello tour greeting (line ~67): `Here’s what’s on the site:`
  - AI greeting (line ~504): `I’m Brian’s AI … I’ll do my best to answer.` (these render client-side, not in static dist HTML)
  - **Deliberately untouched:** the input-matching regex (`/^(my name is|i am|i'm|im|it is|it's|…)/i`, line ~1239) and the cancel regex (`/^(cancel|stop|nevermind|never mind|quit)$/i`, line ~1574) keep straight quotes — they compare against what the visitor types. Command words, dataset values, class names, selectors all untouched.
- `functions/api/chat.ts`
  - `BLOCKED` operational error (line ~200): `couldn’t verify that request…`. Verified no test/curl/grader matches it byte-exactly (repo-wide grep for "verify that request" hits only the definition), so conversion is safe.

## Left deliberately (with reasons)

1. **`functions/api/contact.ts:172`** — `description: "Return the visitor's name, email, and message."` is a **model-facing tool-parameter description** (sent in the API tool schema), not a user-facing error string, and is the kind of string a grader could assert. Out of the "three user-facing error strings" scope. Left straight.
2. **`poc/chat/` entirely** — excluded per task (prompt/facts/eval fixtures; curling risks eval-grader byte mismatches). **Follow-up flagged:** if Brian wants the chat's own generated copy to speak in curly apostrophes, do a `poc/chat/*.md` pass together with a keyed eval re-run so the graders move in lockstep. The production bundle regenerates from these files at build time, so this is the single remaining source of straight apostrophes the model could emit.
3. **Double quotation marks** (`"…"`) — left straight site-wide; convention is apostrophes only.
4. **Pre-existing em dashes in `functions/api/chat.ts`** (line 3 comment; line 166 `replace(/\s*[—–]\s*/g, ", ")` input sanitizer) — not introduced by this sweep, not user-visible. Left as-is.

## Verification

- `npm run build` green (astro check clean, 12 pages built).
- Tag-stripped visible-text scan of every dist page (`about, all 5 published articles, credits, index, chat, contact, 404, styleguide`) → **CLEAN** of word-internal straight apostrophes.
- `<title>` and `content="…"` meta/OG attributes in dist → curly, no straight apostrophes.
- Cancel and input-matching regexes confirmed intact (straight quotes preserved by construction; the typed contact-cancel path is unchanged).
- Zero em dashes in any touched file's output.

## Aside (out of scope, not acted on)

`dist/rss.xml` renders as a channel-only feed with **no `<item>` entries** (no articles enumerated). Its channel description has no apostrophe, so it's clean for this sweep — but the empty item list looks like a latent RSS bug worth a separate look.
