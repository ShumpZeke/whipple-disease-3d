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
- **A scene, not slides.** No arrows, Next buttons, page numbers or side rail. The 3D fills the
  screen, the words for each part sit quietly in the bottom-left corner, and the presenter moves by
  swiping on the board, scrolling, or a clicker. Every move is a zoom that settles on the next part.
- **Plain words.** Each part has a short heading and a few sentences written the way you would
  explain it to a friend. No “Fact 1” labels, no em dashes or dots between words (a unit test checks
  this). Word parts are explained in the sentences, e.g. “Arthr means joint and algia means pain.”
  The presenter’s own lines are in a printable guide (`?guide`), not on the big screen.
- **Type in the style of igloo.inc.** IBM Plex Mono for small labels and links (“//” and “//////”,
  thin underlined 3D labels with crosshair markers), IBM Plex Sans for everything people read, and
  Unbounded for the title like a logo. A faint dot grid and corner marks; headings decode into
  place. The colours stay warm (igloo.inc’s icy palette was not copied).
- **Runs on slow computers without losing anything.** Every device gets the same scenes, detail and
  effects. The work is cut instead: dense fields of villi are drawn front to back so the graphics
  card skips hidden surfaces; the diagnosis set-ups the camera is not looking at are not drawn at
  all (the microscope view went from about 490,000 triangles to about 300); scenes that move by
  themselves are paced at 60 frames a second. Weak devices (software rendering, phone, tablet and
  smart-board graphics, basic Intel graphics, 4 or fewer CPU cores, 4 GB or less memory) also draw
  at the screen’s own resolution instead of above it and pace moving scenes at 30 frames a second.
  A device that keeps dropping frames lowers its resolution step by step and remembers it.
  `?lite` and `?hq` force either mode.
- **Smart board ready.** Text scales with the screen (a 1080p board shows about 48 px headings and
  25 px text); a Full screen link (and **F**); swipes, wheel and trackpad always settle on a part, and
  quick clicks queue up; the 3D is drawn at no more than about 2600 pixels across so 4K boards stay
  smooth; browsers without WebGL 2, or a crash in the 3D, fall back to still pictures; going full
  screen keeps your place.
- **A home screen that guides the viewer.** The title with the student’s name and class in the
  top-left corner, a short “About” with the definition, pronunciation and modern spelling in the
  top-right corner, the digestive system in the middle, and a list of the parts (History, The
  disease, The cause, Symptoms, Diagnosis, Treatment, Quick check, Sources) that jumps to each one.
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
| Main bundle (home screen, history pages, captions, UI) | 293 kB (93 kB gzip) |
| 3D bundle, loaded in the background while the home screen is up | 1.16 MB (321 kB gzip) |
| CSS | 43 kB (10 kB gzip) |
| Organ models (4 files, meshopt-compressed) | 1.08 MB |
| Home-screen picture (WebP with transparency) | 76 kB |
| Archive scans (WebP) | 0.3 MB |

- The 3D code starts downloading on idle while the home screen is up.
- Each 3D world is mounted ahead of need and its shaders compiled in the background
  (`compileAsync`); a fixed light rig and a 3D noise texture keep shader compile time short.
- The canvas renders only while something moves, at most 60 frames a second (30 on lite devices);
  resolution adapts to the device and steps down only if frames are dropped.
- Opaque instanced villi are sorted front to back once, so hidden surfaces fail the depth test
  before shading; only the diagnosis set-up the camera is at is drawn.
- Triangles drawn per view, full detail everywhere: body 154k, wall 610k, villi 165k, cells 233k,
  biopsy 429k, microscope 0.3k, PCR 68k.
- `prefers-reduced-motion`: stops jump instead of flying.
- Without WebGL the page shows still renders of each scene with all captions, quiz and sources.

## Verification

| Check | Result |
| --- | --- |
| `npm run build` (type-check + build) | passes |
| `npm run lint` (oxlint) | 0 warnings |
| `npm test`, 38 unit tests | all pass: story order, caption length, plain wording (no em dashes, dots or fact numbers on screen), a presenter script for every part, terms with word parts, the four facts cited, citations resolve, name correction, quiz answers, zoom maths (world switch at the veil peak, in/out direction), camera poses move consistently through every transition |
| `npm run test:e2e`, 16 browser tests | all pass: home screen (title, modern spelling, definition, name and class, list of parts that jumps, no slide buttons); Whipple profile card; clicker walk through all 17 parts on one scrolling page; mouse-wheel zoom; smart board 1920×1080 touch (text size, swiping forward and back settles on a part, a tiny swipe falls back, Full screen link); summary leads to the sources; lite mode; printable presenter guide; small-intestine marker; self-check (tapping the organ on the 3D model, choices, wrong then right feedback); Sources and Terms panels, definitions and source numbers; name correction; reduced motion; no-WebGL fallback; laptop 1366×768 and phone 390×844 |
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
