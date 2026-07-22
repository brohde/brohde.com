/**
 * Theme override (#92, items 7 + 8). The site ALWAYS LOADS DARK: there is no
 * persistence. The header toggle flips a per-visit, in-memory choice; a full
 * page reload resets it and the site opens dark again. This module owns the
 * two-state dark/light toggle in the header (ThemeToggle.astro, #themectl).
 *
 * State model: resolved theme = sessionLight ? "light" : "dark", where
 * sessionLight is a module-level variable that defaults to false. Toggling
 * flips it FOR THE VISIT only, never touching localStorage (the pre-paint gate
 * in BaseLayout also clears the legacy "theme" key so old light pins are gone).
 * The pre-paint gate stamps an EXPLICIT html[data-theme="dark"] before first
 * paint; global.css's :root[data-theme] blocks make the attribute win over
 * prefers-color-scheme in both directions.
 *
 * THE VIEW-TRANSITIONS TRAP: Astro's ClientRouter swap replaces the root
 * element's attributes with the incoming page's server HTML, which carries no
 * data-theme. The module (and sessionLight with it) survives the swap, so the
 * astro:after-swap re-stamp below re-applies the in-visit choice before the new
 * page paints: a client-side nav keeps the visitor's light pick, while a full
 * reload re-evaluates the module and returns to dark.
 *
 * <meta name="theme-color"> is a single tag (dark by default in BaseLayout).
 * syncMeta rewrites its content to match the resolved theme so browser chrome
 * tracks the ground. The swap replaces <head> too, so apply() re-runs from the
 * same after-swap hook.
 *
 * Scope of effect: data-theme lives on :root and recolors the editorial
 * surfaces only. The slab and every phosphor material scope their own fixed
 * night tokens directly on the element, so the machine stays always-night
 * under either theme (#67 material rule). The scene watches data-theme
 * (scene/index.ts) and follows it in both themes.
 *
 * VT safety (E5): listeners are delegated on document and attached exactly
 * once behind window.__themeInit; the button node itself is replaced on every
 * swap, the delegated handler survives it.
 */

type Theme = "light" | "dark";

const DARK_COLOR = "#0E1512";
const LIGHT_COLOR = "#FBFBF8";

/** the visitor's in-visit choice; defaults to dark and is never persisted, so
    a full page reload re-evaluates this module and returns to dark. It
    survives ClientRouter swaps because the module is not re-evaluated on
    client-side navigation. */
let sessionLight = false;

function resolved(): Theme {
  return sessionLight ? "light" : "dark";
}

/** keep browser chrome in step with the resolved ground */
function syncMeta(t: Theme) {
  const color = t === "light" ? LIGHT_COLOR : DARK_COLOR;
  for (const m of document.querySelectorAll<HTMLMetaElement>(
    'meta[name="theme-color"]'
  )) {
    m.setAttribute("content", color);
  }
}

/** stamp the resolved theme explicitly on :root + sync the meta */
function apply(t: Theme) {
  document.documentElement.setAttribute("data-theme", t);
  syncMeta(t);
}

/* polite live region for state changes: the button's accessible name flips
   with the visible label (CSS keyed on html[data-theme]), but a name change
   on the focused element is not reliably announced, so state changes are also
   spoken here. The region lives in <body> and is removed by every router swap;
   ensureRegion re-creates it ahead of use so announcements land in a region
   that already exists in the accessibility tree. */
const REGION_ID = "theme-announce";

function ensureRegion(): HTMLElement {
  let el = document.getElementById(REGION_ID);
  if (!el) {
    el = document.createElement("div");
    el.id = REGION_ID;
    el.className = "sr";
    el.setAttribute("aria-live", "polite");
    document.body.appendChild(el);
  }
  return el;
}

function announce(t: Theme) {
  ensureRegion().textContent = t === "light" ? "Light theme" : "Dark theme";
}

function setupOnce() {
  // initial load: the pre-paint gate already stamped data-theme; this pass
  // syncs the meta to the resolved theme (a harmless re-stamp otherwise).
  apply(resolved());
  ensureRegion();

  document.addEventListener("click", (e) => {
    if (!(e.target as HTMLElement).closest?.("#themectl")) return;
    // flip the in-visit choice only; no persistence (a reload returns to dark)
    sessionLight = !sessionLight;
    const t = resolved();
    apply(t);
    announce(t);
  });

  // Astro replaces root attributes (and <head>) on swap; re-stamp before the
  // new page paints so the theme survives every internal navigation.
  document.addEventListener("astro:after-swap", () => apply(resolved()));

  // the swap also removed the live region with the old <body>
  document.addEventListener("astro:page-load", () => ensureRegion());
}

const w = window as unknown as { __themeInit?: boolean };
if (!w.__themeInit) {
  w.__themeInit = true;
  setupOnce();
}

export {};
