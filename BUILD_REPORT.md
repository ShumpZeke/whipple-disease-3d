# Build report

**Project:** Whipple’s disease — interactive 3D exhibit (Medical Terminology, eponym #26)
**Student:** Vardhmansinh Rathod · class period: *placeholder, edit `src/app/config.ts`*
**Repository:** https://github.com/ShumpZeke/whipple-disease-3d (private)
**Report date:** September 27, 2026

## What was built

A single scrolling web page that works like one long camera move. Seventeen stops, each with one
short caption (32 words or fewer) that a presenter can read aloud or paraphrase:

1907 title → George Hoyt Whipple → the 1907 case → why it carries his name (with the class-list
correction: *George Hoyt* Whipple, not Allen O. Whipple) → the digestive system → the small
intestine → its wall → villi → **Fact 1** the bacterium *Tropheryma whipplei* → **Fact 2** symptoms
(malabsorption) → beyond the gut (joints, heart, brain) → **Fact 3** diagnosis (endoscopic biopsy,
PAS stain, PCR) → **Fact 4** treatment → self-check → summary and sources.

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
- **Uncluttered.** One idea per stop; at most two or three 3D labels at a time; the depth rail names
  only the current section (all names on hover); captions sit in a soft corner shade instead of boxes;
  no dashboards, card grids or full-body figures.
- **History first, then 3D.** The 1907 pages use the real public-domain scans (article, naming
  paragraph, Fig. 9 photomicrograph) over an AI-generated, clearly labelled laboratory film. The
  modern model then appears as an engraved 1907-style plate that “develops” into full colour.

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
| Main bundle (history pages, captions, UI) | 278 kB (88 kB gzip) |
| 3D bundle, loaded in the background while 1907 is on screen | 1.16 MB (320 kB gzip) |
| CSS | 31 kB (7.5 kB gzip) |
| Organ models (4 files, meshopt-compressed) | 1.08 MB |
| Laboratory film (MP4) + poster | 1.4 MB |
| Archive scans (WebP) | 0.3 MB |

- The 3D code starts downloading on idle while the visitor reads the 1907 pages.
- Each 3D world is mounted ahead of need and its shaders compiled in the background
  (`compileAsync`); a fixed light rig and a 3D noise texture keep shader compile time short.
- The canvas renders only while something moves; resolution adapts to the device.
- `prefers-reduced-motion`: stops jump instead of flying, the lab film pauses on its poster.
- Without WebGL the page shows still renders of each scene with all captions, quiz and sources.

## Verification

| Check | Result |
| --- | --- |
| `npm run build` (type-check + build) | passes |
| `npm run lint` (oxlint) | 0 warnings |
| `npm test` — 34 unit tests | all pass: story order, 4 numbered facts, citations resolve, every fact cited, terms defined, name correction, quiz answers, zoom maths (world switch at the veil peak, in/out direction), camera poses move consistently through every transition |
| `npm run test:e2e` — 11 browser tests | all pass: 1907 opening and student credit; clicker walk through all 17 stops on one scrolling page; mouse-wheel zoom; small-intestine marker; self-check (clicking the organ on the 3D model + choices, wrong-then-right feedback); Sources/Terms panels, definitions and source markers; name correction; reduced motion; no-WebGL fallback; laptop 1366×768 and phone 390×844 layouts |
| Console | no errors or warnings during a full scroll-through |
| Visual review | frame-by-frame screenshots of the whole journey at 1600×900, 1366×768 and 390×844 |

## Deployment

- **GitHub:** pushed to a private repository (link above).
- **Vercel:** not deployed — the Vercel CLI is not logged in on this machine. The project is ready to
  import: Vercel → Add New → Project → this repository → keep the Vite preset → Deploy.

## Known limitations

- The class period is a visible placeholder (“Period ___”) until it is set in `src/app/config.ts`.
- Built for a laptop or projector. Phones work (portrait framing, wrapped labels), but the 3D
  scenes are demanding on older phones.
- The laboratory background film is an AI-generated illustration (labelled on screen); all other
  historical images are real archival scans.
- Screenshots and tests were produced with Chromium on Windows (ANGLE/Direct3D 11); other GPUs may
  shade slightly differently.

## Regenerating assets

| Script | Purpose |
| --- | --- |
| `npm run assets:models` | compress Blender exports into `public/models/` (meshopt) |
| `npm run assets:images` | prepare archive scans as WebP |
| `node scripts/fallback-shots.mjs` | re-render the no-WebGL still images into `public/fallback/` |
| `node scripts/journey-shots.mjs <outDir> [w] [h] [t,…]` | screenshots at scroll positions for review |
