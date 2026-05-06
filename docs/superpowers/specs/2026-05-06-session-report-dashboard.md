# Session Report + Progress Dashboard — Design Spec
**Date:** 2026-05-06
**Phase:** 4
**Status:** Approved

---

## Overview

Two screens that close the loop after Phase 2+3: a full session report (replaces the Phase 4 stub at `/app/session/[id]/report`) and a progress dashboard (replaces the placeholder at `/app/dashboard`). No new API routes — all data is fetched server-side in the page Server Components.

---

## Routes

```
/app/dashboard                  ← Progress dashboard (session list + stats)
/app/session/[id]/report        ← Full session report (replaces stub)
```

Both routes are under `/app/*` — protected by existing `proxy.ts`.

---

## Shared Score Utilities — `src/lib/scores.ts`

Create this module (server-safe, no `'use client'`). Used by both pages.

```typescript
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

// Returns a Tailwind text color class
export function scoreColor(score: number): string {
  if (score >= 8) return 'text-green-600'
  if (score >= 5) return 'text-amber-600'
  return 'text-red-600'
}
```

---

## Session Report — `/app/session/[id]/report`

### Data Loading (Server Component)

```typescript
// Fetch session — verify ownership
const { data: session } = await supabase
  .from('sessions')
  .select('id, role, level, interview_type, jd_text, created_at')
  .eq('id', id)
  .eq('user_id', user.id)
  .single()

if (!session) redirect('/app/dashboard')

// Fetch questions ordered by index
const { data: questions } = await supabase
  .from('questions')
  .select('id, text, category, order_index')
  .eq('session_id', id)
  .order('order_index')

// Fetch answers for this session's questions
const questionIds = (questions ?? []).map(q => q.id)
const { data: answers } = await supabase
  .from('answers')
  .select('question_id, answer_text, score, feedback_json')
  .eq('user_id', user.id)
  .in('question_id', questionIds)
```

Build a `Map<questionId, answer>` in JS, then join questions + answers for rendering.

### Score Calculation

- **Per-category average:** `computeAverage()` on all non-null scores for questions with that category.
- **Overall average:** `computeAverage()` on all 10 answer scores (null if no answers have scores).
- Categories shown: Technical, Behavioral, System Design, Communication. If a session has no questions in a category, omit that card (don't show "—" for a category that didn't appear).

### UI Layout

**1. Header row** (flex, space-between)
- Left: "Session Report" (h1, bold) + role · level · type · formatted date below (small, gray)
- Right: "← Back to Dashboard" link → `/app/dashboard`

**2. Overall score card**
- Gradient: `bg-gradient-to-r from-[#1E40AF] to-[#3B82F6]`
- Large score number `/10` — if null show `—`
- Label below: `scoreLabel(overall)` — if null show "Score unavailable"
- Sub-label: "{answeredCount} of 10 questions answered" where `answeredCount = answers.length`

**3. Category cards** (2×2 grid)
- White card, border, center-aligned
- Category name (small, uppercase, gray)
- Score number (large, `#1E40AF`) — if null show `—`
- Score label below (`scoreLabel`) in `scoreColor` — if null omit label

**4. "Question Breakdown" section heading**

**5. `<ReportAccordion>` client component** — receives array of `{ question, answer | null }` items

### ReportAccordion — `src/components/session/report-accordion.tsx`

`'use client'` — manages `expandedIndex: number | null` state (only one question expanded at a time).

**Collapsed row** (each question):
- Left: category pill (small gray badge) + question text (truncated to 1 line)
- Right: score in `scoreColor` — if null show `—` in gray; chevron `▾` / `▴`
- Click → expand/collapse (toggle same index closes it)

**Expanded row** (below the collapsed header):
- **"Your Answer"** label + answer text in a gray box
- If `answer === null`: show "Not answered" in gray
- If `answer.score !== null && answer.feedback_json !== null`:
  - Green card: `✓ WHAT YOU GOT RIGHT` + bullet list from `correct_points[]`
  - Red card: `✗ WHAT WAS MISSING` + bullet list from `missing_points[]`
  - Blue card: `💡 IMPROVE` + `improve_tip` text
- If `answer.score === null` (feedback unavailable):
  - Amber box: "Feedback unavailable for this question."

### Error States

| Scenario | Behaviour |
|----------|-----------|
| Session not found / wrong user | Redirect to `/app/dashboard` |
| No questions in a category | Omit that category card |
| Answer score null | Show `—`, amber "Feedback unavailable" in expanded view |
| No answers at all | All scores `—`, accordion shows "Not answered" for each |

