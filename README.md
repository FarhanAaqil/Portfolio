# A Developer's Voyage — Farhan Aaqil Durrani

My portfolio as a One Piece voyage. You scroll, the Thousand Sunny sails: Foosha Village, Reverse Mountain, Water 7, Skypiea, Egghead and the New World, one island per chapter, with the Straw Hats aboard.

Live: https://aaqilportfolio.vercel.app

## What's in it

- **A real-time 3D world** built with three.js and no model files. The ship, the ten crew members and all six islands are modelled in code, cel-shaded and ink-outlined.
- **Skypiea holds the projects.** It opens with a ledger (repositories, every project, the best five), then walks through the five showcased projects with screenshots from their own repositories. The "Projects built" tile opens a logbook of everything, internship work first.
- **The Sunny never flies.** She rides the Knock-Up Stream up to the White-White Sea, circles Skypiea once while the projects scroll past, and comes back down under a balloon octopus.
- **Look around.** Orbit any island, inspect the ship, or meet the crew one by one.
- **Reading view** and reduced-motion support, native dialogs, keyboard navigation, and all content readable with JavaScript off.

## Run it

It is a static site with no build step.

```bash
python -m http.server 4173
```

Then open http://localhost:4173.

## Edit the content

Text for skills, projects, certifications and the current role lives in `content.json`. After changing it:

```bash
npm install
npm run build:content
```

That rewrites the marked regions of `index.html`. Commit both files.

## Project layout

| Path | What it is |
| --- | --- |
| `index.html`, `world.css`, `voyage3d.css`, `showcase.css`, `mobile.css` | Page and styles |
| `world-engine.js` | Renderer, sea, route and camera |
| `scene/kit.js` | Modelling toolkit: cel materials, primitives, batching, ink outlines |
| `scene/props.js` | Terrain, running water, houses, trees, signs |
| `scene/sunny.js`, `scene/crew.js` | The Thousand Sunny and the Straw Hats |
| `scene/islands/` | One module per island |
| `showcase.js`, `world-navigation.js`, `mobile.js` | Project dialogs, navigation, phone layout |
| `content.json`, `build-content.mjs` | Content and the script that renders it into the page |
| `vendor/` | three.js (MIT) |

## Checks

```bash
npm run check
```

Runs ESLint, confirms `index.html` matches `content.json`, and verifies every local file the page references exists. The same checks run in GitHub Actions on every push.

## Credits

A personal, non-commercial fan project. One Piece and its characters belong to Eiichiro Oda, Shueisha and Toei Animation. All 3D models here were written from scratch for this site.
