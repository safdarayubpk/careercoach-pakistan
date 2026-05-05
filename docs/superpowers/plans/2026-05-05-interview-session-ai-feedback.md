# Interview Session + AI Feedback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full end-to-end interview session flow — setup form → Groq-generated questions → answer input → AI feedback — covering Phases 2 and 3.

**Architecture:** Three Next.js App Router pages under `/app/session/*`, two API routes (`/api/session`, `/api/feedback`), and a set of focused Client Components. The question page is a Server Component that fetches current state from Supabase; a `SessionPlayer` Client Component owns the question/feedback state toggle. All Groq calls are server-side only.

**Tech Stack:** Next.js 16 App Router, TypeScript, Supabase (`@supabase/ssr`), Groq SDK (`groq-sdk`), Tailwind CSS 4, Web Speech API (voice input).

---

## File Map

**New files:**
```
src/lib/groq.ts
src/app/api/session/route.ts
src/app/api/feedback/route.ts
src/app/app/session/setup/page.tsx
src/app/app/session/[id]/question/page.tsx
src/app/app/session/[id]/report/page.tsx
src/components/session/level-selector.tsx
src/components/session/interview-type-selector.tsx
src/components/session/role-autocomplete.tsx
src/components/session/setup-form.tsx
src/components/session/question-card.tsx
src/components/session/session-player.tsx
src/components/session/answer-form.tsx
src/components/session/feedback-view.tsx
```

**Modified files:**
```
src/app/app/dashboard/page.tsx     ← add Start Interview button
src/components/layout/app-nav.tsx  ← enable Sessions link
```

---

## Task 1: Install groq-sdk + create Groq client module

**Files:**
- Create: `src/lib/groq.ts`

- [ ] **Step 1: Add GROQ_API_KEY to .env.local**

Open `.env.local`. If `GROQ_API_KEY` is not already there, add it:
```
GROQ_API_KEY=your_groq_api_key_here
```
Get the key from https://console.groq.com — sign in, go to API Keys, create one.

- [ ] **Step 2: Install groq-sdk**

```bash
cd "/home/safdarayub/Desktop/software house projects_3/careercoach-pakistan"
pnpm add groq-sdk
```

Expected output includes `+ groq-sdk X.X.X`.

- [ ] **Step 3: Create the Groq client module**

Create `src/lib/groq.ts`:
```typescript
import Groq from 'groq-sdk'

export const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
```

- [ ] **Step 4: Type check**

```bash
pnpm type-check
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/groq.ts pnpm-lock.yaml package.json
git commit -m "feat: install groq-sdk and add Groq client module"
```

---

## Task 2: Create DB tables in Supabase

**Files:**
- Create: `supabase/schema.sql` (reference only — run in Supabase dashboard)

- [ ] **Step 1: Create the SQL file**

Create `supabase/schema.sql`:
```sql
-- Sessions
create table sessions (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users(id) on delete cascade not null,
  role           text not null,
  level          text not null check (level in ('Junior', 'Mid', 'Senior')),
  interview_type text not null check (interview_type in ('Technical', 'Behavioral', 'Mixed')),
  jd_text        text,
  created_at     timestamptz default now()
);

alter table sessions enable row level security;
create policy "Users can CRUD own sessions"
  on sessions for all using (auth.uid() = user_id);

-- Questions
create table questions (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid references sessions(id) on delete cascade not null,
  text        text not null,
  category    text not null check (category in ('Technical', 'Behavioral', 'System Design', 'Communication')),
  order_index integer not null
);

alter table questions enable row level security;
create policy "Users can read own session questions"
  on questions for select using (
    exists (select 1 from sessions where sessions.id = questions.session_id and sessions.user_id = auth.uid())
  );
create policy "Users can insert questions into own sessions"
  on questions for insert with check (
    exists (select 1 from sessions where sessions.id = session_id and sessions.user_id = auth.uid())
  );

-- Answers
create table answers (
  id            uuid primary key default gen_random_uuid(),
  question_id   uuid references questions(id) on delete cascade not null,
  user_id       uuid references auth.users(id) on delete cascade not null,
  answer_text   text not null,
  score         integer check (score between 1 and 10),
  feedback_json jsonb,
  created_at    timestamptz default now()
);

alter table answers enable row level security;
create policy "Users can CRUD own answers"
  on answers for all using (auth.uid() = user_id);
```

- [ ] **Step 2: Run in Supabase dashboard**

