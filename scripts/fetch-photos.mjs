// Download the photo deck from Wikimedia Commons.
//
// Reads scripts/photo-sources.json (object id -> Commons file titles),
// keeps only public-domain or Creative Commons files, saves a 640px
// thumbnail of each into public/photos/ and writes src/photos.json with
// the attribution shown on the in-app credits screen.
//
// Usage: npm run fetch-photos   (needs access to commons.wikimedia.org)
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const API = 'https://commons.wikimedia.org/w/api.php';
const UA = 'PlanetPairs/1.0 (https://github.com/mjaquiery/planet-pairs; toddler matching game)';
const WIDTH = 640;
const MIN_PER_OBJECT = 2;
const OK_LICENSE = /^(public domain|pd\b|cc0|cc[ -]by)/i;

const sources = JSON.parse(readFileSync('scripts/photo-sources.json', 'utf8'));
mkdirSync('public/photos', { recursive: true });

const stripHtml = (s = '') =>
  s.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/\s+/g, ' ').trim();

async function api(params) {
  const url = `${API}?${new URLSearchParams({ format: 'json', formatversion: '2', origin: '*', ...params })}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

async function suggest(name) {
  const r = await api({
    action: 'query',
    list: 'search',
    srnamespace: '6',
    srlimit: '12',
    srsearch: `${name} planet NASA filetype:bitmap`,
  });
  return r.query.search.map((s) => s.title);
}

const photos = [];
const problems = [];

for (const [object, titles] of Object.entries(sources)) {
  const r = await api({
    action: 'query',
    prop: 'imageinfo',
    iiprop: 'url|extmetadata|mime',
    iiurlwidth: String(WIDTH),
    titles: titles.join('|'),
  });
  let n = 0;
  for (const title of titles) {
    const norm = r.query.normalized?.find((x) => x.from === title)?.to ?? title;
    const page = r.query.pages.find((p) => p.title === norm);
    const info = page?.imageinfo?.[0];
    if (!info) {
      problems.push(`${object}: missing ${title}`);
      continue;
    }
    const meta = info.extmetadata ?? {};
    const license = stripHtml(meta.LicenseShortName?.value) || 'unknown';
    if (!OK_LICENSE.test(license)) {
      problems.push(`${object}: skipped ${title} (licence: ${license})`);
      continue;
    }
    const ext = (info.thumbmime ?? info.mime) === 'image/png' ? 'png' : 'jpg';
    const file = `${object}-${++n}.${ext}`;
    const res = await fetch(info.thumburl ?? info.url, { headers: { 'User-Agent': UA } });
    if (!res.ok) {
      problems.push(`${object}: download failed ${res.status} for ${title}`);
      n--;
      continue;
    }
    writeFileSync(`public/photos/${file}`, Buffer.from(await res.arrayBuffer()));
    photos.push({
      file,
      object,
      title: norm.replace(/^File:/, '').replace(/\.\w+$/, ''),
      artist: stripHtml(meta.Artist?.value) || stripHtml(meta.Credit?.value) || 'Unknown',
      license,
      source: info.descriptionurl,
    });
    console.log(`ok   ${file}  <- ${norm} [${license}]`);
  }
  if (n < MIN_PER_OBJECT) {
    problems.push(`${object}: only ${n} usable photo(s); candidates:\n    ${(await suggest(object)).join('\n    ')}`);
  }
}

// Remove photos left over from a previous run that are no longer listed.
const keep = new Set(photos.map((p) => p.file));
for (const old of JSON.parse(readFileSync('src/photos.json', 'utf8')).photos ?? []) {
  if (!keep.has(old.file) && existsSync(`public/photos/${old.file}`)) rmSync(`public/photos/${old.file}`);
}
writeFileSync('src/photos.json', `${JSON.stringify({ photos }, null, 2)}\n`);

if (problems.length) {
  console.log(`\nProblems:\n  ${problems.join('\n  ')}`);
  process.exitCode = 1;
}
