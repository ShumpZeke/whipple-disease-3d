"""Generate the small procedural textures used by the exhibit (created for this project).

paper.webp  - tileable warm paper (low-frequency mottling + fibres + speckle)
grain.png   - tileable monochrome film grain for a very subtle overlay
"""
from pathlib import Path

import numpy as np
from PIL import Image

OUT = Path(__file__).resolve().parents[1] / "public" / "textures"
OUT.mkdir(parents=True, exist_ok=True)
rng = np.random.default_rng(1907)


def tileable_noise(size, scale, octaves=5, persistence=0.55):
    """Sum of periodic value-noise octaves via FFT-filtered white noise (tileable by construction)."""
    acc = np.zeros((size, size))
    amp, total = 1.0, 0.0
    fx = np.fft.fftfreq(size)[:, None]
    fy = np.fft.fftfreq(size)[None, :]
    r = np.sqrt(fx**2 + fy**2)
    for o in range(octaves):
        cutoff = scale * (2**o) / size
        spectrum = np.fft.fft2(rng.standard_normal((size, size)))
        filt = np.exp(-(r / max(cutoff, 1e-6)) ** 2)
        layer = np.real(np.fft.ifft2(spectrum * filt))
        layer = (layer - layer.mean()) / (layer.std() + 1e-9)
        acc += amp * layer
        total += amp
        amp *= persistence
    return acc / total


size = 1024
base = np.array([236, 227, 207], dtype=np.float64)  # warm paper
mottle = tileable_noise(size, 6, octaves=4)
fine = tileable_noise(size, 90, octaves=2)
img = base[None, None, :] * (1 + 0.035 * mottle[..., None] + 0.018 * fine[..., None])

# fibres: short random strokes, drawn periodically so the tile wraps
fib = np.zeros((size, size))
for _ in range(1400):
    x, y = rng.integers(0, size, 2)
    ang = rng.uniform(0, np.pi)
    length = rng.integers(8, 40)
    dx, dy = np.cos(ang), np.sin(ang)
    for t in range(length):
        fib[int(y + dy * t) % size, int(x + dx * t) % size] += rng.uniform(0.2, 1.0)
fib = np.clip(fib, 0, 1.5)
img *= (1 - 0.05 * fib[..., None])
# sparse speckles
spk = rng.random((size, size)) > 0.9993
img[spk] *= 0.78
img = np.clip(img, 0, 255).astype(np.uint8)
Image.fromarray(img, "RGB").save(OUT / "paper.webp", "WEBP", quality=78, method=6)

g = 128 + 38 * rng.standard_normal((256, 256))
Image.fromarray(np.clip(g, 0, 255).astype(np.uint8), "L").save(OUT / "grain.png", optimize=True)
for p in OUT.iterdir():
    print(p.name, p.stat().st_size // 1024, "KB")
