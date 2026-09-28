# Build report

**Project:** Whipple’s disease — interactive 3D exhibit (Medical Terminology, eponym #26)
**Student:** Vardhmansinh Rathod · 3rd Block
**Repository:** https://github.com/ShumpZeke/whipple-disease-3d (private)
**Report date:** September 27, 2026

## What was built

A single scrolling web page that works like one long camera move, made to be presented on a smart
board. Seventeen stops, each with a big headline, one or two short sentences (26 words or fewer)
and, on most stops, one key medical term split into its word parts:

1907 title → George Hoyt Whipple → the 1907 case → why it carries his name (with the class-list
correction: *George Hoyt* Whipple, not Allen O. Whipple) → the digestive system → the small
intestine → its wall → villi → **Fact 1** the bacterium *Tropheryma whipplei* → **Fact 2** symptoms
(malabsorption) → beyond the gut (joints, heart, brain) → **Fact 3** diagnosis (endoscopic biopsy,
PAS stain, PCR) → **Fact 4** treatment → self-check → summary of the four facts → the full list of
sources, medical terms and credits (the page scrolls on into it after the summary).

### Design decisions

- **One page, not slides.** An earlier version stepped between slides. At the student’s request it
  was rebuilt so the whole exhibit is one continuous scroll: the scroll position drives the camera
  directly, so wheel, trackpad, touch, keyboard and presenter clickers all move the same zoom, and
  it can be scrubbed backwards.
- **The zoom illusion.** Inside a scene the camera glides. Between scenes it dives into a surface
  whose colour grows from the centre of the screen; the next scene then opens through a hole in
  the middle and comes towards the viewer. Pull-backs (germ → villi, DNA → villi, villi → body) play
  the same effect in reverse. A unit test checks that every transition keeps moving in one
  direction.
- **An explorer, not a slide deck.** The layout follows anatomy-explorer apps rather than slides:
  a compact information panel on the left with a coloured tag for each part of the story (History,
  The disease, Fact 1–4, Quick check, Summary — each with its own colour and icon), the 3D picture
  in the middle, and a zoom gauge on the right with ↑ ↓ arrows. There are no slide numbers.
- **Type.** Archivo (a grotesque that can narrow, for headings and labels) and Atkinson Hyperlegible
  Next (designed by the Braille Institute to be read easily from far away, for text).
- **Easy to present.** One idea per stop: a headline of a few words, one short line, and a “Key
  term” (e.g. *arthr-* joint + *-algia* pain = joint pain, with how to say it). The screen carries
  labels; the presenter does the explaining. A printable guide (`?guide`) gives a five-minute plan,
  one or two lines to say and what to tap at each stop, likely questions answered from the sources,
  and the quiz answers.
- **Smart board ready.** Text and controls scale with the screen (a 1080p board shows ~63 px
  headlines and ~27 px body text); big ↑ ↓ arrows beside the zoom gauge; a full-screen button
  (and **F**); swipes, wheel and trackpad always settle on a stop, and quick taps queue up (two taps
  = two stops); the 3D is drawn at no more than ~2600 pixels across so big 4K boards stay smooth;
  older browsers without WebGL 2 — or a crash in the 3D — fall back to still pictures instead of a
  blank page; going full screen keeps your place.
- **Uncluttered.** The 3D subject sits to the right, clear of the panel; at most two or three 3D
  labels at a time; no dashboards or full-body figures.
- **A home screen that guides the viewer.** The first screen gives the eponym’s correct and modern
  spelling, how to say it, a one-line definition, the student’s name and class, and a “What’s inside”
  menu of the five parts (History · The disease · Four facts · Quick check · Sources) that jumps
  straight to each one.
- **History first, then 3D.** A profile card of George Hoyt Whipple (1934 portrait and four dates:
  1878, 1905, 1907, 1934, from the Nobel Prize biography), then the real public-domain scans of the
  1907 article, naming paragraph and Fig. 9 photomicrograph. The modern model then appears as an
  engraved 1907-style plate that “develops” into full colour.

### Content accuracy

Every medical statement has an inline marker pointing to one of 17 references (Merck Manuals,
MedlinePlus, StatPearls/NCBI, CDC *Emerging Infectious Diseases*, OpenStax, NHGRI, a 2023 case
report, and the 1907 paper itself). Figures that could not be confirmed in these sources (e.g., an
exact bacterium size or prevalence numbers) were left out rather than guessed. Anything below organ
level is labelled “Illustration · not to scale · colors for clarity”, and the stained-slide view is
labelled as an illustration, not a patient image.

## Technology

| Part | Choice |
| --- | --- |
| App | React 19, TypeScript 6, Vite 8 |
| 3D | three.js r186 via React Three Fiber 9 and drei 10 |
| State | zustand |
| Models | BodyParts3D → Blender (fill holes, voxel remesh, smooth, decimate, AO bake, anchors) → glTF + meshopt |
| Tests | Vitest (unit), Playwright (browser) |

## Performance

| Asset | Size |
| --- | --- |
| Main bundle (home screen, history pages, captions, UI) | 297 kB (93 kB gzip) |
| 3D bundle, loaded in the background while 1907 is on screen | 1.16 MB (320 kB gzip) |
| CSS | 55 kB (12 kB gzip) |
| Organ models (4 files, meshopt-compressed) | 1.08 MB |
| Home-screen picture (WebP with transparency) | 76 kB |
| Archive scans (WebP) | 0.3 MB |

- The 3D code starts downloading on idle while the visitor reads the 1907 pages.
- Each 3D world is mounted ahead of need and its shaders compiled in the background
  (`compileAsync`); a fixed light rig and a 3D noise texture keep shader compile time short.
- The canvas renders only while something moves; resolution adapts to the device.
- `prefers-reduced-motion`: stops jump instead of flying.
- Without WebGL the page shows still renders of each scene with all captions, quiz and sources.

## Verification

| Check | Result |
| --- | --- |
| `npm run build` (type-check + build) | passes |
| `npm run lint` (oxlint) | 0 warnings |
| `npm test` — 37 unit tests | all pass: story order, caption length, a presenter script for every stop, key terms with word parts, 4 numbered facts, citations resolve, every fact cited, name correction, quiz answers, zoom maths (world switch at the veil peak, in/out direction), camera poses move consistently through every transition |
| `npm run test:e2e` — 15 browser tests | all pass: home screen (name, modern spelling, definition, student name and period, “What’s inside” menu jumps); Whipple profile card; clicker walk through all 17 stops on one scrolling page; mouse-wheel zoom; **smart board 1920×1080 touch**: text size, ↑ ↓ taps (two quick taps = two stops), zoom gauge shows the current part, swipe settles on the next stop, a tiny swipe falls back, full-screen button; summary → list of sources; printable presenter guide; small-intestine marker; self-check (tapping the organ on the 3D model + choices, wrong-then-right feedback); Sources/Terms panels, definitions and source markers; name correction; reduced motion; no-WebGL fallback; laptop 1366×768 and phone 390×844 layouts |
| Console | no errors or warnings during a full scroll-through |
| Visual review | screenshots of every stop at 1920×1080, 1366×768 and 390×844, and of each zoom transition |

## Deployment

- **GitHub:** pushed to a private repository (link above).
- **Vercel:** not deployed — the Vercel CLI is not logged in on this machine. The project is ready to
  import: Vercel → Add New → Project → this repository → keep the Vite preset → Deploy.

## Known limitations

- Built for a smart board, projector or laptop. Phones work (portrait framing, wrapped labels), but
  the 3D scenes are demanding on older phones.
- Smart boards with a very old built-in browser (no WebGL 2) show still pictures instead of the 3D;
  plugging a laptop into the board avoids this.
- Screenshots and tests were produced with Chromium on Windows (ANGLE/Direct3D 11); other GPUs may
  shade slightly differently.

## Regenerating assets

| Script | Purpose |
| --- | --- |
| `npm run assets:models` | compress Blender exports into `public/models/` (meshopt) |
| `npm run assets:images` | prepare archive scans as WebP |
| `node scripts/fallback-shots.mjs` | re-render the no-WebGL still images into `public/fallback/` |
| `node scripts/journey-shots.mjs <outDir> [w] [h] [t,…]` | screenshots at scroll positions for review |
| `node scripts/record-tour.mjs [out.mp4]` | record the full zoom as an MP4 (backup for presenting; needs ffmpeg) |
| open `?guide` and print | the presenter guide |
