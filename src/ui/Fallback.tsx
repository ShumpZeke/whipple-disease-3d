import { useStory } from '../app/store';
import { STEPS } from '../content/story';

const IMAGES: Record<string, { src: string; alt: string }> = {
  anatomy: {
    src: '/fallback/digestive.webp',
    alt: 'Rendered 3D model of the digestive system with the small intestine coiled in the center.',
  },
  tissue: { src: '/fallback/tissue.webp', alt: 'Cutaway illustration of the small-intestine wall with layers, folds and villi.' },
  villi: { src: '/fallback/villi.webp', alt: 'Illustration of finger-like villi with a sectioned villus showing its lacteal and capillaries.' },
  micro: { src: '/fallback/micro.webp', alt: 'Illustration of macrophages packed with rod-shaped Tropheryma whipplei bacteria.' },
  diagnosis: { src: '/fallback/diagnosis.webp', alt: 'Illustration of a stained biopsy seen through a microscope.' },
};

/** Shown when WebGL is unavailable: all text, quiz and sources still work. */
export function Fallback() {
  const step = useStory((s) => s.step);
  const img = IMAGES[STEPS[step].world] ?? IMAGES.anatomy;
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
  const step = useStory((s) => s.step);
  const ready = useStory((s) => s.stageReady);
  if (ready || STEPS[step].world === 'none') return null;
  return (
    <div className="loading" role="status" aria-live="polite">
      Preparing the 3D model
      <div className="loading__bar">
        <span className="loading__indeterminate" />
      </div>
    </div>
  );
}
