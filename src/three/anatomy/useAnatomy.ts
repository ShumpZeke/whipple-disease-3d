import { useGLTF } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';
import { createOrganMaterial, type OrganMaterial } from './organMaterial';
import { isOrganId, ORGANS, type OrganId } from './organs';

export const MODEL_URL = '/models/urinary.glb';
/** The GLB is in metres (≈0.34 m tall); the exhibit shows it at 5× so camera numbers stay friendly. */
export const MODEL_SCALE = 5;

export interface AnatomyData {
  meshes: Partial<Record<OrganId, THREE.Mesh>>;
  materials: Partial<Record<OrganId, OrganMaterial>>;
  /** Anchor positions in model space (metres, before MODEL_SCALE). */
  anchors: Record<string, { position: THREE.Vector3; normal: THREE.Vector3 }>;
  root: THREE.Group;
  bounds: THREE.Box3;
  /** The left ureter as its own mesh (same material as the right one), so it can leave with its kidney. */
  leftUreter: THREE.Mesh | null;
}

/** Split an indexed mesh into the triangles left (+X) and right (−X) of its own origin. */
function splitByX(g: THREE.BufferGeometry): [THREE.BufferGeometry, THREE.BufferGeometry] {
  const pos = g.getAttribute('position');
  const index = g.getIndex();
  const n = index ? index.count : pos.count;
  const at = (i: number) => (index ? index.getX(i) : i);
  const left: number[] = [];
  const right: number[] = [];
  for (let i = 0; i < n; i += 3) {
    const a = at(i);
    const b = at(i + 1);
    const c = at(i + 2);
    (pos.getX(a) + pos.getX(b) + pos.getX(c) > 0 ? left : right).push(a, b, c);
  }
  const make = (idx: number[]) => {
    const h = new THREE.BufferGeometry();
    for (const [k, v] of Object.entries(g.attributes)) h.setAttribute(k, v);
    h.setIndex(idx);
    return h;
  };
  return [make(left), make(right)];
}

const cache = new WeakMap<object, AnatomyData>();

/** Load the urinary-system GLB once and wire up the organ materials and anchor empties (shared by all callers). */
export function useAnatomy(): AnatomyData {
  const gltf = useGLTF(MODEL_URL);
  return useMemo(() => {
    const hit = cache.get(gltf.scene);
    if (hit) return hit;
    const root = new THREE.Group();
    const meshes: AnatomyData['meshes'] = {};
    const materials: AnatomyData['materials'] = {};
    const anchors: AnatomyData['anchors'] = {};
    let leftUreter: THREE.Mesh | null = null;
    gltf.scene.updateMatrixWorld(true);
    gltf.scene.traverse((o) => {
      const name = o.name.replace(/\.\d+$/, '');
      if ((o as THREE.Mesh).isMesh && isOrganId(name)) {
        const mesh = (o as THREE.Mesh).clone();
        mesh.name = name;
        mesh.geometry = (o as THREE.Mesh).geometry;
        const mat = createOrganMaterial(ORGANS[name], MODEL_SCALE);
        mesh.material = mat;
        mesh.userData.organ = name;
        mesh.position.copy(o.getWorldPosition(new THREE.Vector3()));
        mesh.quaternion.copy(o.getWorldQuaternion(new THREE.Quaternion()));
        mesh.scale.copy(o.getWorldScale(new THREE.Vector3()));
        mesh.updateMatrix();
        mat.userData.uniforms.uObjMatrix.value.copy(mesh.matrix);
        mesh.userData.base = mesh.position.clone();
        meshes[name] = mesh;
        materials[name] = mat;
        root.add(mesh);
        if (name === 'Ureters') {
          const [l, r] = splitByX(mesh.geometry);
          mesh.geometry = r;
          leftUreter = mesh.clone();
          leftUreter.geometry = l;
          leftUreter.userData = { organ: name, base: mesh.position.clone() };
          root.add(leftUreter);
        }
      } else if (name.startsWith('anchor_') || name.startsWith('label_')) {
        const position = o.getWorldPosition(new THREE.Vector3());
        const q = o.getWorldQuaternion(new THREE.Quaternion());
        // Blender stored the surface normal on the empty's local +Z, which the glTF exporter maps to local +Y
        const normal = new THREE.Vector3(0, 1, 0).applyQuaternion(q).normalize();
        anchors[name] = { position, normal };
      }
    });
    const bounds = new THREE.Box3().setFromObject(root);
    const data = { meshes, materials, anchors, root, bounds, leftUreter };
    cache.set(gltf.scene, data);
    return data;
  }, [gltf]);
}

useGLTF.preload(MODEL_URL);
