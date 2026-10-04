import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { journey, smoothstep } from '../../app/journey';
import { useStopId, useStory } from '../../app/store';
import { STOP_INDEX } from '../../content/story';
import { Cites, TermButton } from '../../ui/RichText';
import { view } from '../Director';
import { Label3D } from '../Label3D';
import { useLevels } from '../levels';
import {
  AFFERENT,
  CAPILLARY,
  CELL_R,
  CLUMP_AT,
  CLUMP_SCALE,
  DNA_SCALE,
  DNA_TILT,
  EFFERENT,
  FRONT,
  G,
  GENERATIONS,
  NUCLEUS,
  PARENT,
  POLE,
  POLE_V,
  R_CAPSULE,
  SLOTS,
  TUBULE,
  TUBULE_R,
  WALL,
} from '../nested';
import { mulberry32 } from '../random';
import { membraneMaterial } from '../shaders/membrane';
import { helixGeometry, HELIX } from './dna';

/*
 * One nephron's filter, nested in the kidney's outer layer (illustration, not to scale): a ball of
 * tiny blood vessels (the glomerulus) inside a cup that is cut open at the front. Blood comes in
 * through a small artery; fluid filtered out of it runs down the tubule, and some of it is taken
 * back into a blood vessel running alongside. Part of the tubule's wall is built from cells, and
 * beside it sits a clump of young cells; one of them holds the DNA.
 */

const uTime = { value: 0 };
const v3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const curve = (pts: THREE.Vector3[]) => new THREE.CatmullRomCurve3(pts, false, 'centripetal');

/** The capillary tuft: loops that start and end at the pole and wander around inside the cup. */
function tuftGeometry() {
  const rnd = mulberry32(7);
  const parts: THREE.BufferGeometry[] = [];
  const dir = () => {
    for (;;) {
      const d = v3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize();
      if (d.dot(POLE_V) < 0.45) return d;
    }
  };
  for (let i = 0; i < 17; i++) {
    const jitter = () => v3((rnd() - 0.5) * 0.12, (rnd() - 0.5) * 0.12, (rnd() - 0.5) * 0.12);
    const pts = [
      POLE.clone().add(jitter()),
      G.clone().addScaledVector(dir(), 0.3 + rnd() * 0.1),
      G.clone().addScaledVector(dir(), 0.55 + rnd() * 0.14),
      G.clone().addScaledVector(dir(), 0.5 + rnd() * 0.16),
      G.clone().addScaledVector(dir(), 0.28 + rnd() * 0.12),
      POLE.clone().add(jitter()),
    ];
    parts.push(new THREE.TubeGeometry(curve(pts), 84, 0.048, 8, false));
  }
  parts.push(new THREE.TubeGeometry(AFFERENT, 48, 0.1, 12, false), new THREE.TubeGeometry(EFFERENT, 48, 0.08, 12, false));
  parts.push(new THREE.TubeGeometry(CAPILLARY, 120, 0.045, 8, false));
  return mergeGeometries(parts)!;
}

type Flow = { mesh: THREE.InstancedMesh; place: (i: number, time: number, m: THREE.Matrix4) => THREE.Matrix4 };

function particles(n: number, geo: THREE.BufferGeometry, color: string, place: Flow['place']): Flow {
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.4, emissive: new THREE.Color(color).multiplyScalar(0.25) });
  const mesh = new THREE.InstancedMesh(geo, mat, n);
  mesh.frustumCulled = false;
  return { mesh, place };
}