1. Go to https://supabase.com → your project → SQL Editor
2. Paste the full contents of `supabase/schema.sql`
3. Click **Run**
4. Expected: "Success. No rows returned."

- [ ] **Step 3: Verify tables exist**

In Supabase → Table Editor, confirm `sessions`, `questions`, `answers` all appear.

- [ ] **Step 4: Commit**

```bash
git add supabase/schema.sql
git commit -m "feat: add sessions, questions, answers tables with RLS"
```

---

## Task 3: POST /api/session route

**Files:**
- Create: `src/app/api/session/route.ts`

- [ ] **Step 1: Create the route**

Create `src/app/api/session/route.ts`:
```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { groq } from '@/lib/groq'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { role, level, interviewType, jdText } = body

    // Server-side validation
    if (!role?.trim() || !level || !interviewType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    const validLevels = ['Junior', 'Mid', 'Senior']
    const validTypes = ['Technical', 'Behavioral', 'Mixed']
    if (!validLevels.includes(level) || !validTypes.includes(interviewType)) {
      return NextResponse.json({ error: 'Invalid level or interview type' }, { status: 400 })
    }

    // Get authenticated user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Generate questions with Groq
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content:
            'You are a senior interviewer. Generate exactly 10 interview questions for the role and level given. Return JSON: { "questions": [{ "text": "...", "category": "...", "order_index": 0 }] }. order_index must be 0–9. Categories must be: Technical, Behavioral, System Design, or Communication. Mix categories to match the interview type. Questions must be specific, not generic.',
        },
        {
          role: 'user',
          content: `Role: ${role}\nLevel: ${level}\nInterview Type: ${interviewType}\nJob Description: ${jdText || 'Not provided'}`,
        },
      ],
      response_format: { type: 'json_object' },
    })

    const content = completion.choices[0]?.message?.content
    if (!content) throw new Error('Empty Groq response')

    const parsed = JSON.parse(content)
    const questions: Array<{ text: string; category: string; order_index: number }> =
      parsed.questions
    if (!Array.isArray(questions) || questions.length !== 10) {
      throw new Error('Invalid questions format from Groq')
    }

    // Insert session
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        user_id: user.id,
        role: role.trim(),
        level,
        interview_type: interviewType,
        jd_text: jdText || null,
      })
      .select('id')
      .single()

    if (sessionError || !session) throw new Error('Failed to create session')

    // Insert questions
    const { error: questionsError } = await supabase.from('questions').insert(
      questions.map(q => ({
        session_id: session.id,
        text: q.text,
        category: q.category,
        order_index: q.order_index,
      }))
    )

    if (questionsError) throw new Error('Failed to insert questions')

    return NextResponse.json({ sessionId: session.id })
  } catch (error) {
    console.error('[POST /api/session]', error)
    return NextResponse.json({ error: 'Failed to generate session' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Type check**

```bash
pnpm type-check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/session/route.ts
git commit -m "feat: add POST /api/session — creates session and generates questions via Groq"
```

---

## Task 4: Level selector + Interview type selector components

**Files:**
- Create: `src/components/session/level-selector.tsx`
- Create: `src/components/session/interview-type-selector.tsx`

- [ ] **Step 1: Create level-selector.tsx**

Create `src/components/session/level-selector.tsx`:
```typescript
'use client'

type Level = 'Junior' | 'Mid' | 'Senior'

interface LevelSelectorProps {
  value: Level | null
  onChange: (level: Level) => void
}

const LEVELS: Level[] = ['Junior', 'Mid', 'Senior']

