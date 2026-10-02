// Pulls album artwork, track lists and 30-second previews from Apple's public
// iTunes Search API into src/data/albums.json. Runs before every build; if
// Apple can't be reached, the existing JSON is kept so the build never breaks.
//   node scripts/fetch-albums.mjs
import { readFile, writeFile, mkdir } from "node:fs/promises";

const OUT = new URL("../src/data/albums.json", import.meta.url);

const ALBUMS = [
  { slug: "i-am-music", title: "MUSIC", artist: "Playboi Carti" }, // released as "MUSIC" (working title "I AM MUSIC")
  { slug: "blonde", title: "Blonde", artist: "Frank Ocean" },
  { slug: "certified-lover-boy", title: "Certified Lover Boy", artist: "Drake" },
  { slug: "astroworld", title: "ASTROWORLD", artist: "Travis Scott" },
  { slug: "pink-tape", title: "Pink Tape", artist: "Lil Uzi Vert" },
  { slug: "long-live-asap", title: "LONG.LIVE.A$AP", artist: "A$AP Rocky" },
  { slug: "hurry-up-tomorrow", title: "Hurry Up Tomorrow", artist: "The Weeknd" },
  { slug: "we-dont-trust-you", title: "WE DON'T TRUST YOU", artist: "Future" },
];

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

async function json(url) {
  const res = await fetch(url, { headers: { "user-agent": "portfolio-build" } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

async function fetchAlbum({ slug, title, artist }) {
  // search ranks singles/features first, so go via the artist's own discography
  const artists = await json(
    `https://itunes.apple.com/search?term=${encodeURIComponent(artist)}&entity=musicArtist&limit=5&country=US`,
  );
  const artistHit = artists.results.find((r) => norm(r.artistName) === norm(artist)) ?? artists.results[0];
  let results = [];
  if (artistHit) {
    const disco = await json(`https://itunes.apple.com/lookup?id=${artistHit.artistId}&entity=album&limit=200&country=US`);
    results = disco.results.filter((r) => r.wrapperType === "collection");
  }
  const q = encodeURIComponent(`${title} ${artist}`);
  results = results.concat((await json(`https://itunes.apple.com/search?term=${q}&entity=album&limit=25&country=US`)).results);
  const candidates = results.filter(
    (r) => norm(r.artistName).includes(norm(artist)) && norm(r.collectionName).startsWith(norm(title)),
  );
  if (!candidates.length) throw new Error(`no match for ${title}`);
  // prefer the explicit original over clean / deluxe / instrumental variants
  const score = (r) =>
    (r.collectionExplicitness === "explicit" ? 4 : 0) +
    (norm(r.collectionName) === norm(title) ? 2 : 0) -
    (/deluxe|instrumental|clean|edition|sorry 4 da wait/i.test(r.collectionName) ? 3 : 0);
  candidates.sort((a, b) => score(b) - score(a));
  const album = candidates[0];

  const lookup = await json(`https://itunes.apple.com/lookup?id=${album.collectionId}&entity=song&limit=200&country=US`);
  const tracks = lookup.results
    .filter((t) => t.wrapperType === "track" && t.kind === "song")
    .sort((a, b) => a.discNumber - b.discNumber || a.trackNumber - b.trackNumber)
    .map((t) => ({
      n: t.trackNumber,
      name: t.trackName,
      artist: t.artistName,
      ms: t.trackTimeMillis,
      preview: t.previewUrl ?? null,
    }));

  return {
    slug,
    title: album.collectionName,
    artist: album.artistName,
    year: album.releaseDate?.slice(0, 4) ?? "",
    artwork: album.artworkUrl100.replace("100x100bb", "1000x1000bb"),
    appleUrl: album.collectionViewUrl,
    tracks,
  };
}

let previous = [];
try {
  previous = JSON.parse(await readFile(OUT, "utf8"));
} catch {}

const out = [];
for (const a of ALBUMS) {
  try {
    const album = await fetchAlbum(a);
    out.push(album);
    console.log(`✓ ${album.title} — ${album.artist} (${album.tracks.length} tracks, ${album.tracks.filter((t) => t.preview).length} previews)`);
  } catch (e) {
    const old = previous.find((p) => p.slug === a.slug);
    if (old) out.push(old);
    console.warn(`! ${a.title}: ${e.message}${old ? " — kept previous data" : ""}`);
  }
}

if (out.length) {
  await mkdir(new URL("../src/data/", import.meta.url), { recursive: true });
  await writeFile(OUT, JSON.stringify(out, null, 2) + "\n");
}
