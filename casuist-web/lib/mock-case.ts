/** Shape of a case returned by the API (all 9 fields). */
export interface CaseData {
  case_id: string
  specialty: string
  chief_complaint: string
  history: string
  exam: string
  labs: string
  correct_diagnosis: string
  differentials: string[]
  correct_ranking: string[]
}

/** API base URL — FastAPI backend at :8000 during development. */
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
