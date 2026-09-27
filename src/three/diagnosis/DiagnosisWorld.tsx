import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { useStory } from '../../app/store';
import { STEPS } from '../../content/story';
import { Cites, TermButton } from '../../ui/RichText';
import { Label3D } from '../Label3D';
import { mulberry32 } from '../tissue/tissueGeometry';
import { villusMaterial, villusProfile } from '../tissue/VilliWorld';
import { makePasTexture } from './pasTexture';

/* ----------------------------------------------------------------- A · biopsy (x = 0) */

/** The biopsy shows an affected lining: villi partly blunted (fixed, independent of the villi scene). */
const biopsyUniforms = { uTime: { value: 0 }, uDisease: { value: 0.55 } };

function Biopsy({ active }: { active: boolean }) {
  const reduced = useStory((s) => s.reducedMotion);
  const built = useMemo(() => {
    // inside a loop of duodenum: a curved lumen lined with (slightly blunted) villi
    const rnd = mulberry32(5);
    const R = 2.25;
    const axisY = 1.95;
    const wallPt = (x: number, phi: number, r = R) => new THREE.Vector3(x, axisY - r * Math.cos(phi), r * Math.sin(phi));
    const nx = 70;
    const np = 60;
    const pos: number[] = [];
    const idx: number[] = [];
    for (let i = 0; i <= nx; i++) {
      for (let j = 0; j <= np; j++) {
        const v = wallPt(-3.9 + (7.8 * i) / nx, THREE.MathUtils.degToRad(-105 + (210 * j) / np));
        pos.push(v.x, v.y, v.z);
      }
    }
    for (let i = 0; i < nx; i++)
      for (let j = 0; j < np; j++) {
        const a = i * (np + 1) + j;
        idx.push(a, a + np + 1, a + 1, a + 1, a + np + 1, a + np + 2);
      }
    const floor = new THREE.BufferGeometry();
    floor.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    floor.setIndex(idx);
    floor.computeVertexNormals();

    const vGeo = villusProfile(10, 8);
    const n = 1400;
    const rands = new Float32Array(n);
    const inst = new THREE.InstancedMesh(vGeo, villusMaterial(false, biopsyUniforms), n);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    for (let i = 0; i < n; i++) {
      const x = -3.7 + rnd() * 7.4;
      const phi = THREE.MathUtils.degToRad(-78 + rnd() * 156);
      const p = wallPt(x, phi, R - 0.005);
      const inward = new THREE.Vector3(0, Math.cos(phi), -Math.sin(phi));
      q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), inward);
      const h = 0.24 + rnd() * 0.12;
      const w = 0.045 + rnd() * 0.015;
      m.compose(p, q, new THREE.Vector3(w, h, w * 0.85));
      inst.setMatrixAt(i, m);
      rands[i] = rnd();
    }
    vGeo.setAttribute('aRand', new THREE.InstancedBufferAttribute(rands, 1));
    inst.instanceMatrix.needsUpdate = true;
    inst.frustumCulled = false;
    const floorMat = new THREE.MeshPhysicalMaterial({
      color: '#8a4440',
      roughness: 0.55,
      sheen: 0.6,
      sheenColor: new THREE.Color('#ffb2a2'),
      side: THREE.DoubleSide,
    });
    return { floor, floorMat, inst };
  }, []);

  // endoscope comes in from upper left-back, pointing at the target on the lining
  const target = new THREE.Vector3(0.35, -0.05, 0.2);
  const dir = new THREE.Vector3(0.75, -0.55, 0.35).normalize();
  const tip = target.clone().sub(dir.clone().multiplyScalar(1.05));
  const scopeQ = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().negate());
  const forceps = useRef<THREE.Group>(null);
  const cupA = useRef<THREE.Mesh>(null);
  const cupB = useRef<THREE.Mesh>(null);
  const sample = useRef<THREE.Mesh>(null);
  const t0 = useRef(0);

  useFrame((_, dt) => {
    if (!active) return;
    t0.current += reduced ? 0 : dt;
    const t = reduced ? 2.1 : t0.current % 5;
    // 0-1.2 extend, 1.2-1.6 open, 1.6-2.0 close, 2.0-3.4 retract, then hold
    const ext = t < 1.2 ? t / 1.2 : t < 2.0 ? 1 : t < 3.4 ? 1 - (t - 2.0) / 1.4 : 0;
    const open = t < 1.2 ? 0 : t < 1.6 ? (t - 1.2) / 0.4 : t < 2.0 ? 1 - (t - 1.6) / 0.4 : 0;
    const e = ext * ext * (3 - 2 * ext);
    if (forceps.current) forceps.current.position.copy(tip.clone().add(dir.clone().multiplyScalar(0.12 + e * 0.8)));
    if (cupA.current) cupA.current.rotation.z = 0.2 + open * 0.8;
    if (cupB.current) cupB.current.rotation.z = -0.2 - open * 0.8;
    if (sample.current) sample.current.visible = t > 1.85 && t < 4.9;
  });

  return (
    <group>
      <mesh geometry={built.floor} material={built.floorMat} />
      <primitive object={built.inst} />
      {/* endoscope */}
      <group position={tip} quaternion={scopeQ}>
        <mesh position={[0, 1.9, 0]}>
          <cylinderGeometry args={[0.24, 0.24, 3.8, 40, 1, false]} />
          <meshPhysicalMaterial color="#26282c" roughness={0.28} clearcoat={1} clearcoatRoughness={0.15} />
        </mesh>
        <mesh position={[0, -0.005, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.24, 40]} />
          <meshStandardMaterial color="#141517" roughness={0.4} />
        </mesh>
        <mesh position={[0.08, -0.01, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.06, 24]} />
          <meshPhysicalMaterial color="#0b1a2a" roughness={0.05} clearcoat={1} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[-0.08, -0.012, s * 0.1]} rotation={[Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.03, 16]} />
            <meshBasicMaterial color="#fff7ea" />
          </mesh>
        ))}
      </group>
      {/* forceps */}
      <group ref={forceps} quaternion={scopeQ}>
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.014, 0.014, 1, 8]} />
          <meshStandardMaterial color="#b9bdc3" metalness={0.9} roughness={0.25} />
        </mesh>
        <mesh ref={cupA} position={[0, -0.02, 0]}>
          <sphereGeometry args={[0.05, 12, 8, 0, Math.PI]} />
          <meshStandardMaterial color="#cfd3d8" metalness={0.9} roughness={0.2} side={THREE.DoubleSide} />
        </mesh>
        <mesh ref={cupB} position={[0, -0.02, 0]} rotation={[0, Math.PI, 0]}>
          <sphereGeometry args={[0.05, 12, 8, 0, Math.PI]} />
          <meshStandardMaterial color="#cfd3d8" metalness={0.9} roughness={0.2} side={THREE.DoubleSide} />
        </mesh>
        <mesh ref={sample} position={[0, -0.05, 0]} visible={false}>
          <sphereGeometry args={[0.04, 12, 10]} />
          <meshPhysicalMaterial color="#d77d72" roughness={0.5} sheen={0.8} />
        </mesh>
      </group>
      <Label3D visible={active} position={[target.x + 0.3, target.y + 0.55, target.z]} interactive>
        <div className="leader" style={{ animation: 'rise 700ms 600ms both' }}>
          <span className="leader__line" style={{ width: 36 }} />
          <span className="tag">
            Biopsy forceps <small>through the endoscope</small> <Cites ids={[14]} />
          </span>
        </div>
      </Label3D>
    </group>
  );
}

