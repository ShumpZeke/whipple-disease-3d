/**
 * Submission details. This is the ONLY file the student needs to edit before submitting.
 * `classPeriod` is shown as written when it says "block" or "period" (e.g. "3rd Block"),
 * otherwise as "Period …" (e.g. "3" → "Period 3"). Empty shows a visible "Period ___".
 */
export const SUBMISSION = {
  studentName: 'Vardhmansinh Rathod',
  course: 'Medical Terminology',
  classPeriod: '3rd Block',
  assignedEponym: '#26 — Whipple’s disease',
} as const;

export function periodLabel(): string {
  const p = SUBMISSION.classPeriod.trim();
  if (!p) return 'Period ___';
  return /period|block/i.test(p) ? p : `Period ${p}`;
}

export function creditLine(): string {
  return `${SUBMISSION.studentName} · ${SUBMISSION.course} · ${periodLabel()}`;
}
