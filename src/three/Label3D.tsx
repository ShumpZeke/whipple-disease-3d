import { Html } from '@react-three/drei';
import type { ReactNode } from 'react';

type V3 = [number, number, number] | { x: number; y: number; z: number };

/**
 * A DOM label pinned to a 3D point. It stays mounted and is hidden with CSS, because
 * mounting/unmounting drei <Html> roots during a React render logs errors in React 19.
 */
export function Label3D({
  visible,
  position,
  children,
  center = false,
  interactive = false,
}: {
  visible: boolean;
  position: V3;
  children: ReactNode;
  center?: boolean;
  interactive?: boolean;
}) {
  const p: [number, number, number] = Array.isArray(position) ? position : [position.x, position.y, position.z];
  return (
    <Html
      position={p}
      center={center}
      zIndexRange={[15, 10]}
      className="anchor-label"
      style={{ display: visible ? 'block' : 'none', pointerEvents: interactive && visible ? 'auto' : 'none' }}
    >
      {children}
    </Html>
  );
}