/* ----------------------------------------------------------------- B · microscope (x = 20) */

function Microscope({ active }: { active: boolean }) {
  const tex = useMemo(() => makePasTexture(1024), []);
  return (
    <group position={[20, 0, 0]}>
      <mesh position={[0, 0.25, 0]}>
        <circleGeometry args={[1.75, 96]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.25, -0.01]}>
        <ringGeometry args={[1.75, 1.95, 96]} />
        <meshStandardMaterial color="#1a1716" roughness={0.4} metalness={0.3} />
      </mesh>
      {/* the glass slide with the stained sample */}
      <group position={[0, -2.05, 0.6]} rotation={[-1.05, 0, 0]}>
        <mesh>
          <boxGeometry args={[2.4, 0.8, 0.03]} />
          <meshPhysicalMaterial color="#dfeef2" roughness={0.08} transparent opacity={0.35} clearcoat={1} />
        </mesh>
        <mesh position={[0, 0, 0.02]}>
          <circleGeometry args={[0.16, 24]} />
          <meshBasicMaterial color="#d9a2bd" />
        </mesh>
      </group>
      <Label3D visible={active} position={[1.35, 1.35, 0]} interactive>
        <div className="leader" style={{ animation: 'rise 700ms 500ms both' }}>
          <span className="leader__line" style={{ width: 36 }} />
          <span className="tag">
            <TermButton termKey="pas">PAS</TermButton>-positive macrophages <small>(magenta)</small> <Cites ids={[2, 9]} />
          </span>
        </div>
      </Label3D>
      <Label3D visible={active} position={[0, -1.72, 0]} center>
        <span className="tag">
          <small>Illustration of a stained biopsy · not a patient image</small>
        </span>
      </Label3D>
    </group>
  );
}

/* ----------------------------------------------------------------- C · PCR (x = 40) */