/** Grown-up kidney cells: the stretch of tubule wall that is drawn cell by cell. */
function wallCells() {
  const frames = TUBULE.computeFrenetFrames(400, false);
  const cell = new RoundedBoxGeometry(1, 1, 1, 2, 0.28);
  const nucleus = new THREE.SphereGeometry(1, 12, 9);
  const n = WALL.rings * WALL.around;
  const cells = new THREE.InstancedMesh(
    cell,
    new THREE.MeshPhysicalMaterial({ color: '#e4a89d', roughness: 0.48, sheen: 0.8, sheenColor: new THREE.Color('#ffd9cf'), clearcoat: 0.25, clearcoatRoughness: 0.4 }),
    n,
  );
  const nuclei = new THREE.InstancedMesh(nucleus, new THREE.MeshPhysicalMaterial({ color: '#5a3578', roughness: 0.4, clearcoat: 0.4 }), n);
  const len = TUBULE.getLength() * (WALL.to - WALL.from);
  const m = new THREE.Matrix4();
  const basis = new THREE.Matrix4();
  const radial = new THREE.Vector3();
  const around = new THREE.Vector3();
  const r = TUBULE_R * 0.8;
  let k = 0;
  for (let j = 0; j < WALL.rings; j++) {
    const u = WALL.from + ((WALL.to - WALL.from) * (j + 0.5)) / WALL.rings;
    const fi = Math.round(u * 400);
    const p = TUBULE.getPointAt(u);
    const tan = frames.tangents[fi];
    for (let i = 0; i < WALL.around; i++) {
      const a = ((i + (j % 2) * 0.5) / WALL.around) * Math.PI * 2;
      radial.copy(frames.normals[fi]).multiplyScalar(Math.cos(a)).addScaledVector(frames.binormals[fi], Math.sin(a));
      around.crossVectors(tan, radial);
      basis.makeBasis(around, radial, tan);
      m.copy(basis)
        .scale(v3((Math.PI * 2 * r) / WALL.around - 0.006, 0.055, len / WALL.rings - 0.006))
        .setPosition(p.clone().addScaledVector(radial, r));
      cells.setMatrixAt(k, m);
      m.makeScale(0.013, 0.013, 0.013).setPosition(p.clone().addScaledVector(radial, r + 0.012));
      nuclei.setMatrixAt(k, m);
      k++;
    }
  }
  cells.instanceMatrix.needsUpdate = true;
  nuclei.instanceMatrix.needsUpdate = true;
  cells.computeBoundingSphere();
  nuclei.computeBoundingSphere();
  return { cells, nuclei, labelAt: TUBULE.getPointAt(WALL.from + 0.02).addScaledVector(v3(-0.4, 0.9, 0.2).normalize(), TUBULE_R) };
}

const PERIOD = 1.05; // seconds per round of division

