import { create } from 'zustand';
import { QUESTIONS } from '../content/quiz';
import { STOPS, STOP_INDEX, type StopId, type World } from '../content/story';
import type { OrganId } from '../three/anatomy/organs';
import { scrollToStop } from './journey';

export interface TermAnchor {
  key: string;
  /** Viewport rect of the element that opened the popover. */
  rect: { left: number; top: number; width: number; height: number };
}

/** firstTry: was the first attempt right? solved: has the right answer been found? */
export type QuizAnswer = { firstTry: boolean; solved: boolean };

interface State {
  /** Stop nearest to the current scroll position (changes only when the nearest stop changes). */
  stop: number;
  sourcesOpen: boolean;
  sourceFocus: number | null;
  glossaryOpen: boolean;
  term: TermAnchor | null;
  hoveredOrgan: OrganId | null;
  mechanism: 'healthy' | 'disease';
  quizIndex: number;
  quizAnswers: Record<string, QuizAnswer | undefined>;
  quizFeedback: { text: string; correct: boolean } | null;
  reducedMotion: boolean;
  stageReady: boolean;
  webgl: 'unknown' | 'ok' | 'failed';
  interacted: boolean;
  cameraResetNonce: number;
  historyNote: string | null;
  /** World the canvas is drawing at the current scroll position. */
  displayWorld: World;
  /** Worlds whose shaders have finished compiling (KHR_parallel_shader_compile). */
  worldReady: Partial<Record<World, boolean>>;

  setStop: (i: number) => void;
  goToId: (id: StopId) => void;
  next: () => void;
  back: () => void;
  restart: () => void;
  openSources: (focus?: number) => void;
  openGlossary: () => void;
  openTerm: (t: TermAnchor) => void;
  closeOverlays: () => void;
  closeTerm: () => void;
  setHovered: (o: OrganId | null) => void;
  setMechanism: (m: 'healthy' | 'disease') => void;
  answerOrgan: (organ: OrganId, organName: string) => void;
  answerChoice: (optionIndex: number) => void;
  nextQuestion: () => void;
  setReducedMotion: (v: boolean) => void;
  setStageReady: (v: boolean) => void;
  setWebgl: (v: 'ok' | 'failed') => void;
  markInteracted: () => void;
  resetCamera: () => void;
  setHistoryNote: (id: string | null) => void;
  setDisplayWorld: (w: World) => void;
  setWorldReady: (w: World) => void;
}

function record(prev: QuizAnswer | undefined, correct: boolean): QuizAnswer {
  if (!prev) return { firstTry: correct, solved: correct };
  return { firstTry: prev.firstTry, solved: prev.solved || correct };
}

export const useStory = create<State>((set, get) => ({
  stop: 0,
  sourcesOpen: false,
  sourceFocus: null,
  glossaryOpen: false,
  term: null,
  hoveredOrgan: null,
  mechanism: 'disease',
  quizIndex: 0,
  quizAnswers: {},
  quizFeedback: null,
  reducedMotion: false,
  stageReady: false,
  webgl: 'unknown',
  interacted: false,
  cameraResetNonce: 0,
  historyNote: null,
  displayWorld: 'none',
  worldReady: {},

  setStop: (i) => {
    if (i === get().stop) return;
    const leftSymptoms = STOPS[get().stop]?.id === 'symptoms' && STOPS[i]?.id !== 'symptoms';
    set({ stop: i, term: null, historyNote: null, quizFeedback: null, ...(leftSymptoms ? { mechanism: 'disease' as const } : {}) });
  },
  goToId: (id) => scrollToStop(STOP_INDEX[id]),
  next: () => scrollToStop(Math.round(window.scrollY / window.innerHeight) + 1),
  back: () => scrollToStop(Math.round(window.scrollY / window.innerHeight) - 1),
  restart: () => {
    set({
      quizIndex: 0,
      quizAnswers: {},
      quizFeedback: null,
      sourcesOpen: false,
      glossaryOpen: false,
      term: null,
      mechanism: 'disease',
      historyNote: null,
    });
    scrollToStop(0);
  },
  openSources: (focus) => set({ sourcesOpen: true, sourceFocus: focus ?? null, glossaryOpen: false, term: null }),
  openGlossary: () => set({ glossaryOpen: true, sourcesOpen: false, term: null }),
  openTerm: (t) => set({ term: t }),
  closeOverlays: () => set({ sourcesOpen: false, glossaryOpen: false, term: null, sourceFocus: null }),
  closeTerm: () => set({ term: null }),
  setHovered: (o) => set({ hoveredOrgan: o }),
  setMechanism: (m) => set({ mechanism: m }),
  answerOrgan: (organ, organName) => {
    const q = QUESTIONS[get().quizIndex];
    if (!q || q.kind !== 'organ') return;
    const correct = organ === q.answer;
    set((s) => ({
      quizAnswers: { ...s.quizAnswers, [q.id]: record(s.quizAnswers[q.id], correct) },
      quizFeedback: { correct, text: correct ? q.correct : q.retry.replace('{organ}', organName) },
    }));
  },
  answerChoice: (i) => {
    const q = QUESTIONS[get().quizIndex];
    if (!q || q.kind !== 'choice') return;
    const opt = q.options[i];
    const correct = !!opt.correct;
    set((s) => ({
      quizAnswers: { ...s.quizAnswers, [q.id]: record(s.quizAnswers[q.id], correct) },
      quizFeedback: { correct, text: correct ? q.correct : opt.why ?? 'Not quite — try another answer.' },
    }));
  },
  nextQuestion: () => set((s) => ({ quizIndex: Math.min(QUESTIONS.length, s.quizIndex + 1), quizFeedback: null })),
  setReducedMotion: (v) => set({ reducedMotion: v }),
  setStageReady: (v) => set({ stageReady: v }),
  setWebgl: (v) => set({ webgl: v }),
  markInteracted: () => {
    if (!get().interacted) set({ interacted: true });
  },
  resetCamera: () => set((s) => ({ cameraResetNonce: s.cameraResetNonce + 1 })),
  setHistoryNote: (id) => set({ historyNote: id }),
  setDisplayWorld: (w) => set({ displayWorld: w }),
  setWorldReady: (w) => set((s) => ({ worldReady: { ...s.worldReady, [w]: true } })),
}));

/** Id of the stop nearest to the scroll position (re-renders only when it changes). */
export const useStopId = () => useStory((s) => STOPS[s.stop].id);

export function quizScore(answers: State['quizAnswers']) {
  let firstTry = 0;
  let solved = 0;
  for (const q of QUESTIONS) {
    if (answers[q.id]?.firstTry) firstTry++;
    if (answers[q.id]?.solved) solved++;
  }
  return { firstTry, solved, total: QUESTIONS.length };
}
