export interface ScoreResult {
  accuracy_score: number
  ranking_score: number
  efficiency_score: number
  speed_score: number
  total: number
  grade: 'A' | 'B' | 'C' | 'D'
}

export function calculateScore(
  correctRanking: string[],
  studentRanking: string[],
  sectionsViewed: string[],
  timeTakenSeconds: number
): ScoreResult {
  // Component 1: Diagnosis Accuracy (40 pts)
  const studentTop = studentRanking[0] || ''
  const correctTop = correctRanking[0] || ''

  let accuracy_score: number
  if (studentTop === correctTop) {
    accuracy_score = 40
  } else if (studentRanking.slice(0, 3).includes(correctTop)) {
    accuracy_score = 15
  } else {
    accuracy_score = 0
  }

  // Component 2: Ranking Quality (30 pts)
  const ptsPerItem = 6
  const n = Math.min(correctRanking.length, studentRanking.length, 5)
  let ranking_score = 0

  for (let i = 0; i < n; i++) {
    const correctDx = correctRanking[i]
    const studentPos = studentRanking.indexOf(correctDx)
    if (studentPos === -1) continue
    const offset = Math.abs(i - studentPos)
    if (offset === 0) ranking_score += ptsPerItem
    else if (offset === 1) ranking_score += 3
  }
  ranking_score = Math.min(ranking_score, 30)

  // Component 3: Information Efficiency (20 pts)
  const nViewed = sectionsViewed.length
  let efficiency_score: number
  if (nViewed === 0) efficiency_score = 5
  else if (nViewed === 1) efficiency_score = 20
  else if (nViewed === 2) efficiency_score = 15
  else efficiency_score = 10

  // Component 4: Speed Bonus (10 pts)
  // 10/10 if under 60s, then -1 per 30s after that, minimum 0
  let speed_score: number
  if (timeTakenSeconds < 60) speed_score = 10
  else speed_score = Math.max(0, 10 - Math.floor((timeTakenSeconds - 60) / 30) - 1)

  const total = accuracy_score + ranking_score + efficiency_score + speed_score
  const grade: ScoreResult['grade'] =
    total >= 90 ? 'A' : total >= 75 ? 'B' : total >= 60 ? 'C' : 'D'

  return { accuracy_score, ranking_score, efficiency_score, speed_score, total, grade }
}
