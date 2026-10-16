# BONES

A structure for living. A free, evidence-graded library of health, fitness and science.

This repository is the test copy of the site, served by GitHub Pages. It is not indexed by
search engines (every page carries `noindex`), but anyone with the link can open it.

## Layout

| Path | Page |
| --- | --- |
| `/` | The BONES site (wireframe): home, pillars, library, tools |
| `/fuel/` | Fuel |
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
- `sw.js` caches pages as they are visited, so the site keeps working with a weak signal.
  It always tries the network first, so testers see the latest version.
- `manifest.webmanifest` and `assets/icons/` let the site be added to a phone home screen.

## Editing the wireframe

The page editor is hidden from visitors. To turn it on in your own browser, open the site
with `?editor=on` at the end of the address. `?editor=off` hides it again.

Edits made that way stay in that one browser until they are saved. Save downloads an HTML
file; changes become part of the site when that file replaces `index.html` in this
repository.
