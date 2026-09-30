import { create } from 'zustand';
import { QUESTIONS } from '../content/quiz';
import { nextPause, prevPause, STOPS, STOP_INDEX, type StopId, type World } from '../content/story';
import type { OrganId } from '../three/anatomy/organs';
import { currentTargetStop, scrollToStop } from './journey';

export interface TermAnchor {
  key: string;
  /** Viewport rect of the element that opened the popover. */
  rect: { left: number; top: number; width: number; height: number };
}

/** The one answer given to a question (the index of the option picked) and whether it was right. */
export type QuizAnswer = { picked: number; correct: boolean };

interface State {
  /** Stop nearest to the current scroll position (changes only when the nearest stop changes). */
  stop: number;
  sourcesOpen: boolean;
  sourceFocus: number | null;
  glossaryOpen: boolean;
  term: TermAnchor | null;
  hoveredOrgan: OrganId | null;
  quizIndex: number;
  quizAnswers: Record<string, QuizAnswer | undefined>;
  quizFeedback: { correct: boolean } | null;
  reducedMotion: boolean;
  /** The device turned out to be slow while running: render less from now on. */
  lowPower: boolean;
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
  answerChoice: (optionIndex: number) => void;
  retryQuiz: () => void;
  nextQuestion: () => void;
  setReducedMotion: (v: boolean) => void;
  setLowPower: () => void;
  setStageReady: (v: boolean) => void;
  setWebgl: (v: 'ok' | 'failed') => void;
  markInteracted: () => void;
  resetCamera: () => void;
  setHistoryNote: (id: string | null) => void;
  setDisplayWorld: (w: World) => void;
  setWorldReady: (w: World) => void;
}


export const useStory = create<State>((set, get) => ({
  stop: 0,
  sourcesOpen: false,
  sourceFocus: null,
  glossaryOpen: false,
  term: null,
  hoveredOrgan: null,
  quizIndex: 0,
  quizAnswers: {},
  quizFeedback: null,
  reducedMotion: false,
  lowPower: false,
  stageReady: false,
  webgl: 'unknown',
  interacted: false,
  cameraResetNonce: 0,
  historyNote: null,
  displayWorld: 'none',
  worldReady: {},

  setStop: (i) => {
    if (i === get().stop) return;
    set({ stop: i, term: null, historyNote: null, quizFeedback: null });
  },
  goToId: (id) => scrollToStop(STOP_INDEX[id]),
  next: () => scrollToStop(nextPause(currentTargetStop())),
  back: () => scrollToStop(prevPause(currentTargetStop())),
  restart: () => {
    set({
      quizIndex: 0,
      quizAnswers: {},
      quizFeedback: null,
      sourcesOpen: false,
      glossaryOpen: false,
      term: null,
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
  answerChoice: (i) => {
    const q = QUESTIONS[get().quizIndex];
    // one try per question, like a real test
    if (!q || get().quizAnswers[q.id]) return;
    const correct = !!q.options[i]?.correct;
    set((s) => ({ quizAnswers: { ...s.quizAnswers, [q.id]: { picked: i, correct } }, quizFeedback: { correct } }));
  },
  retryQuiz: () => set({ quizIndex: 0, quizAnswers: {}, quizFeedback: null }),
  nextQuestion: () => set((s) => ({ quizIndex: Math.min(QUESTIONS.length, s.quizIndex + 1), quizFeedback: null })),
  setReducedMotion: (v) => set({ reducedMotion: v }),
  setLowPower: () => set({ lowPower: true }),
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
  const right = QUESTIONS.filter((q) => answers[q.id]?.correct).length;
  const total = QUESTIONS.length;
  return { right, total, percent: Math.round((right / total) * 100) };
}
