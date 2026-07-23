/* Deploy-time font fetch. The LL Circular woff2 files are licensed and are
 * NOT distributed in this repo (see the LICENSE scope note). The live site
 * still ships them: this step downloads the three files into public/fonts/
 * from FONTS_BASE_URL (a private bucket Brian controls) when that env var is
 * present, i.e. on Cloudflare Pages builds and on Brian's machine.
 *
 * Everyone else building this repo gets a graceful degrade, not a failure:
 * the @font-face sources 404 and the metric-tuned "Circular Fallback" (Arial
 * with per-weight size-adjust, see global.css) renders with zero layout
 * shift. That degrade is deliberate and this script must never hard-fail a
 * keyless build.
 */
import { mkdir, writeFile, access } from "node:fs/promises";

const FILES = [
  "circular-book.woff2",
  "circular-medium.woff2",
  "circular-bold.woff2",
];
const DIR = new URL("../../public/fonts/", import.meta.url);

const present = async (f) =>
  access(new URL(f, DIR)).then(
    () => true,
    () => false
  );

const missing = [];
for (const f of FILES) if (!(await present(f))) missing.push(f);

if (missing.length === 0) {
  console.log("fetch-fonts: all present, nothing to do.");
  process.exit(0);
}

const base = process.env.FONTS_BASE_URL;
if (!base) {
  console.warn(
    `fetch-fonts: ${missing.length} font file(s) absent and FONTS_BASE_URL unset; ` +
      "building without the licensed webfonts (Circular Fallback renders instead)."
  );
  process.exit(0);
}

await mkdir(DIR, { recursive: true });
for (const f of missing) {
  const url = `${base.replace(/\/$/, "")}/${f}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`fetch-fonts: ${url} -> HTTP ${res.status}; aborting.`);
    process.exit(1); // a SET but broken FONTS_BASE_URL should fail loudly
  }
  await writeFile(new URL(f, DIR), Buffer.from(await res.arrayBuffer()));
  console.log(`fetch-fonts: fetched ${f}`);
}
