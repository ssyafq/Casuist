export interface MockCase {
  case_id: string
  specialty: string
  chief_complaint: string
  correct_diagnosis: string
  differentials: string[]
  correct_ranking: string[]
}

export const MOCK_CASE: MockCase = {
  case_id: '0042',
  specialty: 'cardiology',
  chief_complaint:
    "I've been having this crushing pain in my chest that radiates to my left arm.",
  correct_diagnosis: 'ST-Elevation Myocardial Infarction (STEMI)',
  differentials: [
    'ST-Elevation Myocardial Infarction (STEMI)',
    'Unstable Angina',
    'Aortic Dissection',
    'Pulmonary Embolism',
    'Pericarditis',
  ],
  correct_ranking: [
    'ST-Elevation Myocardial Infarction (STEMI)',
    'Aortic Dissection',
    'Unstable Angina',
    'Pulmonary Embolism',
    'Pericarditis',
  ],
}
