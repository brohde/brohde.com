# Handoff: publish-readiness CSS audit (Phase A)

Auditor: Opus code auditor. Scope fence (edit): `src/styles/*.css`, `src/scripts/scene/live.css`. Read-only everywhere else. Bar: public-repo quality.

**Result: 4 provably-dead rules deleted + 1 stale comment fixed, all in `terminal.css`. Build green. Rendering proven identical (before/after critical-CSS diff shows only the four removals).**

`global.css`, `scene.css`, `live.css`: audited, nothing dead, no edits.

---

## 1. Deletions (mechanical, applied)

All four are in `src/styles/terminal.css`. Net source change: **1768 -> 1747 lines (-21)**; inlined critical CSS **-170 bytes on every page**.

Method: extracted every class selector from the four CSS files, then cross-referenced against every consumer (all `.astro`, `.ts`, `.md` under `src/` plus the scene module at `src/scripts/scene/`), reading the actual class-emitting code in `terminal.ts` and `scene/index.ts` rather than trusting substring greps. Dynamically-composed names were pattern-verified, not deleted on a literal miss.

| Rule removed | Evidence it is dead |
| --- | --- |
| `.p { color: var(--accent) }` | The old prompt-sigil console class. Zero `class="p"` anywhere in `src/` or `functions/`. Not among the class strings `terminal.ts` emits (its full set: `uline, lbl, contact-actions, contact-edits, reply contact-confirm, cc-intro, cc-fields, cc-hint, wm, sr, out, reply greeting, c, cmdlink, reply, reply thinking, tdots, tlabel, reply redirect, rdx-tail, rdx-clock, rdx-count, rdx-stay`). Slab-era leftover: the homepage prompt/boot retired (#160). |
| `.k` and `.br` (from `.d, .k, .br { color: var(--dim) }`) | Console keyword/bracket classes. Zero `class="k"` / `class="br"` in any consumer. (`br` only ever appears as the `<br>` tag, the `mark="br"` scene *attribute*, and substrings like "Brian/brohde", none of which is the `.br` class.) The shared rule was reduced to `.d { color: var(--dim) }`; **`.d` is still live** (HomeIntro.astro middot separators + "Prev:" label, styleguide specimens) and its applied declaration is byte-identical. |
| `.pline { margin: 0 0 4px }` | The old `$ whoami` / prompt-line wrapper. Zero real consumers (grep hits were all "disci**pline**" substrings). Dropped from /about in #87; nothing renders it now. |
| `.attrib { ... }` (+ its 3-line comment) | The third-party license credit line. The article template no longer renders it: the CC BY attribution moved to `/credits` (#135), documented in `[slug].astro:211` ("attribution ... lives on /credits"). Zero `class="attrib"` in any consumer; every `attrib` hit in `src/` is the words "attribute"/"attribution" in prose or comments. |

## 2. Stale comment (applied)

`terminal.css`, daylight-chat-panel block (was line ~794): the comment read *"Keyed the same three ways **the hero band** uses..."*. The hero band was removed (#199; no `HeroBand` component, no `hero` class remains). Reworded to *"Keyed the same three ways **global.css keys its tokens**..."*, the actual live source of the three-way pattern (system media query + `:root[data-theme="light"]` + `:root[data-theme="dark"]`). Comment-only; **zero built-CSS delta** (comments are stripped by the bundler).

Every other retired-design reference in the CSS comments was checked and is **accurate history**, not stale: the `.atop`/`.anavtop`/bracket-chip/`[home]` retirements (terminal.css 1489, 1585), the "OLD bottom composer dock RETIRED" note (1374), the "homepage slab retired in favor of the masthead + flow bar" notes (603, 636, ~741, ~1072). These correctly document what was removed and why; left as-is.

## 3. Duplication (item 3): inspected, nothing safely collapsible

The obvious repetition is the sky-palette triplication in `scene.css` + `live.css` (each of ~7 palettes written under a system media query, a `[data-theme="dark"]` override, and a `[data-theme="light"]` override, twice over: container-scoped facade + slot-scoped live) and the same three-way token repetition on `.slab-chat` / `.hchat:not(.chatcomposer)` in `terminal.css`. **This is not accidental duplication**: it is the documented theme-toggle keying pattern (the `[data-theme]` overrides must out-specify the media query in both directions, and the facade vs live copies live on different ancestors so an outgoing sky keeps its palette mid-crossfade). Hand-collapsing any of it changes specificity or the crossfade and would violate the no-visual-change bar. Left untouched; called out below as a structural note for a future build-time (Sass map / token-gen) pass, not a manual edit.

## 4. Structural proposal (propose only, NOT applied)

`terminal.css` is 1747 lines grown by accretion. Current section order (post-edit line numbers):

```
 13  layout: .wrap, scene-gutter breakpoint, .screen, .d/.cmt, .caret
 69  global site header (.shead/.idrow/.wm/.snav/.hchat family/home masthead)
408  editorial identity (.cid/.crole/.cco/.cprofiles/.cvia/.ext)
584  chat-surface buttons (.cbtn, .hint)          <-- chat concern
629  the slab material (.slab)                     <-- chat concern
707  /chat: one joined object (.slab-chat ...)     <-- chat concern
986  the log as a ledger (.clog/.lentry ...)       <-- INTERRUPTS the chat cluster
1084 site footer (.sfoot)                          <-- INTERRUPTS the chat cluster
1127 the chat screen bits (.uline/.reply/.out)     <-- chat concern, resumes
1210 contact flow (.contact-*/.cc-*)              <-- chat concern
1291 redirect countdown (.rdx-*)                   <-- chat concern
1319 thinking indicator (.thinking/.tdots)         <-- chat concern
1397 prose (about + article)
1500 article pages (.artpad/.atitle/.astats)
1578 article prev/next nav
1653 article figures
1721 small screens (media queries)
```

The one real smell: **the chat surface is bisected.** Everything from 584 to 1319 is the chat/slab surface *except* the ledger (986) and footer (1084) wedged into the middle. Two options, in order of preference:

- **(A) Minimal in-file reorg (recommended, low-risk):** move the ledger (986-1083) and footer (1084-1126) blocks to sit *after* the identity block (408-583) and *before* the chat cluster, so the whole chat surface (buttons -> slab -> /chat object -> screen bits -> contact -> redirect -> thinking -> keybar) is one contiguous region. Add a short table-of-contents header block listing the sections in file order. Pure block moves + a comment; verifiable by the same before/after critical-CSS diff used here (must stay identical).
- **(B) File split (cleaner, more effort):** split into surface partials imported by `global.css` after the base: `layout.css`, `header.css`, `identity.css`, `chat.css` (slab + composer + transcript + contact + redirect + thinking + keybar + `.cbtn`/`.cmdlink`), `ledger.css`, `article.css` (prose + article + figures + nav), `footer.css`. Idiomatic here (global.css already `@import`s terminal + scene). Bigger diff, so gate it behind the same identical-render proof.

Either is a separate, reviewable unit of work; not done under this no-visual-change audit.

## 5. Left because uncertain (NOT deleted)

- **`.prose figure.portrait`** (terminal.css figures section): no markdown currently uses `<figure class="portrait">`, so the rule has no live consumer *today*. But it is not a retired-design orphan: it is the documented article-visuals authoring hook for narrowing the plate on phone captures (portrait screenshots). Deleting it removes a content-authoring affordance, not dead design. **Left for Brian's call:** keep as a documented figure API, or drop if portrait plates are off the table. (`.prose figure.portrait > p:has(img) { max-width: 300px }`.)
- **`contact-*` dynamically-composed classes:** verified live by reading `terminal.ts`, not deleted on a literal-miss. `.contact-send`, `.contact-actions`, `.contact-edits`, `.contact-confirm`, `.contact-warn`, `.cc-intro`, `.cc-fields`, `.cc-hint` all render from `renderContactConfirm`/edit-row builders (terminal.ts ~1410-1475). All alive.
- **`.snav-spec`:** styleguide-only inert specimen (styleguide.astro 77/78/113/114). Alive.
- Unstyled classes emitted by `terminal.ts` (`.lbl`, `.rdx-tail`) have no CSS rule and need none (structural containers). Not in scope (I only touch CSS); noted so a future auditor does not mistake them for a gap.

## 6. Verification

- `npm run build` (= `astro check && astro build`): **green**, 12 pages, before and after.
- **Identical-render proof:** extracted the inlined critical CSS (`build.inlineStylesheets: "always"` inlines the whole bundle per page) for `/`, `/gold-coast`, `/chat`, `/about`, `/credits`, `/styleguide`, `/google-android-for-work`, before and after. Normalized (one rule per line) and diffed. Every page's diff is **exactly** the four removals (`.p`, `.k`+`.br` collapsing to `.d`, `.pline`, `.attrib`) and nothing else. `.d`/`.cmt` byte-identical; the comment reword produced zero delta. No selector, declaration, or value changed anywhere else. Only removals of provably-unapplied rules.
- House rules: zero em dashes in the CSS files (verified); no co-author trailer (no commit made; working tree left for the lead).

Files touched: `src/styles/terminal.css` only.