function helixGeometry() {
  const parts: THREE.BufferGeometry[] = [];
  const turns = 1.8;
  const height = 1.7;
  const radius = 0.2;
  const colorize = (g: THREE.BufferGeometry, hex: string) => {
    const c = new THREE.Color(hex);
    const n = g.getAttribute('position').count;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) arr.set([c.r, c.g, c.b], i * 3);
    g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
    return g;
  };
  for (const [phase, col] of [
    [0, '#efe7d6'],
    [Math.PI, '#9fb7c9'],
  ] as [number, string][]) {
    const pts = Array.from({ length: 80 }, (_, i) => {
      const t = i / 79;
      const a = t * turns * Math.PI * 2 + phase;
      return new THREE.Vector3(Math.cos(a) * radius, t * height - height / 2, Math.sin(a) * radius);
    });
    parts.push(colorize(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 120, 0.032, 8, false), col).toNonIndexed());
  }
  const rungs = 16;
  for (let i = 0; i < rungs; i++) {
    const t = (i + 0.5) / rungs;
    const a = t * turns * Math.PI * 2;
    const y = t * height - height / 2;
    const g = new THREE.CylinderGeometry(0.016, 0.016, radius * 2, 6);
    g.rotateZ(Math.PI / 2);
    g.rotateY(-a);
    g.translate(0, y, 0);
    parts.push(colorize(g, i % 2 ? '#e0b27d' : '#d58f86').toNonIndexed());
  }
  const merged = mergeGeometries(parts)!;
  merged.computeVertexNormals();
  return merged;
}

// copies fill a centred 8 × 2 grid in doubling order: 1 → 2 → 4 → 8 → 16
const SLOTS = (() => {
  const order = [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
    [-1, 0],
    [-1, 1],
    [2, 0],
    [2, 1],
    [-2, 0],
    [-2, 1],
    [3, 0],
    [3, 1],
    [-3, 0],
    [-3, 1],
    [4, 0],
    [4, 1],
  ];
  return order.map(([c, r]) => new THREE.Vector3((c - 0.5) * 0.62, r === 0 ? 0.98 : -0.98, (r - 0.5) * 0.25));
})();
// order in which copies appear: parent i spawns child i + 2^cycle
const PARENT = Array.from({ length: 16 }, (_, i) => (i === 0 ? 0 : i - 2 ** Math.floor(Math.log2(i))));

function Pcr({ active }: { active: boolean }) {
  const reduced = useStory((s) => s.reducedMotion);
  const [cycle, setCycle] = useState(0);
  const built = useMemo(() => {
    const g = helixGeometry();
    const mesh = new THREE.InstancedMesh(
      g,
      new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.35, clearcoat: 0.6, sheen: 0.3 }),
      16,
    );
    mesh.frustumCulled = false;
    return mesh;
  }, []);
  const clock = useRef(0);
  const m = useMemo(() => new THREE.Matrix4(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);

  useFrame((_, dt) => {
    if (!active) return;
    clock.current += reduced ? 0 : dt;
    const period = 1.7;
    const total = period * 5 + 2.2;
    const t = reduced ? period * 4.9 : clock.current % total;
    const c = Math.min(4, Math.floor(t / period));
    if (c !== cycle) setCycle(c);
    const count = 2 ** c;
    const local = Math.min(1, (t - c * period) / 0.9);
    const e = local * local * (3 - 2 * local);
    for (let i = 0; i < 16; i++) {
      if (i >= count) {
        m.makeScale(0, 0, 0);
      } else {
        const born = i >= count / 2 && c > 0;
        const from = born ? SLOTS[PARENT[i]] : SLOTS[i];
        const p = born ? from.clone().lerp(SLOTS[i], e) : SLOTS[i];
        q.setFromEuler(new THREE.Euler(0, clock.current * 0.5 + i * 0.4, 0));
        const s = born ? 0.4 + 0.6 * e : 1;
        m.compose(p, q, new THREE.Vector3(s, s, s));
      }
      built.setMatrixAt(i, m);
    }
    built.instanceMatrix.needsUpdate = true;
  });

  return (
    <group position={[40, 0, 0]}>
      <primitive object={built} />
      <Label3D visible={active} position={[0, 2.05, 0]} center>
        <span className="tag" aria-live="polite">
          {cycle === 0 ? 'Start · 1 copy of the target DNA' : `After cycle ${cycle} · ${2 ** cycle} copies`}
        </span>
      </Label3D>
    </group>
  );
}

/* ----------------------------------------------------------------- world */

export function DiagnosisWorld({ visible }: { visible: boolean }) {
  const step = useStory((s) => s.step);
  const sub = useStory((s) => s.sub);
  const onStep = STEPS[step].id === 'diagnosis' && visible;
  return (
    <group>
      <Biopsy active={onStep && sub === 0} />
      <Microscope active={onStep && sub === 1} />
      <Pcr active={onStep && sub === 2} />
    </group>
  );
}
