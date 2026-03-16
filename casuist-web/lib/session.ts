const KEYS = {
  START_TIME: 'casuist_start_time',
  SECTIONS_VIEWED: 'casuist_sections_viewed',
  STUDENT_RANKING: 'casuist_student_ranking',
  CORRECT_RANKING: 'casuist_correct_ranking',
  TIME_TAKEN: 'casuist_time_taken',
  CASE_CONTEXT: 'casuist_case_context',
} as const

export interface StoredCaseContext {
  specialty: string
  correct_diagnosis: string
  chief_complaint: string
  history: string | null
  exam: string | null
  labs: string | null
}

export function setStartTime(): void {
  sessionStorage.setItem(KEYS.START_TIME, Date.now().toString())
}

export function getStartTime(): number | null {
  const v = sessionStorage.getItem(KEYS.START_TIME)
  return v ? parseInt(v, 10) : null
}

export function setSectionsViewed(sections: string[]): void {
  sessionStorage.setItem(KEYS.SECTIONS_VIEWED, JSON.stringify(sections))
}

export function getSectionsViewed(): string[] {
  const v = sessionStorage.getItem(KEYS.SECTIONS_VIEWED)
  return v ? JSON.parse(v) : []
}

export function setStudentRanking(ranking: string[]): void {
  sessionStorage.setItem(KEYS.STUDENT_RANKING, JSON.stringify(ranking))
}

export function getStudentRanking(): string[] {
  const v = sessionStorage.getItem(KEYS.STUDENT_RANKING)
  return v ? JSON.parse(v) : []
}

export function setCorrectRanking(ranking: string[]): void {
  sessionStorage.setItem(KEYS.CORRECT_RANKING, JSON.stringify(ranking))
}

export function getCorrectRanking(): string[] {
  const v = sessionStorage.getItem(KEYS.CORRECT_RANKING)
  return v ? JSON.parse(v) : []
}

export function setTimeTaken(seconds: number): void {
  sessionStorage.setItem(KEYS.TIME_TAKEN, seconds.toString())
}

export function getTimeTaken(): number {
  const v = sessionStorage.getItem(KEYS.TIME_TAKEN)
  return v ? parseFloat(v) : 0
}

export function setCaseContext(ctx: StoredCaseContext): void {
  sessionStorage.setItem(KEYS.CASE_CONTEXT, JSON.stringify(ctx))
}

export function getCaseContext(): StoredCaseContext | null {
  const v = sessionStorage.getItem(KEYS.CASE_CONTEXT)
  return v ? JSON.parse(v) : null
}

export function clearSession(): void {
  Object.values(KEYS).forEach((k) => sessionStorage.removeItem(k))
}
