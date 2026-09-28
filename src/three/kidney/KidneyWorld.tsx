import { useMemo, type ReactNode } from 'react';
import * as THREE from 'three';
import { Cites, TermButton } from '../../ui/RichText';
import { createOrganMaterial } from '../anatomy/organMaterial';
import { ORGANS } from '../anatomy/organs';
import { Label3D } from '../Label3D';
import { backGeometry, CORTEX, medullaReach, outlinePoint, PYRAMIDS, SINUS, sectionGeometry } from './kidneyShape';
import { makeSectionTexture } from './sectionTexture';

const tube = (pts: [number, number, number][], r: number) =>
  new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), 64, r, 16, false);

/**
 * Inside a kidney: the left kidney cut in half from top to bottom, seen from the front.
 * The cut face is painted (cortex, pyramids, pelvis, vessels); behind it is the rounded back half,
 * with the renal artery and vein coming in at the notch and the ureter leaving downwards.
 */
export function KidneyWorld({ visible }: { visible: boolean }) {
  const built = useMemo(() => {
    const look = (id: keyof typeof ORGANS, bumpScale: number) =>
      createOrganMaterial({ ...ORGANS[id], bumpScale, bumpStrength: 0.003 }, 1, false);
    const face = new THREE.MeshPhysicalMaterial({
      map: makeSectionTexture(1024),
      roughness: 0.5,
      clearcoat: 0.35,
      clearcoatRoughness: 0.4,
      sheen: 0.25,
      sheenColor: new THREE.Color('#ffd6c8'),
    });
    // where the labels point
    const cortex = outlinePoint(-0.55, CORTEX * 0.45);
    const py = PYRAMIDS[4];
    const pyramid = new THREE.Vector2(Math.cos(py.phi), Math.sin(py.phi))
      .multiplyScalar((py.tip + medullaReach(py.phi)) / 2)
      .add(SINUS);
    return {
      face,
      section: sectionGeometry(),
      back: backGeometry(),
      backMat: look('LeftKidney', 3),
      ureter: tube(
        [
          [-0.36, -0.05, -0.12],
          [-0.52, -0.3, -0.18],
          [-0.5, -0.8, -0.22],
          [-0.4, -1.4, -0.22],
          [-0.34, -2.1, -0.2],
        ],
        0.055,
      ),
      ureterMat: look('Ureters', 6),
      artery: tube(
        [
          [-1.45, 0.34, -0.36],
          [-0.85, 0.24, -0.26],
          [-0.44, 0.1, -0.15],
          [-0.3, 0.06, -0.1],
        ],
        0.06,
      ),
      arteryMat: look('Arteries', 6),
      vein: tube(
        [
          [-1.45, -0.04, -0.34],
          [-0.85, -0.01, -0.25],
          [-0.44, -0.02, -0.16],
          [-0.3, -0.02, -0.1],
        ],
        0.075,
      ),
      veinMat: look('Veins', 6),
      at: {
        cortex: [cortex.x, cortex.y, 0.01] as [number, number, number],
        pyramid: [pyramid.x, pyramid.y, 0.01] as [number, number, number],
        pelvis: [SINUS.x + 0.02, SINUS.y + 0.04, 0.01] as [number, number, number],
        ureter: [-0.52, -0.62, -0.2] as [number, number, number],
      },
    };
  }, []);

  const labels: { at: [number, number, number]; left?: boolean; body: ReactNode }[] = [
    {
      at: built.at.cortex,
      body: (
        <>
          Cortex <small>outer layer</small> <Cites ids={[14]} />
        </>
      ),
    },
    {
      at: built.at.pyramid,
      body: (
        <>
          Medulla <small>inner part</small> <Cites ids={[14]} />
        </>
      ),
    },
    {
      at: built.at.pelvis,
      left: true,
      body: (
        <>
          Renal pelvis <small>urine collects</small> <Cites ids={[14]} />
        </>
      ),
    },
    {
      at: built.at.ureter,
      left: true,
      body: (
        <>
          <TermButton termKey="ureter">Ureter</TermButton> <small>to the bladder</small> <Cites ids={[12]} />
        </>
      ),
    },
  ];

  return (
    <group rotation={[0, 0.12, 0]}>
      <mesh geometry={built.section} material={built.face} position-z={0.002} />
      <mesh geometry={built.back} material={built.backMat} />
      <mesh geometry={built.ureter} material={built.ureterMat} />
      <mesh geometry={built.artery} material={built.arteryMat} />
      <mesh geometry={built.vein} material={built.veinMat} />
      {labels.map((l, i) => (
        <Label3D key={i} visible={visible} position={l.at} interactive>
          <div className={`leader${l.left ? ' leader--left' : ''}`} style={{ animation: `rise 700ms ${400 + i * 150}ms both` }}>
            <span className="leader__line" style={{ width: 34 }} />
            <span className="tag">{l.body}</span>
          </div>
        </Label3D>
      ))}
    </group>
  );
}
