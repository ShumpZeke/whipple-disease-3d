/**
 * Submission details. This is the ONLY file the student needs to edit before submitting.
 * Set `classPeriod` to your class period (for example "3" or "Period 3").
 * While it is empty, the exhibit shows a visible "Period ___" placeholder.
 */
export const SUBMISSION = {
  studentName: 'Vardhmansinh Rathod',
  course: 'Medical Terminology',
  classPeriod: '',
  assignedEponym: '#26 — Whipple’s disease',
} as const;

export function periodLabel(): string {
  const p = SUBMISSION.classPeriod.trim();
  if (!p) return 'Period ___';
  return /^period/i.test(p) ? p : `Period ${p}`;
}

export function creditLine(): string {
  return `${SUBMISSION.studentName} · ${SUBMISSION.course} · ${periodLabel()}`;
}
