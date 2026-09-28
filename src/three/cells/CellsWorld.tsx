import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { journey, onJourneyFrame } from '../../app/journey';
import { useStopId, useStory } from '../../app/store';
import { STOP_INDEX } from '../../content/story';
import { Cites, TermButton } from '../../ui/RichText';
import { Label3D } from '../Label3D';
import { mulberry32 } from '../random';
import { membraneMaterial } from '../shaders/membrane';

const uTime = { value: 0 };

/* ----------------------------------------------------------------- A · young cells (x = 0) */

const MATURE = new THREE.Vector3(-1.6, 0.45, 0);
const YOUNG = new THREE.Vector3(1.45, 0.2, 0);
const CELL_R = 0.17;
const GENERATIONS = 6; // 1 → 64 cells
const PERIOD = 1.05; // seconds per round of division

/** 64 places in a ball, filled from the middle outwards (so the clump grows as it divides). */
const SLOTS = (() => {
  const shells: [number, number][] = [
    [0, 1],
    [0.32, 7],
    [0.58, 20],
    [0.82, 36],
  ];
  const out: THREE.Vector3[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (const [r, n] of shells) {
    for (let i = 0; i < n; i++) {
      const y = n === 1 ? 0 : 1 - (2 * (i + 0.5)) / n;
      const rr = Math.sqrt(1 - y * y);
      out.push(new THREE.Vector3(Math.cos(i * golden) * rr, y, Math.sin(i * golden) * rr).multiplyScalar(r));
    }
  }
  return out;
})();
/** Cell i is born from cell i − 2^⌊log2 i⌋, so every round each cell makes one more. */
const PARENT = SLOTS.map((_, i) => (i === 0 ? 0 : i - 2 ** Math.floor(Math.log2(i))));

/** Grown-up kidney cells: one neat ring lining a tiny tube. */
function MatureTubule() {
  const built = useMemo(() => {
    const n = 14;
    const ring = 0.62;
    const cell = new RoundedBoxGeometry(0.25, 0.34, 0.55, 3, 0.07);
    const nucleus = new THREE.SphereGeometry(0.075, 16, 12);
    const cells: THREE.BufferGeometry[] = [];
    const nuclei: THREE.BufferGeometry[] = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const m = new THREE.Matrix4().makeRotationZ(a - Math.PI / 2).setPosition(Math.cos(a) * ring, Math.sin(a) * ring, 0);
      cells.push(cell.clone().applyMatrix4(m));
      nuclei.push(nucleus.clone().applyMatrix4(new THREE.Matrix4().makeTranslation(Math.cos(a) * (ring + 0.07), Math.sin(a) * (ring + 0.07), 0.08)));
    }
    return {
      cells: mergeGeometries(cells)!,
      nuclei: mergeGeometries(nuclei)!,
      cellMat: new THREE.MeshPhysicalMaterial({
        color: '#e4a89d',
        roughness: 0.48,
        sheen: 0.8,
        sheenColor: new THREE.Color('#ffd9cf'),
        clearcoat: 0.25,
        clearcoatRoughness: 0.4,
      }),
      nucleusMat: new THREE.MeshPhysicalMaterial({ color: '#5a3578', roughness: 0.4, clearcoat: 0.4 }),
      edge: new THREE.TorusGeometry(ring + 0.19, 0.012, 8, 120),
    };
  }, []);
  return (
    <group position={MATURE} rotation={[0.18, -0.35, 0]}>
      <mesh geometry={built.cells} material={built.cellMat} />
      <mesh geometry={built.nuclei} material={built.nucleusMat} />
      <mesh geometry={built.edge}>
        <meshStandardMaterial color="#f1dcd4" roughness={0.6} />
      </mesh>
    </group>
  );
}

