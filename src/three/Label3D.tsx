import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef, type ReactNode } from 'react';

type V3 = [number, number, number] | { x: number; y: number; z: number };

const MARGIN = 8;

/**
 * A DOM label pinned to a 3D point. It stays mounted and is hidden with CSS, because
 * mounting/unmounting drei <Html> roots during a React render logs errors in React 19.
 * On narrow screens it keeps itself on screen: a leader label swaps to the other side of its
 * point, and a plain tag slides back inside the edge.
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
  const box = useRef<HTMLDivElement>(null);
  const shift = useRef(0);

  useFrame(() => {
    const el = box.current;
    if (!el || !visible) return;
    const vw = window.innerWidth;
    const leader = el.firstElementChild as HTMLElement | null;
    if (leader?.classList.contains('leader')) {
      const base = (leader.dataset.side ??= leader.classList.contains('leader--left') ? 'left' : 'right');
      const r = leader.getBoundingClientRect();
      const onLeft = leader.classList.contains('leader--left');
      const anchor = onLeft ? r.right : r.left;
      const room = (left: boolean) => (left ? anchor - MARGIN : vw - MARGIN - anchor);
      const prefer = base === 'left';
      // its own side if it fits, else the other side if that fits, else whichever has more room
      const wantLeft = room(prefer) >= r.width ? prefer : room(!prefer) >= r.width ? !prefer : room(true) > room(false);
      if (wantLeft !== onLeft) leader.classList.toggle('leader--left', wantLeft);
      return;
    }
    const r = el.getBoundingClientRect();
    const left = r.left - shift.current;
    let s = 0;
    if (left + r.width > vw - MARGIN) s = vw - MARGIN - (left + r.width);
    if (left + s < MARGIN) s = MARGIN - left;
    if (Math.abs(s - shift.current) > 0.5) {
      shift.current = s;
      el.style.transform = s ? `translateX(${s.toFixed(1)}px)` : '';
    }
  });

  return (
    <Html
      position={p}
      center={center}
      zIndexRange={[15, 10]}
      className="anchor-label"
      style={{ display: visible ? 'block' : 'none', pointerEvents: interactive && visible ? 'auto' : 'none' }}
    >
      <div ref={box}>{children}</div>
    </Html>
  );
}