/** Young cells that never matured, dividing again and again: 1, 2, 4 … 64. One holds the DNA. */
function YoungCells({ active }: { active: boolean }) {
  const reduced = useStory((s) => s.reducedMotion);
  const [count, setCount] = useState(64);
  const clock = useRef<number | null>(null);
  const built = useMemo(() => {
    const n = SLOTS.length;
    const membrane = membraneMaterial('#8a5d8e', '#f6d8ec', 0.14, 0.7, 0.45, uTime);
    const body = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 3), membrane, n);
    const nucMat = new THREE.MeshPhysicalMaterial({ color: '#4a2766', roughness: 0.35, clearcoat: 0.5, sheen: 0.4, sheenColor: new THREE.Color('#c9a3ff') });
    const nucleus = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 2), nucMat, n);
    body.frustumCulled = false;
    nucleus.frustumCulled = false;
    // the cell we enter: its own meshes, so its nucleus can clear as the camera goes in
    const frontBody = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 4), membraneMaterial('#8a5d8e', '#f6d8ec', 0.12, 0.65, 0.3, uTime));
    frontBody.renderOrder = 3;
    const frontNucMat = new THREE.MeshPhysicalMaterial({
      color: '#4a2766',
      roughness: 0.35,
      clearcoat: 0.5,
      sheen: 0.4,
      sheenColor: new THREE.Color('#c9a3ff'),
      transparent: true,
      side: THREE.DoubleSide,
    });
    const frontNucleus = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 4), frontNucMat);
    frontNucleus.renderOrder = 2;
    // once the nucleus clears, its dark inside is what we see behind the DNA
    const insideMat = new THREE.MeshBasicMaterial({ color: '#1d1026', side: THREE.BackSide, transparent: true, opacity: 0, depthWrite: false });
    const inside = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 3), insideMat);
    inside.renderOrder = 1;
    return { body, nucleus, frontBody, frontNucleus, frontNucMat, inside, insideMat };
  }, []);
  const levels = useLevels();
  const m = useMemo(() => new THREE.Matrix4(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const p = useMemo(() => new THREE.Vector3(), []);
  const sc = useMemo(() => new THREE.Vector3(), []);
  const nucleusWorld = useMemo(() => new THREE.Vector3().copy(SLOTS[FRONT]).applyMatrix4(levels.clump), [levels]);
  const nucleusRadius = CELL_R * NUCLEUS * levels.size.clump;

  /** Place the cells for `time` seconds of dividing (`live` = how many exist, `grow` scales a lone first cell). */
  const layout = (time: number, grow = 1) => {
    const round = Math.min(GENERATIONS, Math.floor(time / PERIOD));
    const live = time < 0 ? 0 : 2 ** round;
    const k = Math.min(1, (time - round * PERIOD) / (PERIOD * 0.75));
    const e = k * k * (3 - 2 * k);
    for (let i = 0; i < SLOTS.length; i++) {
      let alive = i < live;
      if (alive) {
        const born = round > 0 && i >= live / 2 && time < GENERATIONS * PERIOD + PERIOD;
        p.copy(born ? SLOTS[PARENT[i]] : SLOTS[i]);
        if (born) p.lerp(SLOTS[i], e);
        p.y += Math.sin(uTime.value * 0.9 + i * 1.7) * 0.012;
        sc.setScalar(CELL_R * grow * (born ? 0.6 + 0.4 * e : 1) * (1 + 0.03 * Math.sin(uTime.value * 1.3 + i)));
        m.compose(p, q, sc);
      } else m.makeScale(0, 0, 0);
      if (i === FRONT) {
        built.frontBody.visible = built.frontNucleus.visible = built.inside.visible = alive;
        if (alive) {
          built.frontBody.position.copy(p);
          built.frontBody.scale.copy(sc);
          built.frontNucleus.position.copy(p);
          built.frontNucleus.scale.copy(sc).multiplyScalar(NUCLEUS);
          built.inside.position.copy(p);
          built.inside.scale.copy(sc).multiplyScalar(NUCLEUS * 0.97);
        }
        alive = false;
        m.makeScale(0, 0, 0);
      }
      built.body.setMatrixAt(i, m);
      if (alive) m.compose(p, q, sc.multiplyScalar(NUCLEUS));
      built.nucleus.setMatrixAt(i, m);
    }
    built.body.instanceMatrix.needsUpdate = true;
    built.nucleus.instanceMatrix.needsUpdate = true;
    return live;
  };

  useFrame((_, dt) => {
    const t = journey.t;
    let live: number;
    if (t < STOP_INDEX.cause - 0.1) {
      clock.current = null;
      live = layout(t < STOP_INDEX.cause - 0.6 ? -1 : 0, smoothstep(STOP_INDEX.cause - 0.6, STOP_INDEX.cause - 0.15, t));
    } else if (t > STOP_INDEX.cause + 0.3) {
      clock.current = null;
      live = layout(GENERATIONS * PERIOD + 2);
    } else {
      // arriving at "How it starts": divide again from one cell
      if (clock.current === null) clock.current = reduced ? GENERATIONS * PERIOD + 2 : 0;
      if (active && !reduced) clock.current += dt;
      live = layout(clock.current);
    }
    if (live !== count && active) setCount(live);
    // the nucleus we dive into clears as the camera reaches it
    const ratio = view.position.distanceTo(nucleusWorld) / nucleusRadius;
    const o = 0.1 + 0.9 * smoothstep(1.6, 4, ratio);
    built.frontNucMat.opacity = o;
    built.frontNucMat.depthWrite = o > 0.95;
    built.insideMat.opacity = (1 - o) * 0.94;
  });

  return (
    <group>
      <primitive object={built.nucleus} />
      <primitive object={built.body} renderOrder={2} />
      <primitive object={built.frontNucleus} />
      <primitive object={built.inside} />
      <primitive object={built.frontBody} />
      <Label3D visible at="cause" position={[0, 1.12, 0]} center>
        <span className="tag" aria-live="polite">
          {count === 1 ? '1 cell' : `${count} cells`}
        </span>
      </Label3D>
      <Label3D visible at="cause" position={[0.62, -0.55, 0.4]} interactive>
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

/** The DNA, in the nucleus of the young cell nearest the viewer (DNA units). */
function Dna({ active }: { active: boolean }) {
  const reduced = useStory((s) => s.reducedMotion);
  const spin = useRef<THREE.Group>(null);
  const built = useMemo(() => {
    const h = helixGeometry();
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
  const along = (t: number, up = 0): [number, number, number] => [(t - 0.5) * HELIX.length, up, 0];
  return (
    <group>
      <group ref={spin}>
        <mesh geometry={built.merged} material={built.mat} />
        <mesh geometry={built.change} material={built.changeMat} />
      </group>
      <Label3D visible at="genes" position={along(0.1, HELIX.radius + 0.08)}>
        <div className="leader leader--left">
          <span className="leader__line" />
          <span className="tag">DNA</span>
        </div>
      </Label3D>
      <Label3D visible at="genes" position={along((HELIX.gene[0] + HELIX.gene[1]) / 2 - 0.05, HELIX.radius + 0.06)}>
        <div className="leader">
          <span className="leader__line" />
          <span className="tag">A gene, like WT1</span>
        </div>
      </Label3D>
      <Label3D visible at="genes" position={along(HELIX.change, -HELIX.radius - 0.05)}>
        <div className="leader leader--left">
          <span className="leader__line" />
          <span className="tag">A change in the gene</span>
        </div>
      </Label3D>
    </group>
  );
}

export function NephronLevel({ visible }: { visible: boolean }) {
  const reduced = useStory((s) => s.reducedMotion);
  const stopId = useStopId();
  const levels = useLevels();
  const invalidate = useThree((s) => s.invalidate);
  const outer = useRef<THREE.Group>(null);
  const clumpRef = useRef<THREE.Group>(null);
  const dnaRef = useRef<THREE.Group>(null);
  const built = useMemo(() => {
    const rnd = mulberry32(12);
    const vessel = new THREE.MeshPhysicalMaterial({
      color: '#b3312e',
      roughness: 0.34,
      clearcoat: 0.7,
      clearcoatRoughness: 0.25,
      sheen: 0.35,
      sheenColor: new THREE.Color('#ff9f90'),
    });
    const capsule = new THREE.SphereGeometry(R_CAPSULE, 64, 40, Math.PI / 2 + 1.05, Math.PI * 2 - 2.1);
    const capsuleMat = new THREE.MeshPhysicalMaterial({
      color: '#e8c5b8',
      roughness: 0.55,
      sheen: 0.7,
      sheenColor: new THREE.Color('#fff0e8'),
      side: THREE.DoubleSide,
    });
    const tubule = new THREE.TubeGeometry(TUBULE, 200, TUBULE_R, 24, false);
    const tubuleMat = membraneMaterial('#e9b9a2', '#fff1e6', 0.16, 0.75, 0, uTime);

    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    const p = new THREE.Vector3();
    const dot = new THREE.SphereGeometry(1, 10, 8);
    const fOff = Array.from({ length: 60 }, () => ({ at: rnd(), off: v3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).multiplyScalar(0.14) }));
    const filtrate = particles(fOff.length, dot, '#f3dc8a', (i, t, out) => {
      const o = fOff[i];
      TUBULE.getPointAt((o.at + t * 0.045) % 1, p).add(o.off);
      return out.compose(p, q.identity(), s.setScalar(0.024));
    });
    const start = TUBULE.getPointAt(0);
    const sOff = Array.from({ length: 26 }, () => ({ at: rnd(), from: G.clone().addScaledVector(v3(rnd() - 0.5, rnd() - 0.6, rnd() - 0.2).normalize(), 0.62) }));
    const space = particles(sOff.length, dot, '#f3dc8a', (i, t, out) => {
      const o = sOff[i];
      const k = (o.at + t * 0.28) % 1;
      p.copy(o.from).lerp(start, k * k);
      return out.compose(p, q.identity(), s.setScalar(0.026 * Math.min(1, k * 6)));
    });
    const rOff = Array.from({ length: 16 }, (_, i) => ({ at: rnd(), u: 0.12 + (i / 16) * 0.78 }));
    const back = particles(rOff.length, dot, '#8fd6c4', (i, t, out) => {
      const o = rOff[i];
      const a = TUBULE.getPointAt(o.u);
      const b = CAPILLARY.getPointAt(Math.min(1, o.u * 0.96 + 0.02));
      const k = (o.at + t * 0.35) % 1;
      p.copy(a).lerp(b, k);
      return out.compose(p, q.identity(), s.setScalar(0.03 * Math.sin(Math.PI * k) + 0.004));
    });
    const disc = new THREE.SphereGeometry(1, 14, 10);
    disc.scale(1, 0.42, 1);
    const bOff = Array.from({ length: 44 }, (_, i) => ({ at: rnd(), out: i % 2 === 1, rot: new THREE.Euler(rnd() * 3, rnd() * 3, rnd() * 3) }));
    const blood = particles(bOff.length, disc, '#c3302c', (i, t, out) => {
      const o = bOff[i];
      (o.out ? EFFERENT : AFFERENT).getPointAt((o.at + t * 0.12) % 1, p);
      return out.compose(p, q.setFromEuler(o.rot), s.setScalar(0.045));
    });
    const flows = [filtrate, space, back, blood];
    for (const f of flows) {
      for (let i = 0; i < f.mesh.count; i++) f.mesh.setMatrixAt(i, f.place(i, 0, m));
      f.mesh.instanceMatrix.needsUpdate = true;
    }
    return { tuft: tuftGeometry(), vessel, capsule, capsuleMat, tubule, tubuleMat, flows, m, wall: wallCells() };
  }, []);

  // place the nested scenes once (their matrices never change)
  const clumpMatrix = useMemo(() => new THREE.Matrix4().makeTranslation(CLUMP_AT.x, CLUMP_AT.y, CLUMP_AT.z).scale(new THREE.Vector3().setScalar(CLUMP_SCALE)), []);
  const dnaMatrix = useMemo(
    () =>
      new THREE.Matrix4()
        .makeTranslation(SLOTS[FRONT].x, SLOTS[FRONT].y, SLOTS[FRONT].z)
        .multiply(new THREE.Matrix4().makeRotationFromEuler(DNA_TILT))
        .multiply(new THREE.Matrix4().makeScale(DNA_SCALE, DNA_SCALE, DNA_SCALE)),
    [],
  );
  const setMatrix = (g: THREE.Group | null, mtx: THREE.Matrix4) => {
    if (!g) return;
    g.matrixAutoUpdate = false;
    g.matrix.copy(mtx);
    g.matrixWorldNeedsUpdate = true;
  };

  const animated = stopId === 'nephron' || stopId === 'cause' || stopId === 'genes';
  useFrame((_, dt) => {
    const t = journey.t;
    // only drawn while the camera is close enough for it to be more than a speck
    const u = view.d / levels.size.nephron;
    const show = t > STOP_INDEX.inside - 0.1 && t < STOP_INDEX.lump - 0.05 && u < 450;
    if (outer.current && outer.current.visible !== show) {
      outer.current.visible = show;
      invalidate();
    }
    if (clumpRef.current) clumpRef.current.visible = t > STOP_INDEX.cause - 0.65;
    if (dnaRef.current) dnaRef.current.visible = view.d / levels.size.dna < 60;
    if (!show) return;
    if (animated && visible && !reduced) uTime.value += dt;
    for (const f of built.flows) {
      for (let i = 0; i < f.mesh.count; i++) f.mesh.setMatrixAt(i, f.place(i, uTime.value, built.m));
      f.mesh.instanceMatrix.needsUpdate = true;
    }
  });

  const tubuleLabel = TUBULE.getPointAt(0.3);
  const inLabel = AFFERENT.getPointAt(0.35);
  return (
    <group ref={(g) => setMatrix((outer.current = g), levels.nephron)} visible={false}>
      <mesh geometry={built.tuft} material={built.vessel} />
      <mesh geometry={built.capsule} material={built.capsuleMat} position={G} />
      <primitive object={built.wall.cells} />
      <primitive object={built.wall.nuclei} />
      <mesh geometry={built.tubule} material={built.tubuleMat} renderOrder={2} />
      {built.flows.map((f, i) => (
        <primitive key={i} object={f.mesh} />
      ))}
      <Label3D visible at="nephron" position={[G.x - 0.42, G.y - 0.3, 0.5]} interactive>
        <div className="leader leader--left" style={{ animation: 'rise 700ms 450ms both' }}>
          <span className="leader__line" style={{ width: 44 }} />
          <span className="tag">
            <TermButton termKey="glomerulus">Glomerulus</TermButton> <small>the filter</small> <Cites ids={[12]} />
          </span>
        </div>
      </Label3D>
      <Label3D visible at="nephron" position={inLabel} interactive>
        <div className="leader leader--left" style={{ animation: 'rise 700ms 650ms both' }}>
          <span className="leader__line" style={{ width: 30 }} />
          <span className="tag">
            Blood comes in <Cites ids={[12]} />
          </span>
        </div>
      </Label3D>
      <Label3D visible at="nephron" position={tubuleLabel} interactive>
        <div className="leader" style={{ animation: 'rise 700ms 850ms both' }}>
          <span className="leader__line" style={{ width: 40 }} />
          <span className="tag">
            Tubule <small>takes back water</small> <Cites ids={[12]} />
          </span>
        </div>
      </Label3D>
      <Label3D visible at="cause" position={built.wall.labelAt} interactive>
        <div className="leader leader--left" style={{ animation: 'rise 700ms 500ms both' }}>
          <span className="leader__line" style={{ width: 34 }} />
          <span className="tag">
            Mature cells <small>line the tube</small> <Cites ids={[3]} />
          </span>
        </div>
      </Label3D>
      <group ref={(g) => setMatrix((clumpRef.current = g), clumpMatrix)}>
        <YoungCells active={visible && stopId === 'cause'} />
        <group ref={(g) => setMatrix((dnaRef.current = g), dnaMatrix)}>
          <Dna active={visible && stopId === 'genes'} />
        </group>
      </group>
    </group>
  );
}
