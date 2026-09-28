import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { useStopId, useStory } from '../../app/store';
import { Cites, TermButton } from '../../ui/RichText';
import { Label3D } from '../Label3D';
import { mulberry32 } from '../random';
import { membraneMaterial } from '../shaders/membrane';

/**
 * One nephron's filter (illustration, not to scale): a ball of tiny blood vessels, the
 * glomerulus, inside a cup (Bowman's capsule, cut open at the front). Blood comes in through a
 * small artery; fluid filtered out of it runs down the tubule, and some of it (water and
 * nutrients the body still needs) is taken back into a blood vessel running alongside.
 */
const G = new THREE.Vector3(0, 0.3, 0);
const R_CAPSULE = 0.95;
const POLE_V = new THREE.Vector3(-0.5, 0.85, 0.15).normalize(); // where the vessels enter
const POLE_U = new THREE.Vector3(0.62, -0.75, 0.2).normalize(); // where the tubule leaves

const uTime = { value: 0 };
const v3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const curve = (pts: THREE.Vector3[]) => new THREE.CatmullRomCurve3(pts, false, 'centripetal');

/** The tubule leaving the capsule (it passes (1.28, −0.95, 0), where the camera dives into its wall). */
const TUBULE = curve([
  G.clone().addScaledVector(POLE_U, R_CAPSULE * 0.97),
  v3(0.95, -0.55, 0.3),
  v3(1.35, -0.4, 0.05),
  v3(1.62, -0.7, -0.25),
  v3(1.28, -0.95, 0),
  v3(1.05, -1.3, 0.25),
  v3(1.45, -1.62, 0.1),
  v3(1.78, -1.98, -0.15),
  v3(1.72, -2.9, -0.2),
]);
/** A small blood vessel wound around the tubule, taking back what the body still needs. */
const CAPILLARY = curve([
  v3(0.7, -0.2, -0.35),
  v3(1.2, -0.15, -0.3),
  v3(1.72, -0.45, -0.5),
  v3(1.5, -0.95, -0.35),
  v3(1.02, -1.15, -0.2),
  v3(1.2, -1.6, -0.3),
  v3(1.95, -1.75, -0.45),
  v3(2.05, -2.9, -0.45),
]);
const POLE = G.clone().addScaledVector(POLE_V, R_CAPSULE * 0.9);
const AFFERENT = curve([POLE.clone().add(v3(-1.3, 1.5, 0.1)), POLE.clone().add(v3(-0.55, 0.6, 0.05)), POLE.clone().add(v3(-0.08, 0.02, 0)), G.clone().add(v3(-0.1, 0.15, 0.05))]);
const EFFERENT = curve([G.clone().add(v3(0.05, 0.2, -0.05)), POLE.clone().add(v3(0.1, 0.02, -0.02)), POLE.clone().add(v3(0.45, 0.65, -0.1)), POLE.clone().add(v3(0.9, 1.6, -0.2))]);

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

export function NephronWorld({ visible }: { visible: boolean }) {
  const reduced = useStory((s) => s.reducedMotion);
  const active = useStopId() === 'nephron' && visible;
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
    const tubule = new THREE.TubeGeometry(TUBULE, 160, 0.16, 20, false);
    const tubuleMat = membraneMaterial('#e9b9a2', '#fff1e6', 0.2, 0.8, 0, uTime);

    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    const p = new THREE.Vector3();
    const dot = new THREE.SphereGeometry(1, 10, 8);
    // fluid running down the tubule
    const fOff = Array.from({ length: 60 }, () => ({ at: rnd(), off: v3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).multiplyScalar(0.16) }));
    const filtrate = particles(fOff.length, dot, '#f3dc8a', (i, t, out) => {
      const o = fOff[i];
      TUBULE.getPointAt((o.at + t * 0.045) % 1, p).add(o.off);
      return out.compose(p, q.identity(), s.setScalar(0.028));
    });
    // fluid leaving the blood inside the cup, heading for the tubule
    const start = TUBULE.getPointAt(0);
    const sOff = Array.from({ length: 26 }, () => ({ at: rnd(), from: G.clone().addScaledVector(v3(rnd() - 0.5, rnd() - 0.6, rnd() - 0.2).normalize(), 0.62) }));
    const space = particles(sOff.length, dot, '#f3dc8a', (i, t, out) => {
      const o = sOff[i];
      const k = (o.at + t * 0.28) % 1;
      p.copy(o.from).lerp(start, k * k);
      return out.compose(p, q.identity(), s.setScalar(0.026 * Math.min(1, k * 6)));
    });
    // what the body still needs, going back into the blood
    const rOff = Array.from({ length: 16 }, (_, i) => ({ at: rnd(), u: 0.12 + (i / 16) * 0.78 }));
    const back = particles(rOff.length, dot, '#8fd6c4', (i, t, out) => {
      const o = rOff[i];
      const a = TUBULE.getPointAt(o.u);
      const b = CAPILLARY.getPointAt(Math.min(1, o.u * 0.96 + 0.02));
      const k = (o.at + t * 0.35) % 1;
      p.copy(a).lerp(b, k);
      return out.compose(p, q.identity(), s.setScalar(0.03 * Math.sin(Math.PI * k) + 0.004));
    });
    // red blood cells in and out
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
    return { tuft: tuftGeometry(), vessel, capsule, capsuleMat, tubule, tubuleMat, flows, m };
  }, []);

  useFrame((_, dt) => {
    if (!active) return;
    if (!reduced) uTime.value += dt;
    for (const f of built.flows) {
      for (let i = 0; i < f.mesh.count; i++) f.mesh.setMatrixAt(i, f.place(i, uTime.value, built.m));
      f.mesh.instanceMatrix.needsUpdate = true;
    }
  });

  const tubuleLabel = TUBULE.getPointAt(0.3);
  const inLabel = AFFERENT.getPointAt(0.35);
  return (
    <group rotation={[0, -0.1, 0]}>
      <mesh geometry={built.tuft} material={built.vessel} />
      <mesh geometry={built.capsule} material={built.capsuleMat} position={G} />
      <mesh geometry={built.tubule} material={built.tubuleMat} renderOrder={2} />
      {built.flows.map((f, i) => (
        <primitive key={i} object={f.mesh} />
      ))}
      <Label3D visible={visible} position={[G.x - 0.42, G.y - 0.3, 0.5]} interactive>
        <div className="leader leader--left" style={{ animation: 'rise 700ms 450ms both' }}>
          <span className="leader__line" style={{ width: 44 }} />
          <span className="tag">
            <TermButton termKey="glomerulus">Glomerulus</TermButton> <small>the filter</small> <Cites ids={[12]} />
          </span>
        </div>
      </Label3D>
      <Label3D visible={visible} position={inLabel} interactive>
        <div className="leader leader--left" style={{ animation: 'rise 700ms 650ms both' }}>
          <span className="leader__line" style={{ width: 30 }} />
          <span className="tag">
            Blood comes in <Cites ids={[12]} />
          </span>
        </div>
      </Label3D>
      <Label3D visible={visible} position={tubuleLabel} interactive>
        <div className="leader" style={{ animation: 'rise 700ms 850ms both' }}>
          <span className="leader__line" style={{ width: 40 }} />
          <span className="tag">
            Tubule <small>takes back what the body needs</small> <Cites ids={[12]} />
          </span>
        </div>
      </Label3D>
    </group>
  );
}
