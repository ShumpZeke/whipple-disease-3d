import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { journey, smoothstep } from '../../app/journey';
import { useStopId, useStory } from '../../app/store';
import { STOP_INDEX } from '../../content/story';
import { Cites, TermButton } from '../../ui/RichText';
import { slicePlanes } from '../anatomy/organMaterial';
import { MODEL_SCALE, useAnatomy } from '../anatomy/useAnatomy';
import { useAnatomyRefs } from '../Director';
import { Label3D } from '../Label3D';
import { TUMOR_R, tumorCenter, ULTRASOUND_X } from '../presets';
import { FAN, makeCtTexture, makeSonogramTexture, type Blob } from './scanTextures';

/*
 * The scans happen on the model itself. For the ultrasound a probe comes to the front of the body
 * and its fan of sound slices the organs from front to back through the tumor; the organs on our
 * side of the slice are cut away and the picture is drawn on the slice. For the CT scan the ring
 * slides up the body to the tumor, cutting away everything below it, and the picture of that
 * one slice fills the ring. Both pictures are drawings, not patient images.
 */

const uTime = { value: 0 };
const FAN_SCALE = 0.463; // world units per fan-texture unit (the fan reaches 0.95 deep)
const CT_R = 0.95; // world radius of the CT picture

const at = (t: number, a: number, b: number) => smoothstep(a, b, t);
/** How far the ultrasound is in (probe placed, organs sliced), 0..1. */
const usIn = (t: number) => at(t, STOP_INDEX.signs + 0.42, STOP_INDEX.signs + 0.88) * (1 - at(t, STOP_INDEX.ultrasound + 0.3, STOP_INDEX.ultrasound + 0.68));
/** Where the CT ring is: 0 = below the feet, 1 = at the tumor. */
const ctIn = (t: number) => at(t, STOP_INDEX.ultrasound + 0.6, STOP_INDEX.ultrasound + 0.9) * (1 - at(t, STOP_INDEX.scans + 0.1, STOP_INDEX.scans + 0.38));

function gantryGeometry(inner: number, outer: number, depth: number, round: number) {
  const pts: THREE.Vector2[] = [];
  const corner = (cx: number, cy: number, a0: number) => {
    for (let i = 0; i <= 6; i++) {
      const a = a0 + (i / 6) * (Math.PI / 2);
      pts.push(new THREE.Vector2(cx + Math.cos(a) * round, cy + Math.sin(a) * round));
    }
  };
  corner(inner + round, -depth / 2 + round, Math.PI);
  corner(outer - round, -depth / 2 + round, -Math.PI / 2);
  corner(outer - round, depth / 2 - round, 0);
  corner(inner + round, depth / 2 - round, Math.PI / 2);
  pts.push(pts[0].clone());
  return new THREE.LatheGeometry(pts, 128);
}

