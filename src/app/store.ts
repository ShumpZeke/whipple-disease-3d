import { create } from 'zustand';
import { QUESTIONS } from '../content/quiz';
import { STEPS, STEP_INDEX, type StepId, type World } from '../content/story';
import type { OrganId } from '../three/anatomy/organs';

export interface TermAnchor {
  key: string;
  /** Viewport rect of the element that opened the popover. */
  rect: { left: number; top: number; width: number; height: number };
}

/** firstTry: was the first attempt right? solved: has the right answer been found? */
export type QuizAnswer = { firstTry: boolean; solved: boolean };

interface State {
  step: number;
  sub: number;
  /** +1 when moving forward, -1 backward (for transition direction). */
  direction: 1 | -1;
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
  /** World currently drawn by the canvas (lags the step's world during a veil transition). */
  displayWorld: World;
  veil: boolean;
  /** Worlds whose shaders have finished compiling (KHR_parallel_shader_compile). */
  worldReady: Partial<Record<World, boolean>>;

  next: () => void;
  back: () => void;
  goTo: (step: number, sub?: number) => void;
  goToId: (id: StepId, sub?: number) => void;
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
  setVeil: (v: boolean) => void;
  setWorldReady: (w: World) => void;
}

const lastStep = STEPS.length - 1;

function record(prev: QuizAnswer | undefined, correct: boolean): QuizAnswer {
  if (!prev) return { firstTry: correct, solved: correct };
  return { firstTry: prev.firstTry, solved: prev.solved || correct };
}
const subCount = (i: number) => STEPS[i].captions.length;

export const useStory = create<State>((set, get) => ({
  step: 0,
  sub: 0,
  direction: 1,
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
  veil: false,
  worldReady: {},

  next: () => {
    const { step, sub } = get();
    if (sub < subCount(step) - 1) {
      set({ sub: sub + 1, direction: 1, term: null, historyNote: null });
    } else if (step < lastStep) {
      set({ step: step + 1, sub: 0, direction: 1, term: null, historyNote: null, quizFeedback: null });
    }
  },
  back: () => {
    const { step, sub } = get();
    if (sub > 0) {
      set({ sub: sub - 1, direction: -1, term: null, historyNote: null });
    } else if (step > 0) {
      set({ step: step - 1, sub: subCount(step - 1) - 1, direction: -1, term: null, historyNote: null, quizFeedback: null });
    }
  },
  goTo: (step, sub = 0) => {
    const s = Math.max(0, Math.min(lastStep, step));
    const cur = get().step;
    set({
      step: s,
      sub: Math.max(0, Math.min(subCount(s) - 1, sub)),
      direction: s >= cur ? 1 : -1,
      term: null,
      historyNote: null,
      quizFeedback: null,
    });
  },
  goToId: (id, sub = 0) => get().goTo(STEP_INDEX[id], sub),
  restart: () =>
    set({
      step: 0,
      sub: 0,
      direction: -1,
      quizIndex: 0,
      quizAnswers: {},
      quizFeedback: null,
      sourcesOpen: false,
      glossaryOpen: false,
      term: null,
      mechanism: 'disease',
      historyNote: null,
    }),
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
  setVeil: (v) => set({ veil: v }),
  setWorldReady: (w) => set((s) => ({ worldReady: { ...s.worldReady, [w]: true } })),
}));

export const currentStep = () => STEPS[useStory.getState().step];

export function quizScore(answers: State['quizAnswers']) {
  let firstTry = 0;
  let solved = 0;
  for (const q of QUESTIONS) {
    if (answers[q.id]?.firstTry) firstTry++;
    if (answers[q.id]?.solved) solved++;
  }
  return { firstTry, solved, total: QUESTIONS.length };
}
