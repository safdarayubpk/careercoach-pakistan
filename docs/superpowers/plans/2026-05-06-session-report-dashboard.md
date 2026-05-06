# Session Report + Progress Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Phase 4 stub pages with a full session report (score + Q&A replay) and a progress dashboard (stats + session history).

**Architecture:** Two Server Component pages fetch all data from Supabase using the existing `createClient()` from `@/lib/supabase/server`. Score math lives in a shared `src/lib/scores.ts` utility. One Client Component (`ReportAccordion`) handles expand/collapse in the report. No new API routes, no new DB tables.

**Tech Stack:** Next.js 16 App Router, TypeScript, Supabase (`@supabase/ssr`), Tailwind CSS 4.

---

## File Map

**New files:**
```
src/lib/scores.ts                            ← computeAverage, scoreLabel, scoreColor
src/components/session/report-accordion.tsx  ← 'use client' expand/collapse Q&A list
```

**Modified files:**
```
src/app/app/session/[id]/report/page.tsx     ← replace stub with full implementation
src/app/app/dashboard/page.tsx               ← replace stub with full implementation
```

---

## Task 1: Shared score utilities

**Files:**
- Create: `src/lib/scores.ts`

- [ ] **Step 1: Create `src/lib/scores.ts`**

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

/** Returns a full Tailwind text-color class string. */
export function scoreColor(score: number): string {
  if (score >= 8) return 'text-green-600'
  if (score >= 5) return 'text-amber-600'
  return 'text-red-600'
}
```

- [ ] **Step 2: Type-check**

```bash
cd "/home/safdarayub/Desktop/software house projects_3/careercoach-pakistan"
pnpm type-check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/scores.ts
git commit -m "feat: add shared score utilities (computeAverage, scoreLabel, scoreColor)"
```

---

## Task 2: ReportAccordion client component

**Files:**
- Create: `src/components/session/report-accordion.tsx`

Context: This component receives a pre-joined array from the server page. One question is expanded at a time. `feedback_json` is typed locally — do not import from another file.

- [ ] **Step 1: Create `src/components/session/report-accordion.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { scoreLabel, scoreColor } from '@/lib/scores'

interface FeedbackJson {
  score: number
  correct_points: string[]
  missing_points: string[]
  improve_tip: string
  model_answer: string
}

interface Question {
  id: string
  text: string
  category: string
  order_index: number
}

interface Answer {
  question_id: string
  answer_text: string
  score: number | null
  feedback_json: unknown
}

interface QuestionWithAnswer {
  question: Question
  answer: Answer | null
}

interface Props {
  items: QuestionWithAnswer[]
}

