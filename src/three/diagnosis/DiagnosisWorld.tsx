import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { journey, onJourneyFrame } from '../../app/journey';
import { useStopId, useStory } from '../../app/store';
import { STOP_INDEX } from '../../content/story';
import { Cites, TermButton } from '../../ui/RichText';
import { Label3D } from '../Label3D';
import { CT, FAN, makeCtTexture, makeSonogramTexture, SONO } from './scanTextures';

const uTime = { value: 0 };

function Note({ at }: { at: [number, number, number] }) {
  return (
    <Label3D visible position={at} center>
      <span className="tag">
        <small>Illustration, not a patient image</small>
      </span>
    </Label3D>
  );
}

/* ----------------------------------------------------------------- A · ultrasound (x = 0) */

const APEX = new THREE.Vector3(0, 0.75, 0);

function Ultrasound({ active }: { active: boolean }) {
  const built = useMemo(() => {
    const start = -Math.PI / 2 - FAN.half;
    const fan = new THREE.RingGeometry(FAN.inner, FAN.outer, 72, 1, start, FAN.half * 2);
    const backing = new THREE.RingGeometry(FAN.inner - 0.04, FAN.outer + 0.07, 72, 1, start - 0.035, FAN.half * 2 + 0.07);
    // the picture, with faint sound pulses running down from the probe
    const image = new THREE.ShaderMaterial({
      uniforms: { uMap: { value: makeSonogramTexture(512) }, uTime, uIn: { value: FAN.inner }, uOut: { value: FAN.outer } },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `
        uniform sampler2D uMap; uniform float uTime; uniform float uIn; uniform float uOut;
        varying vec2 vUv;
        void main() {
          vec3 c = texture2D(uMap, vUv).rgb;
          float r = length((vUv * 2.0 - 1.0) * uOut);
          float front = uIn + fract(uTime * 0.42) * (uOut - uIn);
          float wave = exp(-pow((r - front) / 0.04, 2.0)) * (1.0 - smoothstep(uOut * 0.6, uOut, r));
          gl_FragColor = vec4(c + vec3(0.35, 0.5, 0.7) * wave * 0.16, 1.0);
          #include <colorspace_fragment>
        }`,
    });
    // the probe: a curved rubber face, a plastic body and a handle, with its cable
    // a slice of a cylinder whose curved side is the fan's top edge (its axis points at the viewer)
    const lens = new THREE.CylinderGeometry(FAN.inner, FAN.inner, 0.3, 32, 1, false, -FAN.half, FAN.half * 2);
    lens.rotateX(Math.PI / 2);
    const plastic = new THREE.MeshPhysicalMaterial({ color: '#e9e6df', roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.3 });
    const cable = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([new THREE.Vector3(0, 1.0, 0), new THREE.Vector3(0.1, 1.5, -0.05), new THREE.Vector3(0.7, 2.0, -0.3), new THREE.Vector3(1.4, 2.3, -0.5)]),
      40,
      0.035,
      8,
      false,
    );
    return { fan, backing, image, lens, plastic, cable, housing: new RoundedBoxGeometry(0.42, 0.34, 0.3, 4, 0.08) };
  }, []);
  const img = (x: number, y: number, z = 0.02): [number, number, number] => [APEX.x + x, APEX.y + y, z];
  return (
    <group>
      <mesh geometry={built.backing} position={APEX} position-z={-0.01}>
        <meshBasicMaterial color="#0a0c0f" />
      </mesh>
      <mesh geometry={built.fan} material={built.image} position={APEX} />
      <group position={APEX}>
        <mesh geometry={built.lens}>
          <meshPhysicalMaterial color="#2b2d31" roughness={0.6} />
        </mesh>
        <mesh geometry={built.housing} material={built.plastic} position={[0, 0.22, 0]} />
        <mesh material={built.plastic} position={[0, 0.66, 0]}>
          <capsuleGeometry args={[0.105, 0.42, 6, 18]} />
        </mesh>
        <mesh geometry={built.cable}>
          <meshStandardMaterial color="#3a3c40" roughness={0.5} />
        </mesh>
      </group>
      <Label3D visible={active} position={[APEX.x + 0.26, APEX.y + 0.5, 0.1]} interactive>
        <div className="leader" style={{ animation: 'rise 700ms 450ms both' }}>
          <span className="leader__line" style={{ width: 34 }} />
          <span className="tag">
            Probe <small>sends sound waves in</small> <Cites ids={[6]} />
          </span>
        </div>
      </Label3D>
      <Label3D visible={active} position={img(SONO.kidney.x - 0.42, SONO.kidney.y + 0.1)} interactive>
        <div className="leader leader--left" style={{ animation: 'rise 700ms 650ms both' }}>
          <span className="leader__line" style={{ width: 40 }} />
          <span className="tag">Kidney</span>
        </div>
      </Label3D>
      <Label3D visible={active} position={img(SONO.tumor.x + 0.3, SONO.tumor.y + 0.12)} interactive>
        <div className="leader" style={{ animation: 'rise 700ms 850ms both' }}>
          <span className="leader__line" style={{ width: 40 }} />
          <span className="tag">
            Tumor <small>a round lump</small> <Cites ids={[6]} />
          </span>
        </div>
      </Label3D>
      {active && <Note at={[0, APEX.y - FAN.outer - 0.16, 0]} />}
    </group>
  );
}

