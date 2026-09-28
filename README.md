# Whipple’s Disease — an interactive 3D exhibit

**Medical Terminology · Eponym #26 · Vardhmansinh Rathod · 3rd Block**

One continuous page. Scrolling is a camera zoom: from a 1907 autopsy report, into today’s
digestive system, through the wall of the small intestine and its villi, down to the bacterium
*Tropheryma whipplei* — then back out to how the disease spreads, how it is diagnosed and how it is
treated, ending with a short self-check and the sources.

![The home screen](docs/preview.jpg)

![The whole journey, top-left to bottom-right](docs/journey.jpg)

![The list of sources at the end of the page](docs/sources.jpg)

---

## Before you submit

Your name and class are set in [`src/app/config.ts`](src/app/config.ts):

```ts
studentName: 'Vardhmansinh Rathod',
classPeriod: '3rd Block',   // shown on the home screen, the summary and the list of sources
```

Nothing else needs editing.

## Presenting it (smart board, projector or laptop)

1. Open the exhibit in Chrome or Edge on the board and press **F** (or the full-screen button, top
   right) so it fills the screen. Everything the class reads — headlines, text, key terms, buttons —
   grows with the screen, so it stays readable from the back of the room.
2. Move with the **↓ / ↑** arrows on the right (beside the zoom gauge), a clicker, the arrow keys,
   or by swiping up and down on the board. Every move is a smooth zoom that always comes to rest on
   a stop — there are no slide numbers. The gauge shows which part of the story you are in; tap a
   part’s name to jump there.
3. The screen only shows short labels: a coloured tag for the part of the story, a headline, one
   line, and a **Key term** that splits the medical word into its parts (e.g. *arthr-* joint +
   *-algia* pain = joint pain). You do the explaining — the presenter guide has one or two lines to
   say at each stop.

| Do this | To |
| --- | --- |
| **↓** arrow, clicker, **→ / ↓ / Page Down / Space** | zoom to the next stop |
| **↑** arrow, **← / ↑ / Page Up** | go back one stop |
| **Swipe**, scroll wheel or trackpad | zoom continuously; it settles on the next stop |
| **F** | full screen on / off |
| **Home / End** | jump to 1907 / the summary |
| **Drag** the 3D picture | turn it (double-tap or **R** resets it) |
| Tap an **underlined word** | its definition, pronunciation and word parts |
| Tap a **[1] [2] …** marker | the source behind that fact |

After the summary, one more **↓** (or swipe) scrolls into the full list of sources, the medical
terms and the image credits.

### Presenter guide (printable)

Open the exhibit’s address with **`?guide`** on the end (e.g. `http://localhost:4173/?guide`) for a
printable script: what to say at each stop, each key term with its pronunciation, and the answers to
the quiz. Print it or keep it on your phone while you present. There is also a link at the very end
of the exhibit.

Tip: to open straight at a stop, add `?stop=` to the address, e.g. `…/?stop=villi`.

**Backup video.** If the classroom computer can’t run 3D, `node scripts/record-tour.mjs tour.mp4`
records the whole zoom as an MP4 (needs ffmpeg). Without WebGL the page itself still works, with
still pictures instead of 3D.

## Assignment checklist (from the project handout)

**Required content**

| The handout asks for | Where it is in the exhibit |
| --- | --- |
| Correct name and spelling, and the modern term | Home screen: **Whipple’s Disease**, “modern spelling: Whipple disease”, and how to say it |
| Origin: the person it is named for | Stop 2: profile card of **George Hoyt Whipple** (1878–1976) |
| Brief historical profile and why the name stuck | Stops 2–4: his life in four dates, the 1907 case, and why the disease carries his name — with the class-list correction (“Allen Whipple” → George Hoyt Whipple; Allen O. Whipple was a surgeon) |
| A clear definition in your own words | Home screen and stop 5, “What is Whipple’s disease?” |
| Body system or medical specialty | Stop 5: Body system — digestive system · Specialty — gastroenterology |
| At least four clinical facts | Fact 1 cause · Fact 2 symptoms · Fact 3 diagnosis · Fact 4 treatment (and outlook) |
| At least three terms, word parts, abbreviations or pronunciation tips | A **Key term** box on 9 stops (e.g. *arthr-* joint + *-algia* pain), pronunciation for each, abbreviations PCR, PAS and IV; all 14 terms in the **Terms** panel and at the end |
| At least two visuals with captions or labels | Labeled 3D models (digestive system, intestine wall, villi, cells, microscope, DNA), captioned 1907 scans and portrait |
| Purposeful interactive elements | Menu, ↑ ↓ arrows and zoom gauge, ＋ marker, highlighted 1907 phrases, term pop-ups, healthy/infected switch, 3D model you can turn, quiz |
| Source numbers that connect to the reference list | Every fact has a `[n]` marker; the full list is at the end |

**Design, research and presenting**

