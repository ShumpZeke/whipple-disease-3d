/**
 * Submission details. This is the ONLY file the student needs to edit before submitting.
 * `classPeriod` is shown as written when it says "block" or "period" (e.g. "3rd Block"),
 * otherwise as "Period …" (e.g. "3" → "Period 3"). Empty shows a visible "Period ___".
 */
export const SUBMISSION = {
  studentName: 'Vardhmansinh Rathod',
  /** The rest of the group, shown after the student's name. */
  groupMembers: ['Eren Robinson', 'Shanya Prezy'],
  course: 'Medical Terminology',
  classPeriod: '3rd Block',
  assignedEponym: '#27, Wilms tumor',
} as const;

export function periodLabel(): string {
  const p = SUBMISSION.classPeriod.trim();
  if (!p) return 'Period ___';
  return /period|block/i.test(p) ? p : `Period ${p}`;
}

/** Everyone in the group, e.g. "Vardhmansinh Rathod, Eren Robinson and Shanya Prezy". */
export function names(): string {
  const all = [SUBMISSION.studentName, ...SUBMISSION.groupMembers].map((n) => n.trim()).filter(Boolean);
  return all.length < 2 ? all.join('') : `${all.slice(0, -1).join(', ')} and ${all[all.length - 1]}`;
}

export function creditLine(): string {
  return `${names()}, ${SUBMISSION.course}, ${periodLabel()}`;
}