/* ----------------------------------------------------------------- B · CT scanner (x = 20) */

/** Cross-section of the scanner's ring: a rounded rectangle turned around the axis. */
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
  const g = new THREE.LatheGeometry(pts, 128);
  g.rotateX(Math.PI / 2);
  return g;
}

function Scanner({ active }: { active: boolean }) {
  const reduced = useStory((s) => s.reducedMotion);
  const rotor = useRef<THREE.Group>(null);
  const built = useMemo(() => {
    const beam = new THREE.BufferGeometry();
    beam.setAttribute('position', new THREE.Float32BufferAttribute([0, 0.98, 0, -0.62, -0.78, 0, 0.62, -0.78, 0], 3));
    return {
      gantry: gantryGeometry(1.05, 1.75, 0.8, 0.12),
      shell: new THREE.MeshPhysicalMaterial({ color: '#eeede8', roughness: 0.32, clearcoat: 0.8, clearcoatRoughness: 0.2 }),
      slice: makeCtTexture(512),
      beam,
      beamMat: new THREE.MeshBasicMaterial({
        color: '#9cc8ff',
        transparent: true,
        opacity: 0.12,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    };
  }, []);
  useFrame((_, dt) => {
    if (active && rotor.current && !reduced) rotor.current.rotation.z -= dt * 1.1;
  });
  // a point on the slice picture (its coordinates run from −1 to 1 across the circle)
  const img = (x: number, y: number): [number, number, number] => [x * 0.98, y * 0.98, 0.03];
  return (
    <group position={[20, 0, 0]}>
      <mesh geometry={built.gantry} material={built.shell} />
      <mesh position={[0, 0, 0.402]}>
        <torusGeometry args={[1.42, 0.012, 8, 160]} />
        <meshStandardMaterial color="#7fb2e6" emissive="#4d86c2" emissiveIntensity={0.6} />
      </mesh>
      <mesh>
        <circleGeometry args={[0.98, 96]} />
        <meshBasicMaterial map={built.slice} toneMapped={false} />
      </mesh>
      {/* the x-ray tube and its fan of rays spin around the patient */}
      <group ref={rotor} position={[0, 0, 0.02]}>
        <mesh geometry={built.beam} material={built.beamMat} />
        <mesh position={[0, 1.0, 0]}>
          <boxGeometry args={[0.22, 0.08, 0.3]} />
          <meshStandardMaterial color="#34373c" roughness={0.4} metalness={0.3} />
        </mesh>
      </group>
      <Label3D visible={active} position={[1.3, 1.1, 0.4]} interactive>
        <div className="leader" style={{ animation: 'rise 700ms 450ms both' }}>
          <span className="leader__line" style={{ width: 30 }} />
          <span className="tag">
            <TermButton termKey="ct">CT scanner</TermButton> <Cites ids={[6]} />
          </span>
        </div>
      </Label3D>
      <Label3D visible={active} position={img(-0.62, 0.38)} interactive>
        <div className="leader leader--left" style={{ animation: 'rise 700ms 650ms both' }}>
          <span className="leader__line" style={{ width: 36 }} />
          <span className="tag">
            One slice <small>of the belly</small>
          </span>
        </div>
      </Label3D>
      <Label3D visible={active} position={img(CT.tumor.x + 0.22, CT.tumor.y + 0.08)} interactive>
        <div className="leader" style={{ animation: 'rise 700ms 850ms both' }}>
          <span className="leader__line" style={{ width: 44 }} />
          <span className="tag">
            Tumor <small>in the left kidney</small> <Cites ids={[6]} />
          </span>
        </div>
      </Label3D>
      {active && <Note at={[0, -1.98, 0.4]} />}
    </group>
  );
}

/* ----------------------------------------------------------------- world */

export function DiagnosisWorld({ visible }: { visible: boolean }) {
  const id = useStopId();
  const invalidate = useThree((s) => s.invalidate);
  const reduced = useStory((s) => s.reducedMotion);
  const parts = useRef<(THREE.Group | null)[]>([]);
  useFrame((_, dt) => {
    if (visible && !reduced) uTime.value += dt;
  });
  // The two set-ups sit side by side; only draw the one the camera is at. The zoom between them
  // passes through the veil, so the switch is never seen. Both start visible so the stage
  // compiles every shader up front.
  useEffect(() => {
    const apply = (t: number) => {
      const show = [t < STOP_INDEX.ultrasound + 0.5, t >= STOP_INDEX.ultrasound + 0.5];
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
        <Ultrasound active={visible && id === 'ultrasound'} />
      </group>
      <group ref={(g) => void (parts.current[1] = g)}>
        <Scanner active={visible && id === 'scans'} />
      </group>
    </group>
  );
}
