import type { Category } from '../content/story';

/** One small line icon per part of the story, drawn in the part's colour (currentColor). */
const PATHS: Record<Category | 'sources', string> = {
  // a house
  intro: 'M4 11.5 12 5l8 6.5M6.5 10v9h11v-9',
  // a page of an old article
  history: 'M7 3.5h7l4 4V20.5H7zM14 3.5v4h4M9.5 11.5h6M9.5 14.5h6M9.5 17.5h4',
  // a winding intestine
  disease: 'M6 4.5h8.5a3.25 3.25 0 0 1 0 6.5H9.5a3.25 3.25 0 0 0 0 6.5H18',
  // a rod-shaped bacterium
  cause: 'M5.6 15.9l8.5-8.5a2.9 2.9 0 0 1 4.1 4.1l-8.5 8.5a2.9 2.9 0 0 1-4.1-4.1zM3.5 20.5l1.5-1.5M19 5l1.5-1.5',
  // a pulse line
  symptoms: 'M3 12.5h4l2.2-5.5 3.6 11 2.4-5.5H21',
  // a microscope
  diagnosis: 'M9.5 4.5l3-1.6 3.6 6.8-3 1.6zM11.7 11.1l1.2 2.3M16.5 9.5a6 6 0 0 1-3 10M6 20.5h12M8 17h6',
  // a capsule
  treatment: 'M5.2 14.4l9.2-9.2a3.4 3.4 0 0 1 4.8 4.8l-9.2 9.2a3.4 3.4 0 0 1-4.8-4.8zM9.8 9.8l4.4 4.4',
  // a question mark in a circle
  check: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.6 9.4a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.6M12 16.8v.1',
  // a checklist
  summary: 'M10 7h9.5M10 12h9.5M10 17h9.5M4.5 7l1.2 1.2L7.8 6M4.5 12l1.2 1.2L7.8 11M4.5 17l1.2 1.2L7.8 16',
  // a book
  sources: 'M5 5.5A2 2 0 0 1 7 3.5h12v14H7a2 2 0 0 0-2 2zM5 19.5a2 2 0 0 0 2 1h12v-3',
};

export function CatIcon({ cat, className = 'cat-icon' }: { cat: Category | 'sources'; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d={PATHS[cat]} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