/** Young cells that never matured, dividing again and again: 1, 2, 4 … 64. */
function YoungCells({ active }: { active: boolean }) {
  const reduced = useStory((s) => s.reducedMotion);
  const [count, setCount] = useState(64);
  const clock = useRef<number | null>(null);
  const built = useMemo(() => {
    const n = SLOTS.length;
    const body = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 3), membraneMaterial('#8a5d8e', '#f6d8ec', 0.14, 0.7, 0.45, uTime), n);
    const nucleus = new THREE.InstancedMesh(
      new THREE.IcosahedronGeometry(1, 2),
      new THREE.MeshPhysicalMaterial({ color: '#4a2766', roughness: 0.35, clearcoat: 0.5, sheen: 0.4, sheenColor: new THREE.Color('#c9a3ff') }),
      n,
    );
    body.frustumCulled = false;
    nucleus.frustumCulled = false;
    return { body, nucleus };
  }, []);

  const m = useMemo(() => new THREE.Matrix4(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const p = useMemo(() => new THREE.Vector3(), []);
  const sc = useMemo(() => new THREE.Vector3(), []);

  const layout = (time: number) => {
    const round = Math.min(GENERATIONS, Math.floor(time / PERIOD));
    const live = 2 ** round;
    const k = Math.min(1, (time - round * PERIOD) / (PERIOD * 0.75));
    const e = k * k * (3 - 2 * k);
    for (let i = 0; i < SLOTS.length; i++) {
      if (i >= live) {
        m.makeScale(0, 0, 0);
      } else {
        const born = round > 0 && i >= live / 2 && time < GENERATIONS * PERIOD + PERIOD;
        p.copy(born ? SLOTS[PARENT[i]] : SLOTS[i]);
        if (born) p.lerp(SLOTS[i], e);
        // a slow wobble, different for every cell
        p.y += Math.sin(uTime.value * 0.9 + i * 1.7) * 0.012;
        sc.setScalar(CELL_R * (born ? 0.6 + 0.4 * e : 1) * (1 + 0.03 * Math.sin(uTime.value * 1.3 + i)));
        m.compose(p, q, sc);
      }
      built.body.setMatrixAt(i, m);
      sc.multiplyScalar(0.58);
      if (i < live) m.compose(p, q, sc);
      built.nucleus.setMatrixAt(i, m);
    }
    built.body.instanceMatrix.needsUpdate = true;
    built.nucleus.instanceMatrix.needsUpdate = true;
    return live;
  };

  useEffect(() => {
    layout(GENERATIONS * PERIOD + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame((_, dt) => {
    if (!active) {
      clock.current = null;
      return;
    }
    // start again from one cell each time the visitor arrives
    if (clock.current === null) clock.current = reduced ? GENERATIONS * PERIOD + 1 : 0;
    clock.current += reduced ? 0 : dt;
    const live = layout(clock.current);
    if (live !== count) setCount(live);
  });

  return (
    <group position={YOUNG}>
      <primitive object={built.nucleus} />
      <primitive object={built.body} renderOrder={2} />
      <Label3D visible={active} position={[0, 1.12, 0]} center>
        <span className="tag" aria-live="polite">
          {count === 1 ? '1 cell' : `${count} cells`}
        </span>
      </Label3D>
      <Label3D visible={active} position={[0.62, -0.55, 0.4]} interactive>
        <div className="leader" style={{ animation: 'rise 700ms 700ms both' }}>
          <span className="leader__line" style={{ width: 36 }} />
          <span className="tag">
            Young cells <small>keep dividing</small> <Cites ids={[3]} />
          </span>
        </div>
      </Label3D>
    </group>
  );
}

function Cause({ active }: { active: boolean }) {
  return (
    <group>
      <MatureTubule />
      <Label3D visible={active} position={[MATURE.x - 0.55, MATURE.y + 0.62, 0.1]} interactive>
        <div className="leader leader--left" style={{ animation: 'rise 700ms 500ms both' }}>
          <span className="leader__line" style={{ width: 34 }} />
          <span className="tag">
            Mature cells <small>line a tiny tube</small> <Cites ids={[3]} />
          </span>
        </div>
      </Label3D>
      <YoungCells active={active} />
    </group>
  );
}

/* ----------------------------------------------------------------- B · DNA (x = 20) */

const LENGTH = 5.2;
const TURNS = 5;
const RADIUS = 0.27;
const GENE = [0.5, 0.74] as const; // stretch of the helix drawn as the WT1 gene
const CHANGE = 0.62; // the changed letter inside it

/** A curve given by a function of t (0..1). */
class Strand extends THREE.Curve<THREE.Vector3> {
  fn: (t: number) => THREE.Vector3;
  constructor(fn: (t: number) => THREE.Vector3) {
    super();
    this.fn = fn;
  }
  getPoint(t: number, out = new THREE.Vector3()) {
    return out.copy(this.fn(t));
  }
}

function helix() {
  const strand = (phase: number) => (t: number) => {
    const a = t * TURNS * Math.PI * 2 + phase;
    return new THREE.Vector3((t - 0.5) * LENGTH, Math.cos(a) * RADIUS, Math.sin(a) * RADIUS);
  };
  const s1 = strand(0);
  const s2 = strand(Math.PI * 0.8);
  const color = (g: THREE.BufferGeometry, pick: (i: number, n: number) => THREE.Color) => {
    const n = g.getAttribute('position').count;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) arr.set(pick(i, n).toArray(), i * 3);
    g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
    return g;
  };
  const inGene = (t: number) => t >= GENE[0] && t <= GENE[1];
  const parts: THREE.BufferGeometry[] = [];
  const gene = new THREE.Color('#f0b44c');
  for (const [fn, base] of [
    [s1, new THREE.Color('#efe7d6')],
    [s2, new THREE.Color('#9fb7c9')],
  ] as const) {
    const path = new Strand(fn);
    const segs = 400;
    const radial = 8;
    const tube = new THREE.TubeGeometry(path, segs, 0.045, radial, false);
    parts.push(color(tube, (i) => (inGene(Math.floor(i / (radial + 1)) / segs) ? gene : base)).toNonIndexed());
  }
  // base pairs: two halves in the colours of their letters
  const letters = ['#e07a5f', '#f2cc8f', '#81b29a', '#3d85c6'].map((c) => new THREE.Color(c));
  const rnd = mulberry32(8);
  const pairs = 120;
  let changeT = CHANGE;
  for (let i = 0; i < pairs; i++) {
    const t = (i + 0.5) / pairs;
    const a = s1(t);
    const b = s2(t);
    if (Math.abs(t - CHANGE) <= 0.5 / pairs) {
      changeT = t;
      continue;
    }
    const pair = Math.floor(rnd() * 2) * 2;
    for (const [from, to, c] of [
      [a, a.clone().lerp(b, 0.5), letters[pair]],
      [a.clone().lerp(b, 0.5), b, letters[pair + 1]],
    ] as const) {
      const len = from.distanceTo(to);
      const g = new THREE.CylinderGeometry(0.022, 0.022, len, 6);
      g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.clone().sub(from).normalize()));
      g.translate((from.x + to.x) / 2, (from.y + to.y) / 2, (from.z + to.z) / 2);
      parts.push(color(g, () => c).toNonIndexed());
    }
  }
  const merged = mergeGeometries(parts)!;
  merged.computeVertexNormals();
  // the changed letter: a brighter, thicker rung
  const ca = s1(changeT);
  const cb = s2(changeT);
  const mid = ca.clone().lerp(cb, 0.5);
  const change = new THREE.CylinderGeometry(0.04, 0.04, ca.distanceTo(cb), 10);
  change.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), cb.clone().sub(ca).normalize()));
  change.translate(mid.x, mid.y, mid.z);
  return { merged, change };
}

