export function computeAverage(scores: (number | null)[]): number | null {
  const valid = scores.filter((s): s is number => s !== null)
  if (valid.length === 0) return null
  return Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10
}

export function scoreLabel(score: number): string {
  if (score >= 8) return 'Strong Answer'
  if (score >= 5) return 'Good Attempt'
  return 'Needs Work'
}

/** Returns a full Tailwind text-color class string. */
export function scoreColor(score: number): string {
  if (score >= 8) return 'text-green-600'
  if (score >= 5) return 'text-amber-600'
  return 'text-red-600'
}
