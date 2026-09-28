import * as THREE from 'three';
import { mulberry32 } from '../random';
import { CORTEX, depthInside, HALF, medullaReach, outlinePoint, PYRAMIDS, SINUS } from './kidneyShape';

/**
 * The painted cut face of the kidney (an illustration, colours chosen for clarity): the outer
 * cortex dotted with tiny filters, the dark striped pyramids of the medulla, the fat and the pale
 * funnel of the renal pelvis in the middle, and the arteries and veins that branch between them.
 */
export function makeSectionTexture(size = 1024): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  const rnd = mulberry32(1899);
  const k = size / (2 * HALF);
  const X = (x: number) => (x + HALF) * k;
  const Y = (y: number) => (HALF - y) * k;
  const at = (phi: number, d: number) => [X(SINUS.x + Math.cos(phi) * d), Y(SINUS.y + Math.sin(phi) * d)] as const;

  // outline
  const outline = new Path2D();
  const p = new THREE.Vector2();
  for (let i = 0; i <= 360; i++) {
    outlinePoint((i / 360) * Math.PI * 2, 0, p);
    if (i === 0) outline.moveTo(X(p.x), Y(p.y));
    else outline.lineTo(X(p.x), Y(p.y));
  }
  outline.closePath();

  // cortex (the renal columns between the pyramids are cortex too)
  g.fillStyle = '#bf6350';
  g.fill(outline);
  g.save();
  g.clip(outline);

  // pyramids of the medulla
  const reach = PYRAMIDS.map((py) => medullaReach(py.phi));
  PYRAMIDS.forEach((py, i) => {
    const base: (readonly [number, number])[] = [];
    for (let s = 0; s <= 14; s++) {
      const phi = py.phi - py.half + (2 * py.half * s) / 14;
      base.push(at(phi, medullaReach(phi) + 0.01));
    }
    const mid = (py.tip + reach[i]) * 0.5;
    const apex = at(py.phi, py.tip);
    const path = new Path2D();
    path.moveTo(...apex);
    path.quadraticCurveTo(...at(py.phi - py.half * 0.95, mid), ...base[0]);
    for (const b of base) path.lineTo(...b);
    path.quadraticCurveTo(...at(py.phi + py.half * 0.95, mid), ...apex);
    path.closePath();
    const grad = g.createLinearGradient(...at(py.phi, reach[i]), ...apex);
    grad.addColorStop(0, '#561519');
    grad.addColorStop(0.7, '#6a2024');
    grad.addColorStop(1, '#94463e');
    g.fillStyle = grad;
    g.fill(path);
    // fine stripes running to the tip (the collecting ducts)
    g.save();
    g.clip(path);
    for (let s = 0; s < 34; s++) {
      const b = base[Math.min(14, Math.round((s / 33) * 14))];
      g.strokeStyle = s % 2 ? 'rgba(35,6,8,0.22)' : 'rgba(255,196,180,0.08)';
      g.lineWidth = 1.3;
      g.beginPath();
      g.moveTo(...apex);
      g.lineTo(b[0] + (rnd() - 0.5) * 6, b[1] + (rnd() - 0.5) * 6);
      g.stroke();
    }
    g.restore();
  });

  // fat of the renal sinus, open to the hilum on the left
  const fat = new Path2D();
  const lipTop = outlinePoint(Math.PI - 0.55, 0, new THREE.Vector2());
  const lipBottom = outlinePoint(Math.PI + 0.55, 0, new THREE.Vector2());
  fat.moveTo(X(lipTop.x), Y(lipTop.y));
  for (let s = 0; s <= 40; s++) {
    const phi = THREE.MathUtils.degToRad(150 - (300 * s) / 40);
    fat.lineTo(...at(phi, 0.26 + 0.015 * Math.sin(s * 1.7)));
  }
  fat.lineTo(X(lipBottom.x), Y(lipBottom.y));
  fat.lineTo(X(-HALF), Y(lipBottom.y));
  fat.lineTo(X(-HALF), Y(lipTop.y));
  fat.closePath();
  g.fillStyle = '#d9b77e';
  g.fill(fat);
  g.save();
  g.clip(fat);
  for (let s = 0; s < 120; s++) {
    g.fillStyle = s % 2 ? 'rgba(255,240,200,0.25)' : 'rgba(150,110,50,0.14)';
    g.beginPath();
    g.arc(X(SINUS.x + (rnd() - 0.6) * 0.6), Y((rnd() - 0.5) * 0.6), (2 + rnd() * 5) * (size / 1024), 0, Math.PI * 2);
    g.fill();
  }
  g.restore();

  // blood vessels: arteries (red) and veins (blue) branch between the pyramids, then arch along
  // their bases, with small branches up into the cortex
  const gaps = PYRAMIDS.slice(0, -1).map((py, i) => (py.phi + PYRAMIDS[i + 1].phi) / 2);
  const mouth = [X(-0.4), Y(0.02)] as const;
  const vessel = (color: string, w: number, shift: number, inset: number, twigs: boolean) => {
    g.strokeStyle = color;
    g.lineCap = 'round';
    for (const phi of gaps) {
      const a = phi + shift;
      g.lineWidth = w * k;
      g.beginPath();
      g.moveTo(...mouth);
      g.quadraticCurveTo(...at(a, 0.06), ...at(a, 0.24));
      g.lineTo(...at(a, medullaReach(a) - 0.01));
      g.stroke();
    }
    PYRAMIDS.forEach((py) => {
      g.lineWidth = w * 0.8 * k;
      g.beginPath();
      for (let s = 0; s <= 16; s++) {
        const phi = py.phi - py.half - 0.12 + ((2 * py.half + 0.24) * s) / 16;
        const [x, y] = at(phi, medullaReach(phi) + inset);
        if (s === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.stroke();
      if (!twigs) return;
      g.lineWidth = w * 0.35 * k;
      for (let s = 0; s <= 6; s++) {
        const phi = py.phi - py.half + (2 * py.half * s) / 6;
        const r0 = medullaReach(phi) + inset;
        g.beginPath();
        g.moveTo(...at(phi, r0));
        g.lineTo(...at(phi + (rnd() - 0.5) * 0.04, r0 + CORTEX * (0.55 + rnd() * 0.25)));
        g.stroke();
      }
    });
  };
  vessel('#3f5c97', 0.024, 0.045, -0.012, false);
  vessel('#bf332d', 0.019, 0, 0.006, true);

  // renal pelvis and the cups (calyces) that catch urine from each pyramid tip
  const pelvisC = [SINUS.x - 0.01, SINUS.y] as const;
  const cups = (color: string, extra: number) => {
    g.strokeStyle = color;
    g.fillStyle = color;
    g.lineCap = 'round';
    for (const py of PYRAMIDS) {
      g.lineWidth = (0.036 + extra) * k;
      g.beginPath();
      g.moveTo(X(pelvisC[0]), Y(pelvisC[1]));
      g.quadraticCurveTo(...at(py.phi, py.tip * 0.45), ...at(py.phi, py.tip - 0.045));
      g.stroke();
      const [tx, ty] = at(py.phi, py.tip);
      const back = -py.phi; // canvas y points down, so angles flip
      g.lineWidth = (0.028 + extra) * k;
      g.beginPath();
      g.arc(tx, ty, 0.05 * k, back + Math.PI - 1.25, back + Math.PI + 1.25);
      g.stroke();
    }
    // the funnel, narrowing towards the hilum where it becomes the ureter
    g.beginPath();
    g.ellipse(X(pelvisC[0]), Y(pelvisC[1]), (0.11 + extra) * k, (0.15 + extra) * k, 0, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.moveTo(X(pelvisC[0]), Y(0.13 + extra));
    g.lineTo(X(-0.5), Y(0.05 + extra));
    g.lineTo(X(-0.5), Y(-0.1 - extra));
    g.lineTo(X(pelvisC[0]), Y(-0.14 - extra));
    g.closePath();
    g.fill();
  };
  cups('#b8a591', 0.014);
  cups('#eee2d3', 0);
  const sheen = g.createRadialGradient(X(pelvisC[0] - 0.02), Y(0.04), 0, X(pelvisC[0]), Y(0), 0.18 * k);
  sheen.addColorStop(0, 'rgba(255,255,255,0.35)');
  sheen.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = sheen;
  g.fillRect(X(-0.5), Y(0.2), 0.5 * k, 0.4 * k);

  // tiny filters (glomeruli) dot the cortex
  for (let s = 0; s < 1600; s++) {
    const x = (rnd() * 2 - 1) * 0.66;
    const y = (rnd() * 2 - 1) * 1.0;
    const d = depthInside(x, y);
    if (d < 0.025 || d > CORTEX - 0.015) continue;
    g.fillStyle = rnd() < 0.8 ? 'rgba(104,18,20,0.55)' : 'rgba(255,214,200,0.35)';
    g.beginPath();
    g.arc(X(x), Y(y), (1.1 + rnd() * 1.1) * (size / 1024), 0, Math.PI * 2);
    g.fill();
  }

  // soft mottling and fine grain, so it reads as tissue rather than flat paint
  const noise = (n: number) => {
    const nc = document.createElement('canvas');
    nc.width = nc.height = n;
    const ng = nc.getContext('2d')!;
    const img = ng.createImageData(n, n);
    for (let i = 0; i < n * n; i++) {
      const v = 90 + rnd() * 76;
      img.data.set([v, v, v, 255], i * 4);
    }
    ng.putImageData(img, 0, 0);
    return nc;
  };
  g.globalCompositeOperation = 'overlay';
  g.imageSmoothingEnabled = true;
  g.globalAlpha = 0.3;
  g.drawImage(noise(48), 0, 0, size, size);
  g.globalAlpha = 0.12;
  g.drawImage(noise(512), 0, 0, size, size);
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'source-over';
  g.restore();

  // the thin, shiny capsule around the outside
  g.lineWidth = 3.2 * (size / 1024);
  g.strokeStyle = 'rgba(246,224,210,0.95)';
  g.stroke(outline);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}