export default function LevelSelector({ value, onChange }: LevelSelectorProps) {
  return (
    <div className="flex gap-2">
      {LEVELS.map(level => (
        <button
          key={level}
          type="button"
          onClick={() => onChange(level)}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            value === level
              ? 'bg-[#1E40AF] text-white'
              : 'border border-gray-300 bg-white text-gray-700 hover:border-[#1E40AF] hover:text-[#1E40AF]'
          }`}
        >
          {level}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Create interview-type-selector.tsx**

Create `src/components/session/interview-type-selector.tsx`:
```typescript
'use client'

type InterviewType = 'Technical' | 'Behavioral' | 'Mixed'

interface InterviewTypeSelectorProps {
  value: InterviewType
  onChange: (type: InterviewType) => void
}

const TYPES: InterviewType[] = ['Technical', 'Behavioral', 'Mixed']

export default function InterviewTypeSelector({
  value,
  onChange,
}: InterviewTypeSelectorProps) {
  return (
    <div className="flex gap-2">
      {TYPES.map(type => (
        <button
          key={type}
          type="button"
          onClick={() => onChange(type)}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            value === type
              ? 'bg-[#1E40AF] text-white'
              : 'border border-gray-300 bg-white text-gray-700 hover:border-[#1E40AF] hover:text-[#1E40AF]'
          }`}
        >
          {type}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Type check**

```bash
pnpm type-check
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/session/level-selector.tsx src/components/session/interview-type-selector.tsx
git commit -m "feat: add LevelSelector and InterviewTypeSelector pill toggle components"
```

---

## Task 5: Role autocomplete component

**Files:**
- Create: `src/components/session/role-autocomplete.tsx`

- [ ] **Step 1: Create role-autocomplete.tsx**

Create `src/components/session/role-autocomplete.tsx`:
```typescript
'use client'

import { useState, useRef, useEffect } from 'react'

const PREDEFINED_ROLES = [
  'Software Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Mobile Developer',
  'DevOps Engineer',
  'Data Analyst',
  'Data Scientist',
  'Product Manager',
  'Business Analyst',
  'UI/UX Designer',
  'QA Engineer',
  'System Architect',
  'Network Engineer',
  'Cybersecurity Analyst',
  'SAP Consultant',
  'Project Manager',
  'Technical Support Engineer',
  'Database Administrator',
  'Machine Learning Engineer',
]

interface RoleAutocompleteProps {
  value: string
  onChange: (value: string) => void
}

export default function RoleAutocomplete({ value, onChange }: RoleAutocompleteProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const filtered = value.trim()
    ? PREDEFINED_ROLES.filter(r => r.toLowerCase().includes(value.toLowerCase()))
    : PREDEFINED_ROLES

  const exactMatch = PREDEFINED_ROLES.some(
    r => r.toLowerCase() === value.toLowerCase()
  )

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function select(role: string) {
    onChange(role)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={e => {
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        placeholder="e.g. Software Engineer"
        autoComplete="off"
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-[#1E40AF] focus:outline-none focus:ring-1 focus:ring-[#1E40AF]"
      />
      {open && (
        <ul className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg max-h-56 overflow-auto">
          {filtered.map(role => (
            <li
              key={role}
              onMouseDown={() => select(role)}
              className="cursor-pointer px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-[#1E40AF]"
            >
              {role}
            </li>
          ))}
          {value.trim() && !exactMatch && (
            <li
              onMouseDown={() => select(value.trim())}
              className="cursor-pointer border-t border-gray-100 px-3 py-2 text-sm font-medium text-[#1E40AF] hover:bg-blue-50"
            >
              + Use &ldquo;{value.trim()}&rdquo; as custom role
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Type check**

```bash
pnpm type-check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/session/role-autocomplete.tsx
git commit -m "feat: add RoleAutocomplete with predefined list + custom entry fallback"
```

---

## Task 6: Setup form + page

**Files:**
- Create: `src/components/session/setup-form.tsx`
- Create: `src/app/app/session/setup/page.tsx`

- [ ] **Step 1: Create setup-form.tsx**

Create `src/components/session/setup-form.tsx`:
```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import RoleAutocomplete from './role-autocomplete'
import LevelSelector from './level-selector'
import InterviewTypeSelector from './interview-type-selector'

type Level = 'Junior' | 'Mid' | 'Senior'
type InterviewType = 'Technical' | 'Behavioral' | 'Mixed'

export default function SetupForm() {
  const router = useRouter()
  const [role, setRole] = useState('')
  const [level, setLevel] = useState<Level | null>(null)
  const [interviewType, setInterviewType] = useState<InterviewType>('Mixed')
  const [jdText, setJdText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const jdTrimmed = jdText.slice(0, 2000)
  const jdWasTrimmed = jdText.length > 2000

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!role.trim() || !level) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: role.trim(),
          level,
          interviewType,
          jdText: jdTrimmed || undefined,
        }),
      })

      if (!res.ok) throw new Error('Failed')
      const { sessionId } = await res.json()
      router.push(`/app/session/${sessionId}/question`)
    } catch {
      setError("Couldn't generate questions. Please try again.")
      setLoading(false)
    }
  }

  const isValid = role.trim().length > 0 && level !== null

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Job Role <span className="text-red-500">*</span>
        </label>
        <RoleAutocomplete value={role} onChange={setRole} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Experience Level <span className="text-red-500">*</span>
        </label>
        <LevelSelector value={level} onChange={setLevel} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Interview Type
        </label>
        <InterviewTypeSelector value={interviewType} onChange={setInterviewType} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Job Description{' '}
          <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          value={jdText}
          onChange={e => setJdText(e.target.value)}
          rows={6}
          placeholder="Paste the job description here to get tailored questions…"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-[#1E40AF] focus:outline-none focus:ring-1 focus:ring-[#1E40AF]"
        />
        {jdWasTrimmed && (
          <p className="mt-1 text-xs text-amber-600">JD trimmed to fit AI limits.</p>
        )}
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={!isValid || loading}
        className="w-full rounded-md bg-[#1E40AF] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Generating your tailored questions…' : 'Start Interview →'}
      </button>
    </form>
  )
}
```

- [ ] **Step 2: Create the setup page**

Create `src/app/app/session/setup/page.tsx`:
```typescript
import SetupForm from '@/components/session/setup-form'

export default function SetupPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">New Interview Session</h1>
      <p className="text-gray-500 mb-8">
        Configure your session and we&apos;ll generate tailored questions.
      </p>
      <SetupForm />
    </div>
  )
}
```

- [ ] **Step 3: Type check**

```bash
pnpm type-check
```

Expected: no errors.

- [ ] **Step 4: Visual check in browser**

With dev server running, visit `http://localhost:3000/app/session/setup` (sign in first if needed).

Expected:
- "New Interview Session" heading
- Role input with placeholder
- Level pills (Junior / Mid / Senior)
- Interview Type pills (Technical / Behavioral / Mixed — Mixed pre-highlighted)
- JD textarea
- "Start Interview →" button (grey/disabled until role + level filled)

- [ ] **Step 5: Commit**

```bash
git add src/components/session/setup-form.tsx src/app/app/session/setup/page.tsx
git commit -m "feat: add session setup form with role autocomplete, level, interview type, JD paste"
```

---

## Task 7: Question page (Server Component)

**Files:**
- Create: `src/app/app/session/[id]/question/page.tsx`

- [ ] **Step 1: Create the question page**

Create `src/app/app/session/[id]/question/page.tsx`:
```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SessionPlayer from '@/components/session/session-player'

interface Props {
  params: Promise<{ id: string }>
}

export default async function QuestionPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/app/dashboard')

  // Fetch session — verify ownership
  const { data: session } = await supabase
    .from('sessions')
    .select('id, role, level, interview_type, jd_text')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!session) redirect('/app/dashboard')

  // Fetch all questions ordered by index
  const { data: questions } = await supabase
    .from('questions')
    .select('id, text, category, order_index')
    .eq('session_id', id)
    .order('order_index')

  const questionList = questions ?? []

  // Fetch answers for this session to determine progress
  const { data: answers } = await supabase
    .from('answers')
    .select('id')
    .eq('user_id', user.id)
    .in(
      'question_id',
      questionList.map(q => q.id)
    )

  const answeredCount = answers?.length ?? 0

  // All done — go to report
  if (answeredCount >= 10) {
    redirect(`/app/session/${id}/report`)
  }

  const currentQuestion = questionList.find(q => q.order_index === answeredCount)
  if (!currentQuestion) redirect('/app/dashboard')

  const progressPercent = Math.round(((answeredCount + 1) / 10) * 100)

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-sm text-gray-600">
          <span>Question {answeredCount + 1} of 10</span>
          <span className="font-medium text-[#1E40AF]">{progressPercent}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-gray-200">
          <div
            className="h-2 rounded-full bg-[#1E40AF] transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* JD pill */}
      {session.jd_text && (
        <div className="mb-4 inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
          ✓ Tailored to your JD
        </div>
      )}

      <SessionPlayer
        question={currentQuestion}
        session={{ id: session.id, role: session.role, level: session.level }}
        questionNumber={answeredCount + 1}
      />
    </div>
  )
}
```

- [ ] **Step 2: Type check**

```bash
pnpm type-check
```

Expected: error on `SessionPlayer` import (component doesn't exist yet) — this is expected. The import will resolve in Task 8.

- [ ] **Step 3: Commit**

```bash
git add src/app/app/session/[id]/question/page.tsx
git commit -m "feat: add question page Server Component with progress bar and session ownership check"
```

---

## Task 8: question-card + session-player components

**Files:**
- Create: `src/components/session/question-card.tsx`
- Create: `src/components/session/session-player.tsx`

- [ ] **Step 1: Create question-card.tsx**

Create `src/components/session/question-card.tsx`:
```typescript
const TIPS: Record<string, string> = {
  Technical: 'Be specific about tools and tradeoffs. Mention real examples from your work.',
  Behavioral: 'Use STAR: Situation, Task, Action, Result.',
  'System Design': 'Start with requirements and scale. Then components, then tradeoffs.',
  Communication: 'One clear point, one concrete example. Keep it under 2 minutes.',
}

interface Question {
  id: string
  text: string
  category: string
  order_index: number
}

interface Props {
  question: Question
}

export default function QuestionCard({ question }: Props) {
  const tip = TIPS[question.category] ?? 'Take your time and think before answering.'

  return (
    <div>
      <div className="rounded-r-lg border-l-4 border-[#1E40AF] bg-white p-4 shadow-sm">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
          {question.category}
        </p>
        <p className="text-base leading-relaxed text-gray-900">
          &ldquo;{question.text}&rdquo;
        </p>
      </div>
      <div className="mt-3 rounded-lg border border-orange-200 bg-[#FFF7ED] px-4 py-3">
        <p className="mb-1 text-xs font-semibold text-orange-700">💡 TIP</p>
        <p className="text-sm text-orange-800">{tip}</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create session-player.tsx**

Create `src/components/session/session-player.tsx`:
```typescript
'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import QuestionCard from './question-card'
import AnswerForm from './answer-form'
import FeedbackView from './feedback-view'

interface Question {
  id: string
  text: string
  category: string
  order_index: number
}

interface Session {
  id: string
  role: string
  level: string
}

interface FeedbackData {
  score: number
  correct_points: string[]
  missing_points: string[]
  improve_tip: string
  model_answer: string
}

interface Props {
  question: Question
  session: Session
  questionNumber: number
}

export default function SessionPlayer({ question, session, questionNumber }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [mode, setMode] = useState<'question' | 'feedback'>('question')
  const [feedback, setFeedback] = useState<FeedbackData | null>(null)
  const [feedbackUnavailable, setFeedbackUnavailable] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmitAnswer(answerText: string) {
    setSubmitting(true)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: question.id,
          sessionId: session.id,
          answerText,
        }),
      })

      const data = await res.json()

      if (data.error === 'feedback_unavailable') {
        setFeedbackUnavailable(true)
      } else if (res.ok) {
        setFeedback(data as FeedbackData)
      } else {
        setFeedbackUnavailable(true)
      }
    } catch {
      setFeedbackUnavailable(true)
    } finally {
      setSubmitting(false)
      setMode('feedback')
    }
  }

  function handleNext() {
    // Reset state then re-fetch from server
    setMode('question')
    setFeedback(null)
    setFeedbackUnavailable(false)
    router.push(pathname)
    router.refresh()
  }

  if (mode === 'feedback') {
    return (
      <FeedbackView
        feedback={feedback}
        unavailable={feedbackUnavailable}
        isLastQuestion={questionNumber === 10}
        onNext={handleNext}
      />
    )
  }

  return (
    <>
      <QuestionCard question={question} />
      <div className="mt-4">
        <AnswerForm onSubmit={handleSubmitAnswer} loading={submitting} />
      </div>
    </>
  )
}
```

- [ ] **Step 3: Type check**

```bash
pnpm type-check
```

Expected: error on `AnswerForm` and `FeedbackView` imports (not yet created) — expected. Resolves in Tasks 9 and 11.

- [ ] **Step 4: Commit**

```bash
git add src/components/session/question-card.tsx src/components/session/session-player.tsx
git commit -m "feat: add QuestionCard and SessionPlayer components"
```

---

## Task 9: answer-form component

**Files:**
- Create: `src/components/session/answer-form.tsx`

- [ ] **Step 1: Create answer-form.tsx**

Create `src/components/session/answer-form.tsx`:
```typescript
'use client'

import { useState, useEffect, useRef } from 'react'

interface Props {
  onSubmit: (answerText: string) => void
  loading: boolean
}

export default function AnswerForm({ onSubmit, loading }: Props) {
  const [answer, setAnswer] = useState('')
  const [voiceSupported, setVoiceSupported] = useState(false)
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => {
    setVoiceSupported(
      !!(window.SpeechRecognition || (window as Window & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition)
    )
  }, [])

  function handleVoice() {
    const SR =
      window.SpeechRecognition ||
      (window as Window & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition
    if (!SR) return

    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      return
    }

    const recognition = new SR()
    recognition.lang = 'ur-PK'
    recognition.interimResults = false
    recognition.continuous = false
    recognitionRef.current = recognition

    recognition.onstart = () => setListening(true)
    recognition.onend = () => setListening(false)
    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      setListening(false)
      if (e.error === 'not-allowed') {
        alert('Microphone access denied')
      }
    }
    recognition.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = e.results[0]?.[0]?.transcript ?? ''
      setAnswer(prev => (prev ? `${prev} ${transcript}` : transcript))
    }

    recognition.start()
  }

  const isValid = answer.trim().length >= 10

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        Your Answer
      </label>
      <textarea
        value={answer}
        onChange={e => setAnswer(e.target.value)}
        rows={5}
        placeholder="Type your answer here (English or Urdu)…"
        disabled={loading}
        className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-[#1E40AF] focus:outline-none focus:ring-1 focus:ring-[#1E40AF]"
      />
      {answer.trim().length > 0 && answer.trim().length < 10 && (
        <p className="mt-1 text-xs text-gray-400">Please give a more complete answer.</p>
      )}
      <div className="mt-3 flex gap-3">
        <button
          type="button"
          onClick={() => onSubmit(answer)}
          disabled={!isValid || loading}
          className="flex-1 rounded-md bg-[#1E40AF] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Evaluating…' : 'Submit Answer'}
        </button>
        {voiceSupported && (
          <button
            type="button"
            onClick={handleVoice}
            disabled={loading}
            className={`rounded-md border px-4 py-2.5 text-sm font-medium transition-colors ${
              listening
                ? 'border-red-300 bg-red-50 text-red-600'
                : 'border-gray-300 bg-white text-gray-700 hover:border-[#1E40AF]'
            }`}
          >
            {listening ? '⏹ Stop' : '🎤 بولیں'}
          </button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Type check**

```bash
pnpm type-check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/session/answer-form.tsx
git commit -m "feat: add AnswerForm with textarea, min-length validation, and Urdu voice input"
```

---

## Task 10: POST /api/feedback route

**Files:**
- Create: `src/app/api/feedback/route.ts`

- [ ] **Step 1: Create the route**

Create `src/app/api/feedback/route.ts`:
```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { groq } from '@/lib/groq'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { questionId, sessionId, answerText } = body

    // Validate inputs
    if (!questionId || !sessionId || typeof answerText !== 'string') {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (answerText.trim().length < 10) {
      return NextResponse.json({ error: 'Answer too short' }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verify session ownership
    const { data: session } = await supabase
      .from('sessions')
      .select('id, role, level, jd_text')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single()

    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 403 })

    // Fetch question
    const { data: question } = await supabase
      .from('questions')
      .select('id, text, category')
      .eq('id', questionId)
      .eq('session_id', sessionId)
      .single()

    if (!question) return NextResponse.json({ error: 'Question not found' }, { status: 404 })

    // Call Groq for evaluation
    let feedbackJson: Record<string, unknown> | null = null
    let score: number | null = null

    try {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content:
              "You are a senior interviewer evaluating a candidate's answer. Score from 1-10. Return JSON: { \"score\": 7, \"correct_points\": [], \"missing_points\": [], \"improve_tip\": \"...\", \"model_answer\": \"...\" }. Max 3 bullet points per array. Be concise and constructive.",
          },
          {
            role: 'user',
            content: `Question: ${question.text}\nCategory: ${question.category}\nCandidate Answer: ${answerText}\nRole: ${session.role} | Level: ${session.level}\nJD Context: ${session.jd_text || 'Not provided'}`,
          },
        ],
        response_format: { type: 'json_object' },
      })

      const content = completion.choices[0]?.message?.content
      if (content) {
        const parsed = JSON.parse(content)
        feedbackJson = parsed
        score = typeof parsed.score === 'number' ? parsed.score : null
      }
    } catch (groqError) {
      console.error('[POST /api/feedback] Groq error:', groqError)
      // Continue — save answer without feedback
    }

    // Save answer
    const { error: insertError } = await supabase.from('answers').insert({
      question_id: questionId,
      user_id: user.id,
      answer_text: answerText.trim(),
      score,
      feedback_json: feedbackJson,
    })

    if (insertError) {
      console.error('[POST /api/feedback] Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to save answer' }, { status: 500 })
    }

    if (!feedbackJson) {
      return NextResponse.json({ error: 'feedback_unavailable' })
    }

    return NextResponse.json(feedbackJson)
  } catch (error) {
    console.error('[POST /api/feedback]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Type check**

```bash
pnpm type-check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/feedback/route.ts
git commit -m "feat: add POST /api/feedback — submits answer, calls Groq for evaluation, stores result"
```

---

## Task 11: feedback-view component

**Files:**
- Create: `src/components/session/feedback-view.tsx`

- [ ] **Step 1: Create feedback-view.tsx**

Create `src/components/session/feedback-view.tsx`:
```typescript
'use client'

import { useState } from 'react'

interface FeedbackData {
  score: number
  correct_points: string[]
  missing_points: string[]
  improve_tip: string
  model_answer: string
}

interface Props {
  feedback: FeedbackData | null
  unavailable: boolean
  isLastQuestion: boolean
  onNext: () => void
}

function scoreLabel(score: number): string {
  if (score >= 8) return 'Strong Answer'
  if (score >= 5) return 'Good Attempt'
  return 'Needs Work'
}

export default function FeedbackView({
  feedback,
  unavailable,
  isLastQuestion,
  onNext,
}: Props) {
  const [modelOpen, setModelOpen] = useState(false)

  const nextLabel = isLastQuestion ? 'See Results →' : 'Next Question →'

  if (unavailable || !feedback) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Feedback unavailable. Your answer was saved.
        </div>
        <button
          onClick={onNext}
          className="w-full rounded-md bg-[#1E40AF] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
        >
          {nextLabel}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Score card */}
      <div className="rounded-xl bg-gradient-to-r from-[#1E40AF] to-[#3B82F6] p-6 text-center text-white">
        <div className="text-5xl font-bold leading-none">
          {feedback.score}
          <span className="text-2xl opacity-70">/10</span>
        </div>
        <div className="mt-2 text-sm opacity-90">{scoreLabel(feedback.score)}</div>
      </div>

      {/* Correct points */}
      {feedback.correct_points.length > 0 && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-green-700">
            ✓ What you got right
          </p>
          <ul className="space-y-1">
            {feedback.correct_points.map((point, i) => (
              <li key={i} className="text-sm text-green-800">
                • {point}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Missing points */}
      {feedback.missing_points.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-red-700">
            ✗ What was missing
          </p>
          <ul className="space-y-1">
            {feedback.missing_points.map((point, i) => (
              <li key={i} className="text-sm text-red-800">
                • {point}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Improve tip */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-blue-700">
          💡 Improve
        </p>
        <p className="text-sm text-blue-800">{feedback.improve_tip}</p>
      </div>

      {/* Model answer toggle */}
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <button
          onClick={() => setModelOpen(!modelOpen)}
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <span>▶ See model answer</span>
          <span className="text-gray-400">{modelOpen ? '▲' : '▼'}</span>
        </button>
        {modelOpen && (
          <div className="border-t border-gray-100 px-4 pb-4 pt-3 text-sm leading-relaxed text-gray-700">
            {feedback.model_answer}
          </div>
        )}
      </div>

      {/* Next button */}
      <button
        onClick={onNext}
        className="w-full rounded-md bg-[#1E40AF] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
      >
        {nextLabel}
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Type check**

```bash
pnpm type-check
```

Expected: no errors (all imports now resolve).

- [ ] **Step 3: Commit**

```bash
git add src/components/session/feedback-view.tsx
git commit -m "feat: add FeedbackView with score card, correct/missing/tip cards, model answer toggle"
```

---

## Task 12: Session report stub page

**Files:**
- Create: `src/app/app/session/[id]/report/page.tsx`

- [ ] **Step 1: Create the report stub page**

Create `src/app/app/session/[id]/report/page.tsx`:
```typescript
import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ReportPage({ params }: Props) {
  await params // consume params to avoid Next.js warning

  return (
    <div className="max-w-2xl mx-auto py-16 text-center">
      <div className="mb-6 text-5xl">🎉</div>
      <h1 className="mb-3 text-2xl font-bold text-gray-900">Session Complete!</h1>
      <p className="mb-2 text-gray-500">You answered all 10 questions.</p>
      <p className="mb-8 text-sm text-gray-400">
        Your full report is being built in Phase 4.
      </p>
      <Link
        href="/app/dashboard"
        className="inline-block rounded-md bg-[#1E40AF] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
      >
        Back to Dashboard
      </Link>
    </div>
  )
}
```

- [ ] **Step 2: Type check**

```bash
pnpm type-check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/app/session/[id]/report/page.tsx
git commit -m "feat: add session report stub page (Phase 4 placeholder)"
```

---

## Task 13: Dashboard "Start Interview" button + Sessions nav link

**Files:**
- Modify: `src/app/app/dashboard/page.tsx`
- Modify: `src/components/layout/app-nav.tsx`

- [ ] **Step 1: Update dashboard page**

Edit `src/app/app/dashboard/page.tsx` — replace the entire file:
```typescript
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const name: string =
    user?.user_metadata?.full_name || user?.email || 'there'

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {name}</h1>
        <Link
          href="/app/session/setup"
          className="rounded-md bg-[#1E40AF] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
        >
          + New Session
        </Link>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <p className="text-gray-500">Your sessions will appear here.</p>
        <p className="mt-1 text-sm text-gray-400">This dashboard is built in Phase 4.</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Enable Sessions link in app-nav**

Edit `src/components/layout/app-nav.tsx` — replace the Sessions `<span>` with a `<Link>`:
```typescript
import { createClient } from '@/lib/supabase/server'
import SignOutButton from '@/components/auth/sign-out-button'
import Link from 'next/link'

export default async function AppNav() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const fullName: string = user?.user_metadata?.full_name ?? ''
  const email: string = user?.email ?? ''
  const avatarUrl: string | null = user?.user_metadata?.avatar_url ?? null

  const initials = fullName
    ? fullName[0].toUpperCase()
    : email.slice(0, 2).toUpperCase()

  const displayName = fullName || email

  return (
    <nav className="bg-[#1E40AF] text-white px-6 py-3 flex items-center justify-between">
      <span className="font-bold text-lg">CareerCoach PK</span>
      <div className="flex items-center gap-6 text-sm">
        <Link href="/app/dashboard" className="hover:text-white/80 transition-colors">
          Dashboard
        </Link>
        <Link href="/app/session/setup" className="hover:text-white/80 transition-colors">
          Sessions
        </Link>
        <span
          className="opacity-40 cursor-not-allowed select-none"
          title="Coming in Phase 5"
        >
          Billing
        </span>
      </div>
      <div className="flex items-center gap-3">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-300 flex items-center justify-center text-sm font-semibold text-blue-900">
            {initials}
          </div>
        )}
        <span className="text-sm">{displayName}</span>
        <SignOutButton />
      </div>
    </nav>
  )
}
```

- [ ] **Step 3: Type check**

```bash
pnpm type-check
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/app/dashboard/page.tsx src/components/layout/app-nav.tsx
git commit -m "feat: add Start Interview button to dashboard and enable Sessions nav link"
```

---

## Task 14: End-to-end smoke test

No code changes — this is a manual walkthrough to verify the full flow.

- [ ] **Step 1: Start the dev server**

```bash
pnpm dev
```

- [ ] **Step 2: Sign in and reach dashboard**

Visit `http://localhost:3000`. Sign in with Google. Confirm you land on `/app/dashboard` with the "Welcome back" heading and "+ New Session" button.

- [ ] **Step 3: Open setup form**

Click "+ New Session" or "Sessions" in the nav. Confirm `/app/session/setup` loads with the form.

- [ ] **Step 4: Fill in the form**

- Type "Software Engineer" in the Role field — confirm autocomplete dropdown appears
- Select "Mid" level
- Leave Interview Type as "Mixed"
- Leave JD blank
- Click "Start Interview →"

Confirm: button shows "Generating your tailored questions…" spinner for 3–5 seconds, then redirects to `/app/session/{uuid}/question`.

- [ ] **Step 5: Verify question screen**

Confirm:
- "Question 1 of 10" progress bar
- Blue left-border question card with category label
- Orange tip box
- Answer textarea + "Submit Answer" button (disabled)
- 🎤 بولیں button visible (on Chrome/Edge)

- [ ] **Step 6: Submit an answer**

Type at least 10 characters in the textarea. Confirm the Submit button becomes enabled. Click it. Confirm "Evaluating…" spinner appears, then feedback view loads.

- [ ] **Step 7: Verify feedback screen**

Confirm:
- Blue gradient score card with number /10
- Green "What you got right" card
- Red "What was missing" card
- Blue "Improve" card
- "▶ See model answer" toggle (click to expand)
- "Next Question →" button

- [ ] **Step 8: Continue through questions**

Click "Next Question →". Confirm progress bar shows "Question 2 of 10". Answer and submit. Repeat until question 10.

- [ ] **Step 9: Verify session complete**

After question 10, click "See Results →". Confirm redirect to `/app/session/{id}/report` showing "Session Complete! 🎉" stub.

- [ ] **Step 10: Final commit**

```bash
git add -A
git commit -m "feat: complete Phase 2+3 — interview session with Groq AI feedback, smoke test passed"
```
