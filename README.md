# Whipple’s Disease — an interactive 3D exhibit

**Medical Terminology · Eponym #26 · Vardhmansinh Rathod · Period ___**

One continuous page. Scrolling is a camera zoom: from a 1907 autopsy report, into today’s
digestive system, through the wall of the small intestine and its villi, down to the bacterium
*Tropheryma whipplei* — then back out to how the disease spreads, how it is diagnosed and how it is
treated, ending with a short self-check and the sources.

![The digestive system stop](docs/preview.jpg)

![The whole journey, top-left to bottom-right](docs/journey.jpg)

![The list of sources at the end of the page](docs/sources.jpg)

---

## Before you submit

Open [`src/app/config.ts`](src/app/config.ts) and fill in your class period:

```ts
classPeriod: '3',   // shows as “Period 3” on the title and summary
```

While it is empty the exhibit shows a visible **Period ___** placeholder. Nothing else needs editing.

## Presenting it (smart board, projector or laptop)

1. Open the exhibit in Chrome or Edge on the board and press **F** (or the full-screen button, top
   right) so it fills the screen. Everything the class reads — headlines, text, key terms, buttons —
   grows with the screen, so it stays readable from the back of the room.
2. Move with the big **‹ ›** buttons in the bottom-right corner (they show “5 / 17”), a clicker, the
   arrow keys, or by swiping up and down on the board. Every move is a smooth zoom, and it always
   comes to rest on a stop.
3. At each stop, read the big headline and say the one or two lines under it. The gold **Key term**
   box splits the medical word into its parts (e.g. *arthr-* joint + *-algia* pain = joint pain).

| Do this | To |
| --- | --- |
| **‹ ›** buttons, clicker, **→ / ↓ / Page Down / Space** | zoom to the next stop |
| **‹** button, **← / ↑ / Page Up** | go back one stop |
| **Swipe**, scroll wheel or trackpad | zoom continuously; it settles on the next stop |
| **F** | full screen on / off |
| **Home / End** | jump to 1907 / the summary |
| **Drag** the 3D picture | turn it (double-tap or **R** resets it) |
| Tap an **underlined word** | its definition, pronunciation and word parts |
| Tap a **[1] [2] …** marker | the source behind that fact |

After the summary, one more **›** (or swipe) scrolls into the full list of sources, the medical
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

## Assignment checklist

| Requirement | Where it is |
| --- | --- |
| Chronological story: 1907 → Whipple → case → name → body system → organ → facts | Stops 1–15, in that order |
| At least 4 clinical facts | Fact 1 cause · Fact 2 symptoms · Fact 3 diagnosis · Fact 4 treatment |
| At least 3 medical terms, explained | a **Key term** on 9 of the stops, split into word parts; 14 terms in all with pronunciation (**Terms** button, underlined words, and the list at the end) |
| At least 3 credible sources, cited inline | 17 references (Merck Manuals, MedlinePlus, StatPearls/NCBI, CDC, OpenStax, the 1907 paper…) — every fact carries a `[n]` marker; the full APA list is at the end of the page (and behind the **Sources** button) |
| Media credits | End of the page, the Sources panel, and [CREDITS.md](CREDITS.md) |
| At least 3 kinds of interaction | turn the 3D model · hotspot/marker and term pop-ups · healthy-vs-disease toggle · self-check quiz (tap the organ on the model + multiple choice) |
| Student name and class period | Title screen and summary (edit the period in `src/app/config.ts`) |
| Correct eponym | George Hoyt Whipple (1907). The class list’s “Allen Whipple” is corrected on stop 4 — Allen O. Whipple was the surgeon behind the Whipple procedure. |

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
| `npm run test:e2e` | browser tests (Playwright): full clicker walk, smart-board touch (Back/Next taps, swipes, text size), sources page, presenter guide, organ click, quiz, overlays, reduced motion, no-WebGL fallback, laptop and phone sizes |
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
readers, `prefers-reduced-motion` (jumps instead of flying; the lab film stays still), and a still-image
version with all the text, quiz and sources when WebGL is unavailable.

## Project layout

```
src/
  app/        journey (scroll → t), store (state), config (name/period), App
  content/    story stops, sources, glossary, quiz, archive highlights
  three/      Stage, Director (camera), presets (poses), anatomy/ tissue/ micro/ diagnosis/ worlds
  ui/         captions, 1907 history layer, HUD and rail, quiz, overlays, term pop-over
  styles/     app.css
public/       models (.glb), archive scans, lab film, textures, fallback stills
e2e/          Playwright tests
scripts/      model/image processing and screenshot helpers
```

## License notes

- **Code:** MIT — see [LICENSE](LICENSE).
- **3D organ models:** modified from BodyParts3D © DBCLS, licensed **CC BY-SA 2.1 Japan**; the modified
  models in `public/models/` are shared under the same license (see `public/models/LICENSE.txt`).
- **1907 article scans and the 1934 portrait:** public domain.
- **Laboratory background film:** AI-generated for this project (Google Vids); an illustration, not a
  historical record.
- **Fonts:** SIL Open Font License 1.1.

Full details in [CREDITS.md](CREDITS.md) and [SOURCES.md](SOURCES.md). This exhibit is for education
and is not medical advice.
