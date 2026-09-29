import * as THREE from 'three';
import { mulberry32 } from '../random';

/*
 * The two pages of Max Wilms's book, drawn into canvases. Left: the title page, set like an old
 * printed title page (the real title, in German). Right: a plate whose drawing is the 3D organs
 * themselves, pressed flat onto the paper; the page only carries its frame and caption.
 * The lamp's warm light is painted in, so the pages look lit without depending on the scene's
 * lights (which go out as the drawing turns into 3D).
 */

const W = 1024;
const H = Math.round((W * 2.45) / 1.74);

/** Old paper, lit by the lamp standing to the left of the book; darker into the spine. */
function paper(g: CanvasRenderingContext2D, gutterOnRight: boolean, seed: number) {
  const rnd = mulberry32(seed);
  g.fillStyle = '#efe3c8';
  g.fillRect(0, 0, W, H);
  // fibres and foxing
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = rnd() < 0.5 ? 'rgba(120,90,50,0.035)' : 'rgba(255,250,235,0.05)';
    g.fillRect(rnd() * W, rnd() * H, 1 + rnd() * 3, 1 + rnd() * 3);
  }
  for (let i = 0; i < 18; i++) {
    const r = 3 + rnd() * 14;
    const grad = g.createRadialGradient(0, 0, 0, 0, 0, r);
    grad.addColorStop(0, 'rgba(150,105,55,0.1)');
    grad.addColorStop(1, 'rgba(150,105,55,0)');
    g.save();
    g.translate(rnd() * W, rnd() * H);
    g.fillStyle = grad;
    g.fillRect(-r, -r, r * 2, r * 2);
    g.restore();
  }
  // lamp light from the left: warm near the lamp, falling off to the right (the right page is farther)
  const lx = gutterOnRight ? -W * 0.1 : -W * 1.1;
  const light = g.createRadialGradient(lx, H * 0.3, W * 0.2, lx, H * 0.3, W * 2.4);
  light.addColorStop(0, 'rgba(255,214,150,0.2)');
  light.addColorStop(0.45, 'rgba(255,200,130,0.05)');
  light.addColorStop(1, 'rgba(40,20,5,0.22)');
  g.fillStyle = light;
  g.fillRect(0, 0, W, H);
  // darker towards the outer edge, and more so into the spine
  const edge = g.createLinearGradient(0, 0, W, 0);
  edge.addColorStop(0, gutterOnRight ? 'rgba(60,35,10,0.14)' : 'rgba(60,35,10,0.38)');
  edge.addColorStop(0.1, 'rgba(60,35,10,0)');
  edge.addColorStop(0.9, 'rgba(60,35,10,0)');
  edge.addColorStop(1, gutterOnRight ? 'rgba(60,35,10,0.38)' : 'rgba(60,35,10,0.14)');
  g.fillStyle = edge;
  g.fillRect(0, 0, W, H);
}

function texture(c: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

const SERIF = 'Georgia, "Times New Roman", serif';

/** The title page: DIE MISCHGESCHWÜLSTE DER NIERE, von Dr. Max Wilms, 1899. */
export function titlePage() {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  paper(g, true, 11);
  g.fillStyle = '#2a1d12';
  g.textAlign = 'center';
  g.textBaseline = 'alphabetic';
  // centred a little away from the spine, where the page curves down
  const cx = W * 0.44;
  const line = (text: string, y: number, size0: number, opts: { italic?: boolean; spacing?: number; weight?: number } = {}) => {
    const font = (s: number) => `${opts.italic ? 'italic ' : ''}${opts.weight ?? 400} ${s}px ${SERIF}`;
    // shrink a line that would not fit inside the page margins
    g.font = font(size0);
    const full = g.measureText(text).width + (opts.spacing ?? 0) * (text.length - 1);
    const size = full > W * 0.68 ? size0 * ((W * 0.68) / full) : size0;
    g.font = font(size);
    if (opts.spacing) {
      // letter-spaced capitals, as printers set titles
      const chars = [...text];
      const widths = chars.map((ch) => g.measureText(ch).width);
      const total = widths.reduce((a, b) => a + b, 0) + opts.spacing * (chars.length - 1);
      let x = cx - total / 2;
      g.textAlign = 'left';
      chars.forEach((ch, i) => {
        g.fillText(ch, x, y);
        x += widths[i] + opts.spacing!;
      });
      g.textAlign = 'center';
    } else g.fillText(text, cx, y);
  };
  const rule = (y: number, w: number) => {
    g.fillRect(cx - w / 2, y, w, 3);
    g.fillRect(cx - w / 2 + 8, y + 7, w - 16, 1.5);
  };
  line('DIE', H * 0.2, 46, { spacing: 12 });
  line('MISCHGESCHWÜLSTE', H * 0.275, 76, { spacing: 5, weight: 700 });
  line('DER NIERE', H * 0.345, 64, { spacing: 10, weight: 700 });
  rule(H * 0.39, 360);
  line('von', H * 0.47, 40, { italic: true });
  line('Dr. MAX WILMS', H * 0.53, 54, { spacing: 5 });
  rule(H * 0.6, 200);
  // a small printer's ornament
  g.strokeStyle = '#2a1d12';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(cx - 70, H * 0.7);
  g.bezierCurveTo(cx - 30, H * 0.66, cx - 10, H * 0.74, cx, H * 0.7);
  g.bezierCurveTo(cx + 10, H * 0.66, cx + 30, H * 0.74, cx + 70, H * 0.7);
  g.stroke();
  g.beginPath();
  g.arc(cx, H * 0.7, 6, 0, Math.PI * 2);
  g.fill();
  line('1899', H * 0.86, 50, { spacing: 10 });
  return texture(c);
}

/** The plate: a ruled frame for the drawing, "Plate I" above and its caption below. */
export function platePage() {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  paper(g, false, 12);
  g.fillStyle = '#2a1d12';
  g.strokeStyle = 'rgba(42,29,18,0.8)';
  g.textAlign = 'center';
  // frame round the drawing (the organs fill x ±0.45, y ±0.86 of this 1.74 × 2.45 page)
  const px = (x: number) => ((x + 0.87) / 1.74) * W;
  const py = (y: number) => ((1.25 - y) / 2.45) * H;
  g.lineWidth = 2.5;
  g.strokeRect(px(-0.7), py(1.02), px(0.7) - px(-0.7), py(-0.98) - py(1.02));
  g.lineWidth = 1;
  g.strokeRect(px(-0.68), py(1.0), px(0.68) - px(-0.68), py(-0.96) - py(1.0));
  g.font = `400 34px ${SERIF}`;
  g.fillText('PLATE I.', W / 2, py(1.1));
  g.font = `italic 400 38px ${SERIF}`;
  g.fillText('The urinary organs', W / 2, py(-1.07));
  return texture(c);
}

/** A page with a slight curl down into the book's spine (gutter on the given side). */
export function pageGeometry(width: number, height: number, gutterLeft: boolean) {
  const g = new THREE.PlaneGeometry(width, height, 40, 1);
  const pos = g.getAttribute('position');
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const fromGutter = gutterLeft ? x + width / 2 : width / 2 - x;
    const k = Math.max(0, 1 - fromGutter / (width * 0.22));
    // flat where the drawing is, dipping into the spine near the gutter (never in front of the drawing)
    pos.setZ(i, -0.09 * k * k);
  }
  g.computeVertexNormals();
  return g;
}
