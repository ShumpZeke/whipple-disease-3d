# Credits

## Images, 3D models and media

| What | Creator / source | License |
| --- | --- | --- |
| 3D digestive organs, heart, brain and knee (also the home-screen picture) | [BodyParts3D](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html), © The Database Center for Life Science (DBCLS) | CC BY-SA 2.1 Japan |
| Portrait of George Hoyt Whipple (1934) | The Nobel Foundation, via [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:George_Whipple_nobel.jpg) | Public domain (PD-Sweden-photo, PD-1996) |
| 1907 article page, naming paragraph and photomicrograph plates (Figs. 2 and 9) | G. H. Whipple, *Bulletin of the Johns Hopkins Hospital* (1907); scan by the [Internet Archive](https://archive.org/details/sim_johns-hopkins-medical-journal_1907-09_18_198) | Public domain (published 1907) |
| Tissue, villi, cell, microscope, biopsy and PCR scenes; paper and grain textures | Created for this project (procedural 3D and code) | Original work (MIT, with the code) |
| Typefaces: IBM Plex Mono, Unbounded | IBM; The Unbounded Project Authors (via Fontsource) | SIL Open Font License 1.1 |

**About the BodyParts3D models.** The meshes were combined, hole-filled, remeshed, smoothed,
simplified and given baked shading in Blender, then compressed (meshopt). As required by
CC BY-SA 2.1 JP, the modified models in `public/models/` are shared under the same license
(`public/models/LICENSE.txt`). BodyParts3D, © The Database Center for Life Science, licensed
under CC Attribution-Share Alike 2.1 Japan.

**About the illustrations.** Everything below the organ level (the wall, villi, macrophages,
bacteria, stained slide and DNA) is an illustration: not to scale, with colours chosen for
clarity. The stained-slide view is not a patient image.

## Software

| Library | License |
| --- | --- |
| [three.js](https://threejs.org) | MIT |
| [React](https://react.dev) and React DOM | MIT |
| [React Three Fiber](https://github.com/pmndrs/react-three-fiber) and [drei](https://github.com/pmndrs/drei) | MIT |
| [zustand](https://github.com/pmndrs/zustand) | MIT |
| [Vite](https://vite.dev), [Vitest](https://vitest.dev) | MIT |
| [Playwright](https://playwright.dev) | Apache 2.0 |
| [glTF Transform](https://gltf-transform.dev), [meshoptimizer](https://github.com/zeux/meshoptimizer) | MIT |
| [Blender](https://www.blender.org) (model processing, not shipped) | GPL |

## Written content

Made for Vardhmansinh Rathod’s Medical Terminology eponym project. The story, captions, definitions,
quiz and code were produced with the help of Claude (Anthropic), an AI assistant; every fact is
paraphrased from the references in [SOURCES.md](SOURCES.md).
