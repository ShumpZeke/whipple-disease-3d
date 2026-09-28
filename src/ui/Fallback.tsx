import { useStory } from '../app/store';
import { STOPS } from '../content/story';

const IMAGES: Record<string, { src: string; alt: string }> = {
  anatomy: {
    src: '/fallback/urinary.webp',
    alt: 'Rendered 3D model of the urinary system: two kidneys, the ureters and the bladder, with the aorta and the vena cava.',
  },
  kidney: {
    src: '/fallback/kidney.webp',
    alt: 'Illustration of a kidney cut in half, showing the outer cortex, the dark pyramids of the medulla, the renal pelvis and the ureter.',
  },
  nephron: {
    src: '/fallback/nephron.webp',
    alt: 'Illustration of a glomerulus, a ball of tiny blood vessels inside a cup, with the tubule leaving it.',
  },
  cells: {
    src: '/fallback/cells.webp',
    alt: 'Illustration of a ring of mature kidney cells next to a growing clump of young cells.',
  },
  diagnosis: {
    src: '/fallback/diagnosis.webp',
    alt: 'Illustration of an ultrasound probe and a fan-shaped scan picture showing a kidney and a round tumor.',
  },
};

/** Shown when WebGL is unavailable: all text, quiz and sources still work. */
export function Fallback() {
  const stop = useStory((s) => s.stop);
  const img = IMAGES[STOPS[stop].world] ?? IMAGES.anatomy;
  return (
    <>
      <div className="fallback-img">
        <img src={img.src} alt={img.alt} onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')} />
      </div>
      <p className="fallback-note" role="status">
        Interactive 3D isn’t available on this device, so still images are shown. All facts, terms and sources still work.
      </p>
    </>
  );
}

export function StageLoading() {
  const stop = useStory((s) => s.stop);
  const ready = useStory((s) => s.stageReady);
  if (ready || STOPS[stop].world === 'none') return null;
  return (
    <div className="loading" role="status" aria-live="polite">
      Loading the 3D model
      <span className="loading__ascii" aria-hidden="true" />
    </div>
  );
}
