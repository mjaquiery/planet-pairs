# Planet Pairs

A gentle card-matching game for toddlers, using the Sun, the Moon and the
eight planets. Built to be played full screen on an iPad, and it works
offline once it has loaded.

- Pick **4, 8 or 12** cards, then **cartoons** or **photos**.
- Tap a card to turn it over, then tap another. A matching pair flies to
  the tray at the side; a mismatch turns back over.
- In the photo deck the two cards of a pair are *different* photos of the
  same object, so the match is on the object, not the picture.
- When every pair is found they dance, then you can play again or go home.

Grown-up details:

- The home button in a game needs a one-second press and hold, so stray
  taps don't end the game.
- A game in progress is saved in the browser and can be carried on after a
  reload. Finished games are logged (size, deck, flips, time) in local
  storage, ready for future profiles or progress features; nothing is shown
  yet.
- Object names are spoken on a match using the device's built-in voice.
  The speaker button mutes all sound.
- To install on an iPad: open the site in Safari → Share → **Add to Home
  Screen**. Launching from the home screen runs it full screen and offline.

## Development

```sh
npm install
npm run dev          # local dev server
npm test             # unit tests (Vitest)
npm run build        # type-check and build to dist/
npm run test:e2e     # Playwright smoke tests against the built app
```

Plain TypeScript and CSS with Vite; no runtime dependencies. A small build
plugin (`build/service-worker.ts`) writes a service worker that precaches
every built file for offline play.

### Photos

The photo deck comes from Wikimedia Commons (mostly NASA, public domain).
`scripts/photo-sources.json` lists the Commons files for each object;
`npm run fetch-photos` downloads them into `public/photos/` and writes the
attribution into `src/photos.json`, which the in-app credits screen (ⓘ)
shows. Only public-domain and Creative Commons files are accepted. Every
object needs at least two photos.

The **Fetch photos** workflow runs the same script on GitHub whenever the
source list changes on a branch and commits the result back.

### Cartoons

The cartoon artwork (`src/cartoons.ts`) is original SVG drawn for this
project and is covered by the MIT licence with the rest of the code.

## Deployment

`.github/workflows/deploy.yml` publishes to GitHub Pages via the
`gh-pages` branch:

| Trigger | Published at |
| --- | --- |
| push to `main` | site root, e.g. `https://<owner>.github.io/planet-pairs/` |
| pull request into `main` | `/stage/`, e.g. `https://<owner>.github.io/planet-pairs/stage/` |

Releases keep the `stage/` folder; each pull request run replaces it, so
`/stage/` always shows the most recently updated PR.

One-time setup: **Settings → Pages → Build and deployment → Source: Deploy
from a branch → `gh-pages` / `(root)`**. The branch is created by the
first workflow run.