| The handout asks for | Where it is |
| --- | --- |
| Clear title, consistent colors and fonts, readable text, logical sections | Five parts (History · The disease · Four facts · Quick check · Sources); one set of fonts and colors; text sized for a smart board |
| A home screen that introduces the eponym and guides the viewer | Home screen with the definition and a **What’s inside** menu that jumps to each part |
| At least three interaction types | Navigation (menu, ↑ ↓ arrows, zoom gauge) · hotspots (＋ marker, highlighted phrases, labels, term pop-ups) · self-check quiz — plus the 3D model and the healthy/infected switch |
| School-appropriate visuals, patient privacy | No patient photos; the stained slide is an illustration; archival images are public domain |
| At least three credible sources (not Wikipedia or AI) | 17: Merck Manuals, MedlinePlus (NIH), NCBI StatPearls, CDC, OpenStax, NHGRI, NobelPrize.org, peer-reviewed articles, and Whipple’s 1907 paper |
| Paraphrased, numbered citations and a full APA reference page | Yes — the reference page is the end of the exhibit (and [SOURCES.md](SOURCES.md)) |
| Cite all media you did not create | “Images, 3D models and media” at the end, and [CREDITS.md](CREDITS.md) |
| 3–5 minute presentation that explains the organization and features | The presenter guide (`?guide`) is paced for about 5 minutes and starts with the “What’s inside” menu |

**Submission checklist**

- [ ] Shareable link that opens without requesting access — deploy it (see *Deploying*), then test the link in a private window
- [x] Only the assigned eponym, with all required content
- [x] All interactive features work (checked by the browser tests)
- [x] Reference page included (end of the exhibit)
- [x] Student name and class period — “Vardhmansinh Rathod · Medical Terminology · 3rd Block” on the home screen, the summary and the list of sources
- [ ] Proofread and practiced — use the presenter guide

## Running it

Requires Node.js 20.19+ (tested on Node 24).

```bash
npm install
```

```bash
npm run dev
```

Opens a local server with hot reload (Vite). Other scripts:

| Command | What it does |
| --- | --- |
| `npm run build` | type-check and build the static site into `dist/` |
| `npm run preview` | serve the built site at http://localhost:4173 |
| `npm test` | unit tests (Vitest): story order, caption length, presenter scripts, key terms, facts, sources, quiz, zoom logic, camera poses |
| `npm run test:e2e` | browser tests (Playwright): full clicker walk, smart-board touch (↑ ↓ taps, swipes, text size), sources page, presenter guide, organ click, quiz, overlays, reduced motion, no-WebGL fallback, laptop and phone sizes |
| `npm run lint` | oxlint |

First time running the browser tests: `npx playwright install chromium`.

## Deploying (Vercel)

The repository is ready to import: on vercel.com choose **Add New → Project**, pick this repository,
keep the detected **Vite** preset (build `npm run build`, output `dist`) and deploy. Any static host
works the same way — upload the contents of `dist/`.

## How it works

- **One page, one number.** The page is 17 screens tall. The scroll position becomes a single
  continuous value `t` (stop 3.5 = halfway between stops 3 and 4) that follows the scroll with a
  little damping. Everything — camera, captions, the fading 1907 pages, the villi flattening and
  recovering — is a pure function of `t`, so it can be scrubbed forwards and backwards
  ([`src/app/journey.ts`](src/app/journey.ts)).
- **The zoom-through.** Within a scene the camera glides. Between scenes it accelerates into a
  surface while that surface’s colour grows from the middle of the screen, then the next scene opens
  up through a hole in the middle and comes towards the camera — like flying out of a tunnel.
  Zooming back out plays the same thing in reverse. ([`src/three/presets.ts`](src/three/presets.ts),
  [`src/three/Director.tsx`](src/three/Director.tsx), `ZoomVeil` in [`src/app/App.tsx`](src/app/App.tsx))
- **1907 → today.** The digestive model first appears as an engraved plate on paper, then a sweep
  “develops” it into the modern model.
- **3D.** three.js through React Three Fiber. Organ models come from BodyParts3D, cleaned up in
  Blender (holes filled, remeshed, smoothed, decimated, ambient occlusion baked) and compressed
  with meshopt (all four models ≈ 1.1 MB). Tissue, villi, cells, the microscope and DNA are
  procedural.

**Performance:** the 3D code loads in the background while the 1907 pages are on screen; each 3D
world is mounted and its shaders compiled ahead of time; frames render only while something moves;
resolution adapts to the device.
**Accessibility:** full keyboard and clicker control, visible focus, captions announced to screen
readers, `prefers-reduced-motion` (jumps instead of flying), and a still-image
version with all the text, quiz and sources when WebGL is unavailable.

## Project layout

```
src/
  app/        journey (scroll → t), store (state), config (name/period), App
  content/    story stops, sources, glossary, quiz, archive highlights
  three/      Stage, Director (camera), presets (poses), anatomy/ tissue/ micro/ diagnosis/ worlds
  ui/         captions, 1907 history layer, HUD and rail, quiz, overlays, term pop-over
  styles/     app.css
public/       models (.glb), home-screen picture, archive scans, textures, fallback stills
e2e/          Playwright tests
scripts/      model/image processing and screenshot helpers
```

## License notes

- **Code:** MIT — see [LICENSE](LICENSE).
- **3D organ models:** modified from BodyParts3D © DBCLS, licensed **CC BY-SA 2.1 Japan**; the modified
  models in `public/models/` are shared under the same license (see `public/models/LICENSE.txt`).
- **1907 article scans and the 1934 portrait:** public domain.
- **Fonts:** SIL Open Font License 1.1.

Full details in [CREDITS.md](CREDITS.md) and [SOURCES.md](SOURCES.md). This exhibit is for education
and is not medical advice.