---

## Progress Dashboard — `/app/dashboard`

### Data Loading (Server Component)

Three queries total — no N+1:

```typescript
// 1. Fetch all sessions for the user, newest first
const { data: sessions } = await supabase
  .from('sessions')
  .select('id, role, level, interview_type, created_at')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })

const sessionList = sessions ?? []
const sessionIds = sessionList.map(s => s.id)

// 2. Fetch all questions for those sessions in one query
const { data: allQuestions } = await supabase
  .from('questions')
  .select('id, session_id')
  .in('session_id', sessionIds)

// Build map: sessionId → questionIds[]
const questionsBySession = new Map<string, string[]>()
for (const q of allQuestions ?? []) {
  const list = questionsBySession.get(q.session_id) ?? []
  list.push(q.id)
  questionsBySession.set(q.session_id, list)
}

const allQuestionIds = (allQuestions ?? []).map(q => q.id)

// 3. Fetch all answers for all those questions in one query
const { data: allAnswers } = await supabase
  .from('answers')
  .select('question_id, score')
  .eq('user_id', user.id)
  .in('question_id', allQuestionIds)

// Build map: questionId → score
const scoreByQuestion = new Map<string, number | null>()
for (const a of allAnswers ?? []) {
  scoreByQuestion.set(a.question_id, a.score)
}

// Compute overall score per session
const sessionsWithScore = sessionList.map(s => {
  const qIds = questionsBySession.get(s.id) ?? []
  const scores = qIds.map(qId => scoreByQuestion.get(qId) ?? null)
  return { ...s, overallScore: computeAverage(scores) }
})
```

### Stats Calculation

From the `overallScore` values across all sessions:
- **Total sessions:** `sessions.length`
- **Avg score:** `computeAverage(sessions.map(s => s.overallScore))`
- **Best score:** `Math.max(...sessionsWithScore.map(s => s.overallScore).filter((s): s is number => s !== null))` — null if array is empty

### UI Layout — With Sessions

**1. Header row**
- Left: "Welcome back, {name}" (h1)
- Right: "+ New Session" button → `/app/session/setup`

**2. 3 stat cards** (3-column grid)
- Sessions count (integer, always shown)
- Avg Score (1 decimal, `—` if null)
- Best Score (1 decimal, `—` if null)

**3. "Recent Sessions" heading**

**4. Session list** (single white card, border, stacked rows with dividers)

Each row:
- Left: role (bold, dark) + level · type · formatted date (small, gray below)
- Right: score + label in `scoreColor` (if null: `—` gray) + `›` chevron
- Full row is a `<Link href="/app/session/{id}/report">` — hover: light blue background

### UI Layout — Empty State (0 sessions)

**1. Header row** (same as above — name + "+ New Session" button)

**2. Empty state card** (white, border, rounded, center-aligned, generous padding)
- 🎯 icon (large)
- "Ready for your first interview?" (h2, bold)
- "Pick a role, answer 10 tailored questions, and get instant AI feedback." (gray)
- "Start Your First Interview →" button → `/app/session/setup` (primary blue)

### Date Formatting

Use `Intl.DateTimeFormat` — no date library needed:
```typescript
new Intl.DateTimeFormat('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(session.created_at))
// → "6 May 2026"
```

---

## File Map

**New files:**
```
src/lib/scores.ts
src/components/session/report-accordion.tsx
```

**Modified files:**
```
src/app/app/dashboard/page.tsx          ← replace stub with full implementation
src/app/app/session/[id]/report/page.tsx ← replace stub with full implementation
```

---

## Components

```
src/lib/scores.ts                        ← computeAverage, scoreLabel, scoreColor
src/app/app/dashboard/page.tsx           ← Server Component, fetches sessions + scores
src/app/app/session/[id]/report/page.tsx ← Server Component, fetches session + Q&A data
src/components/session/report-accordion.tsx ← 'use client', expand/collapse Q&A list
```

No new API routes. No new DB tables.

---

## Error States Summary

| Scenario | Behaviour |
|----------|-----------|
| Session not found or wrong owner | Redirect to `/app/dashboard` |
| Session has 0 answers | All `—` scores, accordion shows "Not answered" |
| Some answers have null score | Skip nulls in average, show `—` per question |
| All answers null score | Overall `—`, all category cards show `—` |
| User has 0 sessions | Empty state (🎯 CTA) |
| DB fetch error | Next.js error boundary (no custom handling in Phase 4) |
