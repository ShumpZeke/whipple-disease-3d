# Build report

**Project:** Wilms tumor, interactive 3D exhibit (Medical Terminology, eponym #27)
**Student:** Vardhmansinh Rathod · 3rd Block
**Report date:** September 28, 2026

## What was built

A single scrolling web page that works like one long camera move, made to be presented on a smart
board. Eighteen stops, each with a short heading and a few plain sentences, and on most stops one
key medical term:

Wilms Tumor (home) → Dr. Max Wilms → his 1899 book → why it has his name (nephroblastoma, split into
its word parts) → what Wilms tumor is (the urinary system) → the kidneys → inside a kidney (cortex,
medulla, pelvis, ureter) → a nephron (glomerulus and tubule) → how it starts (young cells that keep
dividing) → changes in genes (WT1) → a lump in the belly (the tumor grows on the 3D kidney) → other
signs (hematuria) → ultrasound → CT scan → treatment (nephrectomy: the kidney is lifted out) → the
outlook (one kidney, about 9 in 10 survive) → quick check → summary → the list of sources, terms and
credits.

This version replaces an earlier exhibit about Whipple’s disease, which was the wrong eponym for
this student (the class list gives #27, Wilms tumor, Max Wilms). The Whipple version stays in the
git history.

### Design decisions

- **One page, not slides.** The scroll position drives the camera directly, so wheel, trackpad,
  touch, keyboard and presenter clickers all move the same zoom, and it can be scrubbed backwards.
  No arrows, Next buttons, page numbers or side rail.
- **The zoom illusion.** Inside a scene the camera glides. Between scenes it dives into a surface
  (the kidney, its cortex, the tubule wall, a nucleus, the tumor, the scan) whose colour grows from
  the centre of the screen; the next scene then opens through a hole in the middle. Pull-backs
  (DNA → the kidney, CT → the operation) play the same effect in reverse. A unit test checks that
  every transition keeps moving in one direction.
- **The story happens on the model.** The tumor grows on the lower half of the left kidney as the
  camera arrives at “A lump in the belly”; at “Treatment” that kidney glows, and scrolling on lifts it
  out with its ureter, leaving one kidney for “The outlook”. It comes back, healthy, for the quiz.
- **Plain words.** Each part has a short heading and a few sentences written the way you would
  explain it to a friend. No “Fact 1” labels, no em dashes or dots between words (a unit test checks
  this). Word parts are explained in the sentences, e.g. “Nephr means kidney and ectomy means
  removal.” The presenter’s own lines are in a printable guide (`?guide`), not on the big screen.
- **Type in the style of igloo.inc** on the exhibit’s own warm palette: IBM Plex Mono for small
  labels and links, IBM Plex Sans for reading, Unbounded for the title.
- **Runs on slow computers without losing anything.** Every device gets the same scenes. The heaviest
  view draws about 70,000 triangles in 10 draw calls (the earlier exhibit peaked at 610,000). Weak
  devices draw at the screen’s own resolution and pace moving scenes at 30 frames a second; a device
  that keeps dropping frames steps down and remembers it. `?lite` and `?hq` force either mode.

### Content accuracy

Every medical statement has an inline marker pointing to one of 17 references (National Cancer
Institute, American Cancer Society, MedlinePlus, NIDDK, OpenStax, the NCI dictionary, and three
peer-reviewed articles on Max Wilms). The history uses only what those articles state: born 1867,
the 1899 book at age 32 while a young surgeon in training, professor in 1904, died in 1918 during
World War I from an infection caught while operating. The 1899 book is described in words, not shown
as a scan. The scans are drawings labelled “Illustration, not a patient image”; the zoomed-in
scenes are labelled “Illustration, not to scale”.

## Technology

| Part | Choice |
| --- | --- |
| App | React 19, TypeScript, Vite |
| 3D | three.js r186 via React Three Fiber 9 and drei 10 |
| State | zustand |
| Model | BodyParts3D → Blender (fill holes, voxel remesh, smooth, decimate, AO bake, anchors) → glTF + meshopt |
| Tests | Vitest (unit), Playwright (browser) |

## Sizes

| Asset | Size |
| --- | --- |
| Main bundle (home screen, history, captions, UI) | 288 kB (91 kB gzip) |
| 3D bundle, loaded in the background while the home screen is up | 1.16 MB (321 kB gzip) |
| Urinary model (meshopt-compressed) | 0.31 MB |
| Home-screen picture and portrait (WebP) | 66 kB and 61 kB |

## Verification

| Check | Result |
| --- | --- |
| `npm run build` (type-check + build) | passes |
| `npm run lint` (oxlint) | no warnings |
| `npm test`, 37 unit tests | all pass: story order, caption length, plain wording, a script for every stop, terms with word parts, the four facts cited, every citation resolves, history facts, quiz answers, zoom maths, camera poses |
| `npm run test:e2e`, 16 browser tests | all pass: home screen, Max Wilms profile and book, word parts, clicker walk through all 18 stops, mouse wheel, kidney marker, quiz on the 3D model, sources and terms, reduced motion, lite mode, no-WebGL fallback, 1366×768 and 1920×1080, smart-board swiping and text size, summary to sources, presenter guide |
| Console | no errors or warnings during a full scroll-through |
| Visual review | screenshots of every stop and transition at 1600×900 |

## Regenerating assets

| Script | Purpose |
| --- | --- |
| `blender -b --python scripts/build_urinary.py -- <outdir>` | build the urinary model from BodyParts3D (set `BP3D_DIR`) |
| `npm run assets:models` | compress the Blender export into `public/models/` (meshopt) |
| `node scripts/cover-art.mjs` | re-render the home-screen picture |
| `node scripts/fallback-shots.mjs` | re-render the no-WebGL still images into `public/fallback/` |
| `node scripts/journey-shots.mjs <outDir> [w] [h] [t,…]` | screenshots at scroll positions for review |
| `node scripts/record-tour.mjs [out.mp4]` | record the full zoom as an MP4 (backup for presenting; needs ffmpeg) |
| open `?guide` and print | the presenter guide |
