// Build gate: the generated glyph cards MUST stay in sync with the live
// pages. Pure node, no browser (Playwright is not available on the Cloudflare
// Pages build machine), and fast (<100ms): it only VERIFIES freshness, it
// never renders. Regeneration is the local `npm run share-cards` command.
//
// Contract (Brian's binding constraint): for every PUBLISHED no-video article
// the card PNG must exist, the manifest must carry a matching entry, and both
// the article title and the glyph appearance (a sha256 over the three scene
// files that define what a mark looks like) must equal what the live page
// would render today. Any drift fails the build and names the fix.
//
// Exempt: video articles (they emit og:video + a poster, no glyph card) and
// drafts (they generate no page). Keys off the real collection entries on
// disk, never a hardcoded slug list.

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..", "..");
const articlesDir = path.join(repoRoot, "src", "content", "articles");
const shareDir = path.join(repoRoot, "public", "share");

// The three files that define glyph appearance. Order is load-bearing: the
// capture command hashes the SAME files in the SAME order, so the two hashes
// only agree when the cards were generated against these exact sources.
const GLYPH_FILES = [
  path.join(repoRoot, "src", "scripts", "scene", "sources.ts"),
  path.join(repoRoot, "src", "scripts", "scene", "marks.generated.ts"),
  path.join(repoRoot, "src", "scripts", "scene", "palettes.ts"),
];

function glyphHash() {
  const h = createHash("sha256");
  for (const f of GLYPH_FILES) h.update(readFileSync(f, "utf8"));
  return h.digest("hex");
}

// Minimal frontmatter read (the same shape the capture command uses): title +
// draft off the YAML block, video presence off the body via the <video regex.
function scanArticle(slug) {
  const md = readFileSync(path.join(articlesDir, slug, "index.md"), "utf8");
  const fm = md.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? "";
  const field = (key) => {
    const m = fm.match(new RegExp(`^${key}:\\s*(.*)$`, "m"));
    if (!m) return undefined;
    let v = m[1].trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    )
      v = v.slice(1, -1);
    return v;
  };
  const body = md.replace(/^---\r?\n[\s\S]*?\r?\n---/, "");
  return {
    slug,
    title: field("title"),
    draft: field("draft") === "true",
    hasVideo: /<video[^>]*\bsrc="/.test(body),
  };
}

function main() {
  const hash = glyphHash();
  let manifest = { cards: {} };
  const manifestPath = path.join(shareDir, "manifest.json");
  const manifestExists = existsSync(manifestPath);
  if (manifestExists) {
    try {
      manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    } catch {
      manifest = { cards: {} };
    }
  }

  const slugs = readdirSync(articlesDir).filter((s) =>
    existsSync(path.join(articlesDir, s, "index.md"))
  );
  const cards = slugs
    .map(scanArticle)
    .filter((a) => !a.draft && !a.hasVideo);

  const errors = [];
  for (const a of cards) {
    if (!existsSync(path.join(shareDir, `${a.slug}.png`)))
      errors.push(`${a.slug}: public/share/${a.slug}.png is missing`);
    const entry = manifest.cards?.[a.slug];
    if (!entry) {
      errors.push(`${a.slug}: no manifest entry`);
      continue;
    }
    if (entry.title !== a.title)
      errors.push(
        `${a.slug}: title is stale (card was made for a different title)`
      );
    if (entry.glyphHash !== hash)
      errors.push(`${a.slug}: glyph is stale (scene sources changed)`);
  }

  if (errors.length) {
    console.error("check-share-cards: share cards are out of sync:");
    for (const e of errors) console.error(`  - ${e}`);
    console.error("\n  Fix: npm run share-cards  (then rebuild)");
    process.exit(1);
  }

  console.log(
    `check-share-cards: ${cards.length} glyph card(s) in sync (glyph ${hash.slice(0, 12)}).`
  );
}

main();
