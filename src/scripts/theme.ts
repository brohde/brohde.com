/**
 * Theme override (#92). The site follows the system scheme by default (#40);
 * this module owns the explicit visitor override behind the toggle in
 * ThemeToggle.astro.
 *
 * State model, a 3-state cycle:
 *   system -> the opposite of the system ground -> the system ground -> system
 * so the first press always visibly flips the page, and the third releases
 * the override back to system-matching. Stored in localStorage("theme") as
 * "light" | "dark"; absent = system. The pre-paint gate in BaseLayout.astro
 * stamps html[data-theme] from storage before first paint, so a stored
 * override never flashes on a hard load; global.css's :root[data-theme]
 * blocks make the attribute win over prefers-color-scheme in both directions.
 *
 * THE VIEW-TRANSITIONS TRAP: Astro's ClientRouter swap replaces the root
 * element's attributes with the incoming page's server HTML, which carries
 * no data-theme. Without the astro:after-swap re-stamp below the override
 * would silently revert to system on EVERY internal navigation. after-swap
 * fires before the new page paints, so the re-stamp is flash-free.
 *
 * <meta name="theme-color"> ships as two static media-scoped tags (#40) that
 * only know the system preference; while an override is active, syncMeta
 * forces the matching tag via its media attribute and restores the media
 * queries on release. The swap replaces <head> too, so apply() (and with it
 * syncMeta) re-runs from the same after-swap hook.
 *
 * Scope of effect: data-theme lives on :root and recolors the editorial
 * surfaces only. The slab and every phosphor material scope their own fixed
 * night tokens directly on the element, which inherit closer than :root, so
 * the machine stays always-night under either override (#67 material rule).
 *
 * VT safety (E5): listeners are delegated on document and attached exactly
 * once behind window.__themeInit; the button node itself is replaced on
 * every swap, the delegated handler survives it.
 */

type Theme = "light" | "dark" | null;

const KEY = "theme";

function stored(): Theme {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : null;
  } catch {
    return null; // storage blocked: behave as system, the toggle still works per page view
  }
}

function store(t: Theme) {
  try {
    if (t) localStorage.setItem(KEY, t);
    else localStorage.removeItem(KEY);
  } catch {
    /* storage blocked: the in-page override above still applied */
  }
}

function sysDark(): boolean {
  return matchMedia("(prefers-color-scheme: dark)").matches;
}

/** the cycle: system -> opposite of system -> same as system -> system */
function next(cur: Theme): Theme {
  const d = sysDark();
  if (cur === null) return d ? "light" : "dark";
  if (cur === "light") return d ? "dark" : null;
  return d ? null : "light";
}

/** The two static media-scoped tags resolve by system preference only;
    while an override is active, force the matching one via its media
    attribute. data-scheme remembers which tag is which once media has been
    rewritten (fresh server HTML after a swap re-derives it). */
function syncMeta(t: Theme) {
  const metas = document.querySelectorAll<HTMLMetaElement>(
    'meta[name="theme-color"]'
  );
  for (const m of metas) {
    const scheme =
      m.dataset.scheme ??
      (m.getAttribute("media")?.includes("light") ? "light" : "dark");
    m.dataset.scheme = scheme;
    m.setAttribute(
      "media",
      t === null
        ? `(prefers-color-scheme: ${scheme})`
        : scheme === t
          ? "all"
          : "not all"
    );
  }
}

/** stamp (or release) the override on :root + keep browser chrome in step */
function apply(t: Theme) {
  const root = document.documentElement;
  if (t) root.setAttribute("data-theme", t);
  else root.removeAttribute("data-theme");
  syncMeta(t);
}

/* polite live region for state changes: the button's accessible name flips
   with the visible label (CSS keyed on html[data-theme]), but a name change
   on the focused element is not reliably announced, so state changes are
   also spoken here. The region lives in <body> and is removed by every
   router swap; ensureRegion re-creates it ahead of use so announcements
   land in a region that already exists in the accessibility tree. */
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
  ensureRegion().textContent = t ? `Theme: ${t}` : "Theme: system";
}

function setupOnce() {
  // initial load: the pre-paint gate already stamped data-theme; this pass
  // syncs the meta tags to the stored override (and is a harmless no-op
  // when there is none)
  apply(stored());
  ensureRegion();

  document.addEventListener("click", (e) => {
    if (!(e.target as HTMLElement).closest?.("#themectl")) return;
    const t = next(stored());
    store(t);
    apply(t);
    announce(t);
  });

  // Astro replaces root attributes (and <head>) on swap; re-stamp before the
  // new page paints so the override survives every internal navigation.
  document.addEventListener("astro:after-swap", () => apply(stored()));

  // the swap also removed the live region with the old <body>
  document.addEventListener("astro:page-load", () => ensureRegion());
}

const w = window as unknown as { __themeInit?: boolean };
if (!w.__themeInit) {
  w.__themeInit = true;
  setupOnce();
}

export {};