export function Scans({ visible }: { visible: boolean }) {
  const data = useAnatomy();
  const refs = useAnatomyRefs();
  const stopId = useStopId();
  const reduced = useStory((s) => s.reducedMotion);
  const invalidate = useThree((s) => s.invalidate);
  const probe = useRef<THREE.Group>(null);
  const fan = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Group>(null);
  const rotor = useRef<THREE.Group>(null);
  const disc = useRef<THREE.Mesh>(null);

  const built = useMemo(() => {
    const C = tumorCenter(refs);
    const X = ULTRASOUND_X(refs);
    const center = (id: 'LeftKidney' | 'RightKidney') => (data.meshes[id]!.userData.base as THREE.Vector3).clone().multiplyScalar(MODEL_SCALE);
    const halfOf = (id: 'LeftKidney' | 'RightKidney') => {
      const m = data.meshes[id]!;
      const b = new THREE.Box3().setFromBufferAttribute(m.geometry.getAttribute('position') as THREE.BufferAttribute);
      return b.getSize(new THREE.Vector3()).multiplyScalar(0.5 * m.scale.x * MODEL_SCALE);
    };
    const LK = center('LeftKidney');
    const RK = center('RightKidney');
    const lh = halfOf('LeftKidney');
    const rh = halfOf('RightKidney');
    // ---- ultrasound: probe at the front of the body, fan in the plane x = X
    const apex = new THREE.Vector3(X, C.y + 0.02, C.z + 0.62);
    const cutK = Math.sqrt(Math.max(0.05, 1 - ((X - LK.x) / lh.x) ** 2));
    const sono = makeSonogramTexture({
      kidney: { x: (LK.y - apex.y) / FAN_SCALE, y: (LK.z - apex.z) / FAN_SCALE, rx: (lh.y * cutK) / FAN_SCALE, ry: (lh.z * cutK) / FAN_SCALE },
      tumor: { x: (C.y - apex.y) / FAN_SCALE, y: (C.z - apex.z) / FAN_SCALE, r: Math.sqrt(Math.max(0, TUMOR_R ** 2 - (C.x - X) ** 2)) / FAN_SCALE },
    });
    // fan frame: its x runs along the body (+Y), its up is the front of the body (+Z), it faces +X
    const fanBasis = new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(1, 0, 0));
    const fanQuat = new THREE.Quaternion().setFromRotationMatrix(fanBasis);
    const start = -Math.PI / 2 - FAN.half;
    const fanGeo = new THREE.RingGeometry(FAN.inner, FAN.outer, 72, 1, start, FAN.half * 2);
    const image = new THREE.ShaderMaterial({
      uniforms: { uMap: { value: sono }, uTime, uIn: { value: FAN.inner }, uOut: { value: FAN.outer }, uOpacity: { value: 0 } },
      transparent: true,
      side: THREE.DoubleSide,
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `
        uniform sampler2D uMap; uniform float uTime; uniform float uIn; uniform float uOut; uniform float uOpacity;
        varying vec2 vUv;
        void main() {
          vec3 c = texture2D(uMap, vUv).rgb;
          float r = length((vUv * 2.0 - 1.0) * uOut);
          float front = uIn + fract(uTime * 0.42) * (uOut - uIn);
          float wave = exp(-pow((r - front) / 0.04, 2.0)) * (1.0 - smoothstep(uOut * 0.6, uOut, r));
          gl_FragColor = vec4(c + vec3(0.35, 0.5, 0.7) * wave * 0.16, uOpacity);
          #include <colorspace_fragment>
        }`,
    });
    const lens = new THREE.CylinderGeometry(FAN.inner, FAN.inner, 0.3, 32, 1, false, -FAN.half, FAN.half * 2);
    lens.rotateX(Math.PI / 2);
    const plastic = new THREE.MeshPhysicalMaterial({ color: '#e9e6df', roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.3 });
    const cable = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([new THREE.Vector3(0, 1.0, 0), new THREE.Vector3(0.1, 1.6, -0.05), new THREE.Vector3(0.7, 2.3, -0.3), new THREE.Vector3(1.5, 2.7, -0.5)]),
      40,
      0.035,
      8,
      false,
    );
    // ---- CT: the slice through the tumor, seen from the feet (front of the body at the top)
    const Y = C.y;
    const cut = (c: THREE.Vector3, h: THREE.Vector3) => Math.sqrt(Math.max(0.05, 1 - ((Y - c.y) / h.y) ** 2));
    const img = (x: number, z: number) => ({ x: x / CT_R, y: z / CT_R });
    const kidneyBlob = (c: THREE.Vector3, h: THREE.Vector3, rot: number): Blob => ({ ...img(c.x, c.z), rx: (h.x * cut(c, h)) / CT_R, ry: (h.z * cut(c, h)) / CT_R, rot });
    const spineY = (Math.min(LK.z, RK.z) - 0.26) / CT_R;
    const ct = makeCtTexture({
      body: { x: 0, y: spineY + 0.4, rx: 0.93, ry: 0.62 },
      spine: { x: 0, y: spineY },
      aorta: { ...img(0.007, 0.029), r: 0.06 / CT_R },
      ivc: { ...img(-0.077, 0.108), rx: 0.065 / CT_R, ry: 0.05 / CT_R },
      rightKidney: kidneyBlob(RK, rh, -0.5),
      leftKidney: kidneyBlob(LK, lh, 0.5),
      tumor: { ...img(C.x, C.z), r: (TUMOR_R * 0.98) / CT_R },
    });
    const beam = new THREE.BufferGeometry();
    beam.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 1.6, -0.9, 0, -1.3, 0.9, 0, -1.3], 3));
    return {
      C,
      X,
      Y,
      apex,
      fanQuat,
      fanGeo,
      image,
      lens,
      plastic,
      cable,
      housing: new RoundedBoxGeometry(0.42, 0.34, 0.3, 4, 0.08),
      gantry: gantryGeometry(1.3, 1.95, 0.36, 0.1),
      shell: new THREE.MeshPhysicalMaterial({ color: '#eeede8', roughness: 0.32, clearcoat: 0.8, clearcoatRoughness: 0.2 }),
      discMat: new THREE.MeshBasicMaterial({ map: ct, toneMapped: false, transparent: true, opacity: 0, side: THREE.DoubleSide }),
      beam,
      beamMat: new THREE.MeshBasicMaterial({ color: '#9cc8ff', transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
    };
  }, [data, refs]);

  useFrame((_, dt) => {
    const t = journey.t;
    const us = usIn(t);
    const ctk = ctIn(t);
    // ultrasound: the probe comes to the front of the body, the organs on our side are sliced away
    if (probe.current) {
      probe.current.visible = us > 0.001;
      probe.current.position.copy(built.apex).add(new THREE.Vector3(0, 0, (1 - us) * 0.7));
    }
    const fanOpacity = at(t, STOP_INDEX.signs + 0.78, STOP_INDEX.signs + 0.95) * (1 - at(t, STOP_INDEX.ultrasound + 0.25, STOP_INDEX.ultrasound + 0.4));
    if (fan.current) fan.current.visible = fanOpacity > 0.001;
    built.image.uniforms.uOpacity.value = fanOpacity;
    if (us > 0.001) slicePlanes.sagittal.set(new THREE.Vector3(-1, 0, 0), built.X + (1 - us) * 0.9);
    else slicePlanes.sagittal.set(new THREE.Vector3(-1, 0, 0), 1e6);
    // CT: the ring slides up from the feet; everything below it is cut away
    const yRing = -1.35 + (built.Y + 1.35) * (ctk * ctk * (3 - 2 * ctk));
    if (ring.current) {
      ring.current.visible = ctk > 0.001;
      ring.current.position.y = yRing;
    }
    if (ctk > 0.001) slicePlanes.axial.set(new THREE.Vector3(0, 1, 0), -yRing);
    else slicePlanes.axial.set(new THREE.Vector3(0, 1, 0), 1e6);
    const discOpacity = at(t, STOP_INDEX.ultrasound + 0.84, STOP_INDEX.ultrasound + 0.95) * (1 - at(t, STOP_INDEX.scans + 0.08, STOP_INDEX.scans + 0.2));
    built.discMat.opacity = discOpacity;
    if (disc.current) disc.current.visible = discOpacity > 0.001;
    const moving = stopId === 'ultrasound' || stopId === 'scans';
    if (moving && visible && !reduced) {
      uTime.value += dt;
      if (rotor.current) rotor.current.rotation.y -= dt * 1.1;
    }
    if (us > 0 || ctk > 0) invalidate();
  });

  const fanPoint = (x: number, y: number) => new THREE.Vector3(x * FAN_SCALE, y * FAN_SCALE, 0.02).applyQuaternion(built.fanQuat).add(built.apex);
  const tumorOnFan = new THREE.Vector3(built.X + 0.02, built.C.y + TUMOR_R * 0.9, built.C.z + 0.05);
  const kidneyOnFan = new THREE.Vector3(built.X + 0.02, built.C.y + 0.3, built.C.z - 0.2);
  return (
    <group>
      {/* ultrasound */}
      <group ref={probe} visible={false}>
        <group quaternion={built.fanQuat} scale={FAN_SCALE}>
          <mesh geometry={built.lens}>
            <meshPhysicalMaterial color="#44474d" roughness={0.45} clearcoat={0.5} />
          </mesh>
          <mesh geometry={built.housing} material={built.plastic} position={[0, 0.22, 0]} />
          <mesh material={built.plastic} position={[0, 0.66, 0]}>
            <capsuleGeometry args={[0.105, 0.42, 6, 18]} />
          </mesh>
          <mesh geometry={built.cable}>
            <meshStandardMaterial color="#3a3c40" roughness={0.5} />
          </mesh>
        </group>
      </group>
      <mesh ref={fan} geometry={built.fanGeo} material={built.image} position={built.apex} quaternion={built.fanQuat} scale={FAN_SCALE} renderOrder={20} visible={false} />
      <Label3D visible={visible} at="ultrasound" position={fanPoint(0.22, 0.24)}>
        <div className="leader">
          <span className="leader__line" />
          <span className="tag">Probe</span>
        </div>
      </Label3D>
      <Label3D visible={visible} at="ultrasound" position={kidneyOnFan}>
        <div className="leader">
          <span className="leader__line" />
          <span className="tag">Kidney</span>
        </div>
      </Label3D>
      <Label3D visible={visible} at="ultrasound" position={tumorOnFan}>
        <div className="leader leader--left">
          <span className="leader__line" />
          <span className="tag">Tumor</span>
        </div>
      </Label3D>
      {/* CT */}
      <group ref={ring} visible={false}>
        <mesh geometry={built.gantry} material={built.shell} />
        <mesh position={[0, -0.181, 0]} rotation-x={Math.PI / 2}>
          <torusGeometry args={[1.62, 0.012, 8, 160]} />
          <meshStandardMaterial color="#7fb2e6" emissive="#4d86c2" emissiveIntensity={0.6} />
        </mesh>
        <group ref={rotor}>
          <mesh geometry={built.beam} material={built.beamMat} position={[0, -0.01, 0]} />
        </group>
      </group>
      <mesh ref={disc} position={[0, built.Y - 0.004, 0]} rotation-x={Math.PI / 2} material={built.discMat} renderOrder={20} visible={false}>
        <circleGeometry args={[CT_R, 96]} />
      </mesh>
      <Label3D visible={visible} at="scans" position={[-1.62, built.Y - 0.2, 0.55]} interactive>
        <div className="leader leader--left" style={{ animation: 'rise 700ms 450ms both' }}>
          <span className="leader__line" style={{ width: 30 }} />
          <span className="tag">
            <TermButton termKey="ct">CT scanner</TermButton> <Cites ids={[6]} />
          </span>
        </div>
      </Label3D>
      <Label3D visible={visible} at="scans" position={[-0.55, built.Y - 0.01, 0.42]} interactive>
        <div className="leader leader--left" style={{ animation: 'rise 700ms 650ms both' }}>
          <span className="leader__line" style={{ width: 36 }} />
          <span className="tag">
            One slice <small>of the belly</small>
          </span>
        </div>
      </Label3D>
      <Label3D visible={visible} at="scans" position={[built.C.x + 0.12, built.Y - 0.01, built.C.z + 0.06]} interactive>
        <div className="leader" style={{ animation: 'rise 700ms 850ms both' }}>
          <span className="leader__line" style={{ width: 44 }} />
          <span className="tag">
            Tumor <small>in the left kidney</small> <Cites ids={[6]} />
          </span>
        </div>
      </Label3D>
    </group>
  );
}
