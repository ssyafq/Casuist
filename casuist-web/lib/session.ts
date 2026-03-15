const KEYS = {
  START_TIME: 'casuist_start_time',
  SECTIONS_VIEWED: 'casuist_sections_viewed',
  STUDENT_RANKING: 'casuist_student_ranking',
  TIME_TAKEN: 'casuist_time_taken',
} as const

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

export function setTimeTaken(seconds: number): void {
  sessionStorage.setItem(KEYS.TIME_TAKEN, seconds.toString())
}

export function getTimeTaken(): number {
  const v = sessionStorage.getItem(KEYS.TIME_TAKEN)
  return v ? parseFloat(v) : 0
}

export function clearSession(): void {
  Object.values(KEYS).forEach((k) => sessionStorage.removeItem(k))
}
