# Build report

**Project:** Wilms tumor, interactive 3D exhibit (Medical Terminology, eponym #27)
**Students:** Vardhmansinh Rathod, Eren Robinson and Shanya Prezy · 3rd Block
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
outlook (one kidney, about 9 in 10 survive) → summary → quick check → the list of sources, terms and
credits.

This version replaces an earlier exhibit about Whipple’s disease, which was the wrong eponym for
this student (the class list gives #27, Wilms tumor, Max Wilms). The Whipple version stays in the
git history.

### Design decisions

- **One page, not slides.** The scroll position drives the camera directly, so wheel, trackpad,
  touch, keyboard and presenter clickers all move the same zoom, and it can be scrubbed backwards.
  No arrows, Next buttons, page numbers or side rail.
- **One world, one continuous zoom.** Every scene is nested inside the one before it, like *Powers
  of Ten*: the study holds Max Wilms’s book, the drawing on its plate is the 3D urinary system, the
  cut-open left kidney holds one filter (a nephron) in its outer layer, beside it sits a clump of
  young cells, and one cell holds the DNA. The camera flies through the levels without cuts, fades
  or veils. Distance changes geometrically, so every second of scrolling zooms by the same factor,
  and the point being entered stays in view. The background is the same dark space throughout.
  Unit tests check that the nesting sizes are right and that no step of any transition jumps.
- **The history is a place.** The home screen is Max Wilms writing at his desk in 1899, seen from
  behind. At “Dr. Max Wilms” the camera comes round to his face and he looks up at the class: a
  simple likeness built in Blender from his portrait (cropped grey hair receding from a high
  forehead, brush moustache, tall collar, bow tie), next to the portrait itself. The camera then
  passes over his shoulder to his book on its stand, open at the real title page and a plate; as it
  leans in he dissolves, leaving his book. The plate’s drawing is the 3D model pressed flat as an engraving: zooming
  into it, a sweep develops it into full colour while the paper and the room dissolve.
- **The kidney opens like a book.** Its cut face is painted from the model’s real outline (cortex,
  pyramids, pelvis, vessels). Diving into the outer layer, the painted filters become real ones and
  the surface opens around the one the camera enters.
- **The story happens on the model.** The tumor grows on the lower half of the left kidney as the
  camera arrives at “A lump in the belly”; at “Treatment” that kidney glows, and scrolling on lifts it
  out with its ureter, leaving one kidney for “The outlook”. It comes back, healthy, for the quiz.
- **Plain words.** Each part has a short heading and one or two short, simple sentences (a unit
  test keeps every caption under 25 words), written the way you would explain it to a friend. No “Fact 1” labels, no em dashes or dots between words (a unit test checks
  this). Word parts are explained in the sentences, e.g. “Nephr means kidney and ectomy means
  removal.” The presenter’s own lines are in a printable guide (`?guide`), not on the big screen.
- **A one-minute talk.** The page still zooms through every scene, but the clicker, keyboard and swipes stop at ten of them (home, Max Wilms, the name, what it is, how it starts, the lump, finding it, treatment, the summary, the quiz); the camera flies through the others.
- **A real quiz.** Five big multiple-choice questions (A to D), one try each, green or red, then the results: the score, the percentage and every answer.
- **An infographic.** The home screen and the summary lead with three numbers (about 600 children
  a year in the U.S., 5% of childhood cancers, 93% alive 5 years later), and the stops carry small,
  flat charts: age at diagnosis, blood filtered vs urine made, a million filters per kidney, 90% not
  inherited, 5 to 10% in both kidneys, signs at diagnosis, and 93 of 100 dots. Every number is
  copied from a cited source (a unit test checks each chart cites one).
- **Immersive.** After the home screen the corner menu, the dot grid and the frame marks step
  away, so only the scene and its words are on screen; the menu comes back when a mouse moves to
  the top edge.
- **Type in the style of igloo.inc** on the exhibit’s own warm palette: IBM Plex Mono for small
  labels and links, IBM Plex Sans for reading, Unbounded for the title.
- **Runs on slow computers without losing anything.** Every device gets the same scenes. While the
  page loads, every shader is compiled and the key moments of the journey are drawn once off screen,
  so nothing compiles in the middle of a zoom (the usual cause of a stutter). The heaviest views are
  the study (about 130,000 triangles) and the cells around the DNA (about 210,000 triangles in 20
  draw calls); parts far out of sight during the dive are not drawn. Weak devices draw at the
  screen’s own resolution and pace moving scenes at 30 frames a second; a device that keeps dropping
  frames once loaded steps down and remembers it. `?lite` and `?hq` force either mode.

### Content accuracy

Every medical statement has an inline marker pointing to one of 17 references (National Cancer
Institute, American Cancer Society, MedlinePlus, NIDDK, OpenStax, the NCI dictionary, and three
peer-reviewed articles on Max Wilms). The history uses only what those articles state: born 1867,
the 1899 book at age 32 while a young surgeon in training, professor in 1904, died in 1918 during
World War I from an infection caught while operating. The 1899 book appears with its real German
title, typeset for the exhibit (not a scan of the original). The scans are drawings labelled “Illustration, not a patient image”; the zoomed-in
scenes are labelled “Illustration, not to scale”.

## Technology

| Part | Choice |
| --- | --- |
| App | React 19, TypeScript, Vite |
| 3D | three.js r186 via React Three Fiber 9 and drei 10 |
| State | zustand |
| Models | BodyParts3D → Blender (fill holes, voxel remesh, smooth, decimate, AO bake, anchors) → glTF + meshopt; the study modelled by a Blender script (AO baked into vertex colours) |
| Tests | Vitest (unit), Playwright (browser) |

## Sizes

| Asset | Size |
| --- | --- |
| Main bundle (home screen, captions, UI) | 285 kB (90 kB gzip) |
| 3D bundle, loaded in the background while the home screen is up | 1.18 MB (330 kB gzip) |
| Urinary model and study model (meshopt-compressed) | 0.32 MB and 0.47 MB |
| Portrait (WebP) | 61 kB |

## Verification

| Check | Result |
| --- | --- |
| `npm run build` (type-check + build) | passes |
| `npm run lint` (oxlint) | no warnings |
| `npm test`, 37 unit tests | all pass: story order, caption length, plain wording, a script for every stop, terms with word parts, the four facts cited, every citation resolves, history facts, quiz answers, zoom maths, camera poses, the camera never flies through Max Wilms |
| `npm run test:e2e`, 16 browser tests | all pass: home screen, Max Wilms at his desk and his book, word parts, clicker walk through all 18 stops, mouse wheel, kidney marker, quiz on the 3D model, sources and terms, reduced motion, lite mode, no-WebGL fallback, 1366×768 and 1920×1080, smart-board swiping and text size, summary to sources, presenter guide |
| Console | no errors or warnings during a full scroll-through |
| Shader programs | 57, all compiled while loading; none compile during a full scroll-through |
| Visual review | screenshots of every stop and transition at 1600×900 |

## Regenerating assets

| Script | Purpose |
| --- | --- |
| `blender -b --python scripts/build_urinary.py -- <outdir>` | build the urinary model from BodyParts3D (set `BP3D_DIR`) |
| `blender -b --factory-startup --python scripts/build_study.py -- <outdir> [preview]` | build the study (desk, figure, lamp, book stand) |
| `npm run assets:models` | compress the Blender exports into `public/models/` (meshopt) |
| `node scripts/fallback-shots.mjs` | re-render the no-WebGL still images into `public/fallback/` |
| `node scripts/journey-shots.mjs <outDir> [w] [h] [t,…]` | screenshots at scroll positions for review |
| `node scripts/record-tour.mjs [out.mp4] [w] [h] [seconds per stop]` | record the full zoom as an MP4 ending with the quiz played through (backup for presenting; needs ffmpeg) |
| open `?guide` and print | the presenter guide |