export default function ReportAccordion({ items }: Props) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  function toggle(index: number) {
    setExpandedIndex(prev => (prev === index ? null : index))
  }

  return (
    <div className="space-y-2">
      {items.map((item, index) => {
        const { question, answer } = item
        const isExpanded = expandedIndex === index
        const score = answer?.score ?? null
        const scoreClass = score !== null ? scoreColor(score) : 'text-gray-400'

        return (
          <div
            key={question.id}
            className="overflow-hidden rounded-lg border border-gray-200 bg-white"
          >
            {/* Collapsed header — always visible */}
            <button
              onClick={() => toggle(index)}
              className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-gray-50"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="shrink-0 rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                  {question.category}
                </span>
                <span className="truncate text-sm text-gray-800">{question.text}</span>
              </div>
              <div className="ml-4 flex shrink-0 items-center gap-2">
                <span className={`text-sm font-semibold ${scoreClass}`}>
                  {score !== null ? `${score}/10` : '—'}
                </span>
                <span className="text-gray-400 text-xs">{isExpanded ? '▴' : '▾'}</span>
              </div>
            </button>

            {/* Expanded body */}
            {isExpanded && (
              <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-3">
                {/* Your Answer */}
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Your Answer
                  </p>
                  {answer ? (
                    <p className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-700">
                      {answer.answer_text}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400 italic">Not answered</p>
                  )}
                </div>

                {/* Feedback */}
                {answer && answer.score === null && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    Feedback unavailable for this question.
                  </div>
                )}

                {answer && answer.feedback_json !== null && (() => {
                  const fb = answer.feedback_json as FeedbackJson
                  return (
                    <>
                      {fb.correct_points.length > 0 && (
                        <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                          <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-green-700">
                            ✓ What you got right
                          </p>
                          <ul className="space-y-1">
                            {fb.correct_points.map((pt, i) => (
                              <li key={i} className="text-sm text-green-800">• {pt}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {fb.missing_points.length > 0 && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                          <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-red-700">
                            ✗ What was missing
                          </p>
                          <ul className="space-y-1">
                            {fb.missing_points.map((pt, i) => (
                              <li key={i} className="text-sm text-red-800">• {pt}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                        <p className="mb-1 text-xs font-bold uppercase tracking-wide text-blue-700">
                          💡 Improve
                        </p>
                        <p className="text-sm text-blue-800">{fb.improve_tip}</p>
                      </div>
                    </>
                  )
                })()}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm type-check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/session/report-accordion.tsx
git commit -m "feat: add ReportAccordion with expand/collapse Q&A and feedback display"
```

---

## Task 3: Session report page

**Files:**
- Modify: `src/app/app/session/[id]/report/page.tsx` (replace stub entirely)

Context: Server Component. Fetches session + questions + answers. Computes per-category and overall averages using `src/lib/scores.ts`. Passes joined data to `<ReportAccordion>`. Pattern: `params` is a `Promise<{ id: string }>` — must be awaited (Next.js 16).

- [ ] **Step 1: Replace `src/app/app/session/[id]/report/page.tsx`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { computeAverage, scoreLabel, scoreColor } from '@/lib/scores'
import ReportAccordion from '@/components/session/report-accordion'
import { VALID_CATEGORIES } from '@/types/session'

interface Props {
  params: Promise<{ id: string }>
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso))
}

export default async function ReportPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/app/dashboard')

  // Fetch session — verify ownership
  const { data: session } = await supabase
    .from('sessions')
    .select('id, role, level, interview_type, created_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!session) redirect('/app/dashboard')

  // Fetch questions ordered by index
  const { data: questionsData } = await supabase
    .from('questions')
    .select('id, text, category, order_index')
    .eq('session_id', id)
    .order('order_index')

  const questions = questionsData ?? []
  const questionIds = questions.map(q => q.id)

  // Fetch answers for this session's questions
  const { data: answersData } = await supabase
    .from('answers')
    .select('question_id, answer_text, score, feedback_json')
    .eq('user_id', user.id)
    .in('question_id', questionIds.length > 0 ? questionIds : ['00000000-0000-0000-0000-000000000000'])

  const answers = answersData ?? []

  // Build map: questionId → answer
  const answerByQuestion = new Map(answers.map(a => [a.question_id, a]))

  // Join questions with answers
  const items = questions.map(q => ({
    question: q,
    answer: answerByQuestion.get(q.id) ?? null,
  }))

  const answeredCount = answers.length

  // Overall score
  const allScores = answers.map(a => a.score)
  const overallScore = computeAverage(allScores)

  // Per-category scores — only show categories that appear in this session
  const categoryScores = VALID_CATEGORIES.map(cat => {
    const catAnswers = items
      .filter(it => it.question.category === cat)
      .map(it => it.answer?.score ?? null)
    if (catAnswers.length === 0) return null // category not in this session
    return { category: cat, score: computeAverage(catAnswers) }
  }).filter((c): c is { category: string; score: number | null } => c !== null)

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Session Report</h1>
          <p className="mt-1 text-sm text-gray-500">
            {session.role} · {session.level} · {session.interview_type} · {formatDate(session.created_at)}
          </p>
        </div>
        <Link
          href="/app/dashboard"
          className="shrink-0 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Overall score card */}
      <div className="mb-6 rounded-xl bg-gradient-to-r from-[#1E40AF] to-[#3B82F6] p-6 text-center text-white">
        <div className="text-5xl font-bold leading-none">
          {overallScore !== null ? overallScore : '—'}
          {overallScore !== null && <span className="text-2xl opacity-60">/10</span>}
        </div>
        <div className="mt-2 text-sm opacity-90">
          {overallScore !== null ? scoreLabel(overallScore) : 'Score unavailable'}
        </div>
        <div className="mt-1 text-xs opacity-70">
          {answeredCount} of 10 questions answered
        </div>
      </div>

      {/* Category cards */}
      {categoryScores.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-3">
          {categoryScores.map(({ category, score }) => (
            <div
              key={category}
              className="rounded-lg border border-gray-200 bg-white p-4 text-center"
            >
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                {category}
              </p>
              <p className="text-3xl font-bold text-[#1E40AF]">
                {score !== null ? score : '—'}
              </p>
              {score !== null && (
                <p className={`mt-1 text-xs font-medium ${scoreColor(score)}`}>
                  {scoreLabel(score)}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Q&A Replay */}
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500">
        Question Breakdown
      </h2>
      <ReportAccordion items={items} />
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm type-check
```

Expected: no errors.

- [ ] **Step 3: Verify in browser**

Start dev server if not running: `pnpm dev`

Complete a session (or navigate directly to `/app/session/{id}/report` for a session you finished). Confirm:
- Overall score card shows gradient + score
- Category cards appear (only categories that appeared in that session)
- Q&A list shows 10 rows, click expands with feedback
- "← Back to Dashboard" returns to dashboard

- [ ] **Step 4: Commit**

```bash
git add src/app/app/session/[id]/report/page.tsx
git commit -m "feat: implement full session report — score card, category breakdown, Q&A accordion"
```

---

## Task 4: Progress dashboard page

**Files:**
- Modify: `src/app/app/dashboard/page.tsx` (replace current stub)

Context: Server Component. Three Supabase queries (no N+1). Renders stat cards + session list when sessions exist; renders empty-state CTA when no sessions. Each session row links to its report.

- [ ] **Step 1: Replace `src/app/app/dashboard/page.tsx`**

```typescript
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { computeAverage, scoreLabel, scoreColor } from '@/lib/scores'

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso))
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const name: string = user?.user_metadata?.full_name || user?.email || 'there'

  // 1. Fetch all sessions newest-first
  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, role, level, interview_type, created_at')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  const sessionList = sessions ?? []
  const sessionIds = sessionList.map(s => s.id)

  let sessionsWithScore: Array<{
    id: string
    role: string
    level: string
    interview_type: string
    created_at: string
    overallScore: number | null
  }> = []

  if (sessionIds.length > 0) {
    // 2. Fetch all questions for those sessions
    const { data: allQuestions } = await supabase
      .from('questions')
      .select('id, session_id')
      .in('session_id', sessionIds)

    const questionsBySession = new Map<string, string[]>()
    for (const q of allQuestions ?? []) {
      const list = questionsBySession.get(q.session_id) ?? []
      list.push(q.id)
      questionsBySession.set(q.session_id, list)
    }

    const allQuestionIds = (allQuestions ?? []).map(q => q.id)

    // 3. Fetch all answers for those questions
    const { data: allAnswers } = await supabase
      .from('answers')
      .select('question_id, score')
      .eq('user_id', user!.id)
      .in('question_id', allQuestionIds.length > 0 ? allQuestionIds : ['00000000-0000-0000-0000-000000000000'])

    const scoreByQuestion = new Map<string, number | null>()
    for (const a of allAnswers ?? []) {
      scoreByQuestion.set(a.question_id, a.score)
    }

    sessionsWithScore = sessionList.map(s => {
      const qIds = questionsBySession.get(s.id) ?? []
      const scores = qIds.map(qId => scoreByQuestion.get(qId) ?? null)
      return { ...s, overallScore: computeAverage(scores) }
    })
  }

  // Stats
  const totalSessions = sessionsWithScore.length
  const avgScore = computeAverage(sessionsWithScore.map(s => s.overallScore))
  const validScores = sessionsWithScore.map(s => s.overallScore).filter((s): s is number => s !== null)
  const bestScore = validScores.length > 0 ? Math.max(...validScores) : null

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {name}</h1>
        <Link
          href="/app/session/setup"
          className="rounded-md bg-[#1E40AF] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
        >
          + New Session
        </Link>
      </div>

      {totalSessions === 0 ? (
        /* Empty state */
        <div className="rounded-xl border border-gray-200 bg-white px-8 py-16 text-center">
          <div className="mb-4 text-5xl">🎯</div>
          <h2 className="mb-2 text-lg font-bold text-gray-900">Ready for your first interview?</h2>
          <p className="mb-6 text-sm text-gray-500">
            Pick a role, answer 10 tailored questions, and get instant AI feedback.
          </p>
          <Link
            href="/app/session/setup"
            className="inline-block rounded-md bg-[#1E40AF] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
          >
            Start Your First Interview →
          </Link>
        </div>
      ) : (
        <>
          {/* 3 stat cards */}
          <div className="mb-6 grid grid-cols-3 gap-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
              <p className="text-3xl font-bold text-[#1E40AF]">{totalSessions}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Sessions</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
              <p className="text-3xl font-bold text-[#1E40AF]">
                {avgScore !== null ? avgScore : '—'}
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Avg Score</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
              <p className="text-3xl font-bold text-[#1E40AF]">
                {bestScore !== null ? bestScore : '—'}
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Best Score</p>
            </div>
          </div>

          {/* Session list */}
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500">
            Recent Sessions
          </h2>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            {sessionsWithScore.map((session, index) => {
              const score = session.overallScore
              const scoreClass = score !== null ? scoreColor(score) : 'text-gray-400'
              const isLast = index === sessionsWithScore.length - 1

              return (
                <Link
                  key={session.id}
                  href={`/app/session/${session.id}/report`}
                  className={`flex items-center justify-between px-5 py-4 transition-colors hover:bg-blue-50 ${
                    !isLast ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{session.role}</p>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {session.level} · {session.interview_type} · {formatDate(session.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className={`text-base font-bold ${scoreClass}`}>
                        {score !== null ? `${score}/10` : '—'}
                      </p>
                      {score !== null && (
                        <p className={`text-xs ${scoreClass}`}>{scoreLabel(score)}</p>
                      )}
                    </div>
                    <span className="text-gray-300">›</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm type-check
```

Expected: no errors.

- [ ] **Step 3: Verify in browser**

Visit `http://localhost:3000/app/dashboard`. Confirm:
- With sessions: 3 stat cards show correct numbers, session rows list with scores, click row → report page
- Without sessions (test by logging in as a new user or checking empty state logic): 🎯 empty state with "Start Your First Interview →" button
- "+ New Session" button in header works

- [ ] **Step 4: Commit**

```bash
git add src/app/app/dashboard/page.tsx
git commit -m "feat: implement progress dashboard — stat cards, session list, empty state"
```

---

## Task 5: End-to-end smoke test

No code changes — manual walkthrough.

- [ ] **Step 1: Full session → report flow**

1. Sign in → dashboard → "+ New Session"
2. Pick any role + level + interview type → submit
3. Answer all 10 questions → after question 10 click "See Results →"
4. Confirm report page loads with:
   - Correct gradient score card (not stub "Session Complete!" text)
   - Category cards matching categories from that session
   - 10 rows in the accordion — click any row to expand and see full feedback

- [ ] **Step 2: Dashboard stats**

1. Return to dashboard
2. Confirm "Sessions" count incremented
3. Confirm "Avg Score" and "Best Score" reflect the session you just completed
4. Confirm session row appears at top of list with correct role, score, date
5. Click session row → confirms it links to the correct report

- [ ] **Step 3: Empty state**

Sign in with a brand-new Google account (no sessions). Confirm dashboard shows 🎯 empty state with "Start Your First Interview →" button (not broken stat cards).

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete Phase 4 — session report and progress dashboard"
```