const DNA_AT = new THREE.Vector3(20.35, 0.05, -0.1);
const DNA_TILT = new THREE.Euler(0.1, -0.2, -0.43);

function Dna({ active }: { active: boolean }) {
  const reduced = useStory((s) => s.reducedMotion);
  const spin = useRef<THREE.Group>(null);
  const built = useMemo(() => {
    const h = helix();
    return {
      ...h,
      mat: new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.35, clearcoat: 0.6, sheen: 0.3 }),
      changeMat: new THREE.MeshStandardMaterial({ color: '#ff5d4a', emissive: new THREE.Color('#ff3b2a'), emissiveIntensity: 0.6, roughness: 0.3 }),
    };
  }, []);
  useFrame((_, dt) => {
    if (!active) return;
    if (spin.current && !reduced) spin.current.rotation.x += dt * 0.35;
    built.changeMat.emissiveIntensity = reduced ? 0.8 : 0.45 + 0.45 * (0.5 + 0.5 * Math.sin(uTime.value * 3));
  });
  // label points sit on the helix's axis (they don't turn with it)
  const along = (t: number, up = 0) => new THREE.Vector3((t - 0.5) * LENGTH, up, 0).applyEuler(DNA_TILT).add(DNA_AT);
  return (
    <group>
      <group position={DNA_AT} rotation={DNA_TILT}>
        <group ref={spin}>
          <mesh geometry={built.merged} material={built.mat} />
          <mesh geometry={built.change} material={built.changeMat} />
        </group>
      </group>
      <Label3D visible={active} position={along(0.1, RADIUS + 0.08)}>
        <div className="leader leader--left" style={{ animation: 'rise 700ms 450ms both' }}>
          <span className="leader__line" style={{ width: 30 }} />
          <span className="tag">DNA</span>
        </div>
      </Label3D>
      <Label3D visible={active} position={along((GENE[0] + GENE[1]) / 2 - 0.05, RADIUS + 0.06)} interactive>
        <div className="leader" style={{ animation: 'rise 700ms 650ms both' }}>
          <span className="leader__line" style={{ width: 40 }} />
          <span className="tag">
            <TermButton termKey="gene">A gene</TermButton> <small>like WT1</small> <Cites ids={[8]} />
          </span>
        </div>
      </Label3D>
      <Label3D visible={active} position={along(CHANGE, -RADIUS - 0.05)} interactive>
        <div className="leader leader--left" style={{ animation: 'rise 700ms 850ms both' }}>
          <span className="leader__line" style={{ width: 36 }} />
          <span className="tag">
            A change <small>in its code</small>
          </span>
        </div>
      </Label3D>
    </group>
  );
}

