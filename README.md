# BONES

A structure for living. A free, evidence-graded library of health, fitness and science.

This repository is the test copy of the site, served by GitHub Pages at
https://nathansix.github.io/BONES/ (the address is case-sensitive: `BONES` in capitals). It is not indexed by
search engines (every page carries `noindex`), but anyone with the link can open it.

## Layout

| Path | Page |
| --- | --- |
| `/` | The BONES site (wireframe): home, pillars, library, tools |
| `/fuel/` | Fuel |
| `/move/` | Move |
| `/staying-put/` | Staying Put |
| `/other-senses/` | Other Senses |
| `/shrinking-jaw/` | The Shrinking Jaw (draft) |
| `/science/black-holes/` | Event Horizon |
| `/science/mirror-molecules/` | The Handedness Book |
| `/science/asteroids/` | Bennu Sample Files |
| `/science/double-slit/` | Double-Slit Experiment |
| `/science/time-well/` | The Time Well |
| `/science/one-atom/` | Single Atom in an Ion Trap |
| `/science/by-size/` | Everything in BONES, by size |
| `/thinking/slow-handover/` | The Slow Handover (draft) |

Shared files:

- `assets/bones.js` runs on every page. It registers the offline worker, keeps links between
  BONES pages in the same tab, and adds a "BONES" home link to pages that have none.
- `assets/bones.js` also holds the evidence sections. Each content page ends with every
  graded claim it uses; tapping a grade chip jumps to that claim's card, and a "Back to
  where you were" button returns to the chip. Pages build their section with
  `BONES.evidence.section()` and register their chips with `BONES.evidence.bind()`.
- `sw.js` caches pages as they are visited, so the site keeps working with a weak signal.
  It always tries the network first, so testers see the latest version.
- `manifest.webmanifest` and `assets/icons/` let the site be added to a phone home screen.
  The icons are the white mark on black; rebuild them with `node tools/icons/make.js`.
- `assets/fonts/` holds the three BONES typefaces, shared by every page:
  - **Bones Display** for short titles (one to three words).
  - **Atkinson Hyperlegible** for anything people read: body text, ledes, buttons, captions.
    It was designed by the Braille Institute for legibility (SIL Open Font License, in
    `assets/fonts/LICENSE-atkinson-hyperlegible.txt`).
  - **Overpass Mono** for labels, numbers and grade chips.
  No page loads fonts from Google any more.
- One palette per kind of page, set by `assets/bones.js` before the page paints: body pages are
  **Paper**, universe pages (everything under `science/`) are **Black**. A page can override this
  with `data-realm="paper"` or `data-realm="black"` on its `bones.js` script tag. There is no Tune
  panel and no visible neon switch; the 1985 neon look is a hidden easter egg (the Konami code on
  a keyboard) on Home, Fuel and Move.
- Build notes in the wireframe show only in the editor, never to visitors.
- Every page has a title ending in "| BONES", a description and a link-preview picture.
  The text lives in `tools/share/pages.json`. After changing it, run
  `python3 tools/share/meta.py` (writes the tags), `python3 tools/move/build.py` (Move), and
  `node tools/share/make.js` (redraws the pictures in `assets/share/`; needs Playwright).
- `404.html` is shown for addresses that don't exist.

## Move

`move/index.html` is built, not edited by hand. The sources are in `tools/move/`:
`body.html` (text and markup), `claims.js` (graded claims), `figure.js` (the lift figures and
their physics), `app.js` (everything interactive) and `style.css`, plus the shared shell in
`tools/shared/`. Rebuild with `python3 tools/move/build.py`.

`node tools/move/check-figure.js` checks every lift animation frame by frame: balance over the
middle of the foot, bar paths, the bar resting on the floor in a deadlift and touching the chest
in a bench press, elbows and knees bending the right way. Run it after changing any pose.

## Editing the wireframe

The page editor is hidden from visitors. To turn it on in your own browser, open the site
with `?editor=on` at the end of the address. `?editor=off` hides it again.

Edits made that way stay in that one browser until they are saved. Save downloads an HTML
file; changes become part of the site when that file replaces `index.html` in this
repository. The saved file has a bare head (no app icons, share tags or `bones.js`), so
copy the edited content into the existing `index.html` rather than swapping the whole file.
