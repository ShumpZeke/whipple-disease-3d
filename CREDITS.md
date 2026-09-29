# Credits

## Images, 3D models and media

| What | Creator / source | License |
| --- | --- | --- |
| 3D kidneys, ureters, bladder, adrenal glands, aorta and vena cava (also the drawing in the book) | [BodyParts3D](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html), © The Database Center for Life Science (DBCLS) | CC BY-SA 2.1 Japan |
| Portrait of Max Wilms | Wellcome Collection, via [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Portrait_of_Max_Wilms._Wellcome_M0017800.jpg) | CC BY 4.0 |
| The study (Max Wilms at his desk, his lamp, books and the 1899 book on its stand) | Created for this project: modelled in code with Blender (`scripts/build_study.py`) | Original work (MIT, with the code) |
| Tumor, kidney cross-section, nephron, cells, DNA, ultrasound and CT scenes; the book's pages; paper and grain textures | Created for this project (procedural 3D and code) | Original work (MIT, with the code) |
| Typefaces: IBM Plex Sans, IBM Plex Mono, Unbounded | IBM; The Unbounded Project Authors (via Fontsource) | SIL Open Font License 1.1 |

**About the BodyParts3D model.** The meshes were combined, hole-filled, remeshed, smoothed,
simplified and given baked shading in Blender, then compressed (meshopt). As required by
CC BY-SA 2.1 JP, the modified model in `public/models/` is shared under the same license
(`public/models/LICENSE.txt`). BodyParts3D, © The Database Center for Life Science, licensed
under CC Attribution-Share Alike 2.1 Japan.

**About the illustrations.** The tumor on the 3D kidney, the cut-open kidney, the nephron, the
cells, the DNA and the two scan pictures are illustrations: not to scale, with colours chosen for
clarity. The ultrasound and CT pictures are drawings made in code, not patient images.

**About the study.** The room, the desk and the man writing at it were built from simple shapes
by a Blender script, with ambient occlusion baked into the vertex colours. The figure is seen from
behind and is not a likeness of Max Wilms. The title page reproduces the real title of his 1899
book; the plate's drawing is the 3D model of the urinary organs, pressed flat onto the page.

**About the portrait.** “Portrait of Max Wilms”, Wellcome Collection, licensed under Creative
Commons Attribution 4.0 (CC BY 4.0). Resized and converted to WebP.

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
