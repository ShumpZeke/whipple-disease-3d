import * as THREE from 'three';
import { mulberry32 } from '../tissue/tissueGeometry';

/**
 * Procedural illustration of a PAS-stained small-bowel biopsy (NOT a patient image):
 * pale pink tissue, blunted villi, purple nuclei, and magenta "PAS-positive" macrophages
 * crowding the villus cores.
 */
export function makePasTexture(size = 1024): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  const rnd = mulberry32(1907);
  const S = size;

  g.fillStyle = '#f4e3e8';
  g.fillRect(0, 0, S, S);
  // lumen (top) is empty/pale
  const grad = g.createLinearGradient(0, 0, 0, S);
  grad.addColorStop(0, '#fbf3f5');
  grad.addColorStop(0.35, '#f7e7ec');
  grad.addColorStop(1, '#efd3dc');
  g.fillStyle = grad;
  g.fillRect(0, 0, S, S);

  // villi: broad, blunted fingers rising from the bottom
  const villi: { x: number; w: number; top: number }[] = [];
  for (let x = S * 0.08; x < S * 0.95; x += S * (0.16 + rnd() * 0.04)) {
    villi.push({ x, w: S * (0.1 + rnd() * 0.035), top: S * (0.28 + rnd() * 0.12) });
  }
  for (const v of villi) {
    const path = new Path2D();
    path.moveTo(v.x - v.w / 2, S);
    path.lineTo(v.x - v.w / 2, v.top + v.w / 2);
    path.quadraticCurveTo(v.x - v.w / 2, v.top, v.x, v.top);
    path.quadraticCurveTo(v.x + v.w / 2, v.top, v.x + v.w / 2, v.top + v.w / 2);
    path.lineTo(v.x + v.w / 2, S);
    path.closePath();
    // lamina propria
    g.fillStyle = '#eec6d2';
    g.fill(path);
    // epithelium border with a row of nuclei
    g.lineWidth = S * 0.018;
    g.strokeStyle = '#e1a9bf';
    g.stroke(path);
    g.save();
    g.clip(path);
    for (let y = v.top + 8; y < S; y += 9) {
      for (const side of [-1, 1]) {
        g.fillStyle = 'rgba(96, 58, 140, 0.75)';
        g.beginPath();
        g.ellipse(v.x + side * (v.w / 2 - S * 0.012), y + rnd() * 4, 3.2, 6, 0, 0, Math.PI * 2);
        g.fill();
      }
    }
    // PAS-positive foamy macrophages crowding the core
    for (let i = 0; i < 26; i++) {
      const mx = v.x + (rnd() - 0.5) * v.w * 0.62;
      const my = v.top + v.w * 0.35 + rnd() * (S - v.top) * 0.9;
      const r = S * (0.012 + rnd() * 0.012);
      const rg = g.createRadialGradient(mx, my, r * 0.2, mx, my, r);
      rg.addColorStop(0, '#d0518f');
      rg.addColorStop(0.7, '#b3246f');
      rg.addColorStop(1, 'rgba(179, 36, 111, 0.2)');
      g.fillStyle = rg;
      g.beginPath();
      g.arc(mx, my, r, 0, Math.PI * 2);
      g.fill();
      // granular "foamy" texture
      for (let k = 0; k < 7; k++) {
        g.fillStyle = 'rgba(255, 210, 235, 0.55)';
        g.beginPath();
        g.arc(mx + (rnd() - 0.5) * r * 1.2, my + (rnd() - 0.5) * r * 1.2, r * 0.14, 0, Math.PI * 2);
        g.fill();
      }
    }
    // scattered lymphocyte nuclei
    for (let i = 0; i < 30; i++) {
      g.fillStyle = 'rgba(80, 50, 130, 0.7)';
      g.beginPath();
      g.arc(v.x + (rnd() - 0.5) * v.w * 0.8, v.top + rnd() * (S - v.top), 2.6, 0, Math.PI * 2);
      g.fill();
    }
    g.restore();
  }
  // microscope field vignette
  const vg = g.createRadialGradient(S / 2, S / 2, S * 0.3, S / 2, S / 2, S * 0.5);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(40,20,30,0.45)');
  g.fillStyle = vg;
  g.fillRect(0, 0, S, S);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}
