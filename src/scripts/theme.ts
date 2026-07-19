/**
 * Theme override (#92, items 7 + 8). The site is DARK BY DEFAULT: absent
 * localStorage("theme") means dark, and "light" is the only stored override
 * (this supersedes #40/#92's old follow-system default). This module owns the
 * two-state dark/light toggle in the header (ThemeToggle.astro, #themectl).
 *
 * State model: resolved theme = stored "light" ? "light" : "dark". Toggling
 * flips it; going light stores "light", going dark clears the key (dark is the
 * default, so it needs no stored value). The pre-paint gate in BaseLayout
 * stamps an EXPLICIT html[data-theme] ("dark" unless stored "light") before
 * first paint, so first paint is dark with no flash unless light is stored;
 * global.css's :root[data-theme] blocks make the attribute win over
 * prefers-color-scheme in both directions.
 *
 * THE VIEW-TRANSITIONS TRAP: Astro's ClientRouter swap replaces the root
 * element's attributes with the incoming page's server HTML, which carries no
 * data-theme. The astro:after-swap re-stamp below re-applies the resolved
 * theme before the new page paints, so the theme survives every internal
 * navigation flash-free; because we always stamp explicitly, the brief
 * attribute-less moment can never fall back to the system scheme.
 *
 * <meta name="theme-color"> is a single tag (dark by default in BaseLayout;
 * the pre-paint gate flips it to light when light is stored). syncMeta rewrites
 * its content to match the resolved theme so browser chrome tracks the ground.
 * The swap replaces <head> too, so apply() re-runs from the same after-swap
 * hook.
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

const KEY = "theme";
const DARK_COLOR = "#0E1512";
const LIGHT_COLOR = "#FBFBF8";

/** the only stored value that means anything is "light"; everything else
    (absent, "dark", garbage) resolves to the dark default */
function storedLight(): boolean {
  try {
    return localStorage.getItem(KEY) === "light";
  } catch {
    return false; // storage blocked: behave as the dark default
  }
}

function resolved(): Theme {
  return storedLight() ? "light" : "dark";
}

function store(t: Theme) {
  try {
    if (t === "light") localStorage.setItem(KEY, "light");
    else localStorage.removeItem(KEY); // dark is the default: no key needed
  } catch {
    /* storage blocked: the in-page override still applied for this view */
  }
}

/** the two-state flip */
function next(cur: Theme): Theme {
  return cur === "light" ? "dark" : "light";
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
    const t = next(resolved());
    store(t);
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