/* ----------------------------------------------------------------- world */

export function CellsWorld({ visible }: { visible: boolean }) {
  const id = useStopId();
  const invalidate = useThree((s) => s.invalidate);
  const reduced = useStory((s) => s.reducedMotion);
  const parts = useRef<(THREE.Group | null)[]>([]);
  useFrame((_, dt) => {
    if (visible && !reduced) uTime.value += dt;
  });
  // the two set-ups sit side by side; only draw the one the camera is at (the switch happens
  // behind the veil). Both start visible so the stage compiles every shader up front.
  useEffect(() => {
    const apply = (t: number) => {
      const show = [t < STOP_INDEX.cause + 0.5, t >= STOP_INDEX.cause + 0.5];
      parts.current.forEach((g, i) => {
        if (g && g.visible !== show[i]) {
          g.visible = show[i];
          invalidate();
        }
      });
    };
    apply(journey.t);
    return onJourneyFrame(apply);
  }, [invalidate]);
  return (
    <group>
      <group ref={(g) => void (parts.current[0] = g)}>
        <Cause active={visible && id === 'cause'} />
      </group>
      <group ref={(g) => void (parts.current[1] = g)} position={[0, 0, 0]}>
        <Dna active={visible && id === 'genes'} />
      </group>
    </group>
  );
}
