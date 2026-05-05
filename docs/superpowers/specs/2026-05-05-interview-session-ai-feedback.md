# Interview Session + AI Feedback — Design Spec
**Date:** 2026-05-05
**Phases:** 2 + 3 (combined)
**Status:** Approved

---

## Overview

End-to-end interview session flow: user configures a session, receives 10 AI-generated questions, answers them one at a time, and gets instant Groq-powered feedback after each answer. Covers setup form → question screen → feedback screen → session complete stub.

---

## Routes

```
/app/session/setup              ← Setup form (new session)
/app/session/[id]/question      ← Question screen + inline feedback (active session)
/app/session/[id]/report        ← Session complete stub (Phase 4 placeholder)
```

All routes are under `/app/*` — protected by existing `proxy.ts`.

---

## Database Schema

Create these tables in Supabase before implementation. RLS enabled on all.

```sql
-- Sessions
create table sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade not null,
  role          text not null,
  level         text not null check (level in ('Junior', 'Mid', 'Senior')),
  interview_type text not null check (interview_type in ('Technical', 'Behavioral', 'Mixed')),
  jd_text       text,
  created_at    timestamptz default now()
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

---

## Setup Form — `/app/session/setup`

### Fields

| Field | Type | Required | Default |
|-------|------|----------|---------|
| Role | Searchable autocomplete (custom text allowed) | Yes | — |
| Level | Pill toggle: Junior / Mid / Senior | Yes | — |
| Interview Type | Pill toggle: Technical / Behavioral / Mixed | Yes | Mixed |
| JD Text | Textarea | No | — |

### Predefined Roles (~20 Pakistani market roles)
Software Engineer, Frontend Developer, Backend Developer, Full Stack Developer, Mobile Developer, DevOps Engineer, Data Analyst, Data Scientist, Product Manager, Business Analyst, UI/UX Designer, QA Engineer, System Architect, Network Engineer, Cybersecurity Analyst, SAP Consultant, Project Manager, Technical Support Engineer, Database Administrator, Machine Learning Engineer

### Role Autocomplete Behaviour
- Type to filter the predefined list
- Dropdown shows matching results
- If no match: show "+ Use '{input}' as custom role" — user can submit any text
- Custom entry is fully valid — Groq handles any profession

### JD Length Handling
- Client trims JD to first 2000 characters before sending to API
- If trimmed: show small note below textarea — "JD trimmed to fit AI limits"

### Submit Flow
1. Validate role (non-empty), level (selected), interviewType (selected)
2. Show loading state: "Generating your tailored questions…" with spinner
3. Call `POST /api/session`
4. On success: redirect to `/app/session/[id]/question`
5. On error: show error message on form, user can retry

---

## API — `POST /api/session`

**Auth:** Server-side — reads user from Supabase session cookie.

**Request body:**
```json
{
  "role": "Software Engineer",
  "level": "Mid",
  "interviewType": "Mixed",
  "jdText": "..." // optional, pre-trimmed to 2000 chars by client
}
```

**Steps:**
1. Validate all required fields server-side
2. Call Groq (`llama-3.3-70b-versatile`) with question generation prompt
3. Parse JSON response — validate 10 questions returned
4. Insert row into `sessions` table (using service role client)
5. Insert 10 rows into `questions` table
6. Return `{ sessionId }`

**Groq question generation prompt:**
```
System: You are a senior interviewer. Generate exactly 10 interview questions
        for the role and level given. Return JSON:
        { "questions": [{ "text": "...", "category": "...", "order_index": 0 }] }
        Categories must be: Technical, Behavioral, System Design, or Communication.
        Mix categories to match the interview type. Questions must be specific, not generic.

User:   Role: {role}
        Level: {level}
        Interview Type: {interviewType}
        Job Description: {jdText || "Not provided"}
```

**Error handling:**
- Groq fails or returns malformed JSON → return 500, no DB rows written
- Client shows "Couldn't generate questions. Try again."

---

## Question Screen — `/app/session/[id]/question`

### Data Loading (Server Component)
1. Fetch session from DB — verify `session.user_id === current user` → 403 redirect to dashboard if mismatch
2. Fetch all answers for this session
3. Current question = question with `order_index === answers.length`
4. If `answers.length === 10` → redirect to `/app/session/[id]/report`

### UI Elements
- **Progress bar:** "Question {n} of 10" with filled bar at `n/10`
- **JD pill:** Green "✓ Tailored to your JD" — shown only if `session.jd_text` is non-null
- **Question card:** Blue left border (`border-l-4 border-[#1E40AF]`), category label (small, grey), question text
- **Tip box:** Orange background (`bg-[#FFF7ED]`), tip text per category (see below)
- **Textarea:** Accepts English or Urdu. Min 10 chars to enable Submit. Placeholder: "Type your answer here (English or Urdu)…"
- **Submit button:** Disabled until textarea ≥ 10 chars. On click: calls `POST /api/feedback`, shows loading spinner
- **Voice button:** `🎤 بولیں` — visible only if `window.SpeechRecognition || window.webkitSpeechRecognition` exists. Transcribed text is appended (not replaced) to textarea. On permission denied: toast "Microphone access denied"

### Tips Per Category
| Category | Tip |
|----------|-----|
| Technical | "Be specific about tools and tradeoffs. Mention real examples from your work." |
| Behavioral | "Use STAR: Situation, Task, Action, Result." |
| System Design | "Start with requirements and scale. Then components, then tradeoffs." |
| Communication | "One clear point, one concrete example. Keep it under 2 minutes." |

---

## API — `POST /api/feedback`

**Auth:** Server-side — reads user from Supabase session cookie.

**Request body:**
```json
{
  "questionId": "uuid",
  "sessionId": "uuid",
  "answerText": "..."
}
```

**Steps:**
1. Validate `answerText.trim().length >= 10` — return 400 if too short
2. Fetch question + session from DB using user's session cookie — verify session belongs to current user, return 403 if not
3. Call Groq with answer evaluation prompt
4. Parse JSON response
5. Insert row into `answers` table (score may be null if Groq fails — see error handling)
6. Return feedback JSON to client

**Groq answer evaluation prompt:**
```
System: You are a senior interviewer evaluating a candidate's answer.
        Score from 1-10. Return JSON:
        { "score": 7, "correct_points": [], "missing_points": [], "improve_tip": "...", "model_answer": "..." }
        Max 3 bullet points per array. Be concise and constructive.

User:   Question: {question.text}
        Category: {question.category}
        Candidate Answer: {answerText}
        Role: {session.role} | Level: {session.level}
        JD Context: {session.jd_text || "Not provided"}
```

**Error handling:**
- Groq fails → insert answer with `score: null`, `feedback_json: null` → return `{ error: "feedback_unavailable" }`
- Client shows: "Feedback unavailable. Your answer was saved." User can still proceed to next question

---

## Feedback Screen — `/app/session/[id]/feedback`

Feedback is shown client-side immediately after `POST /api/feedback` returns — no separate page load. The question screen transitions in-place to the feedback view.

### UI Elements
- **Score card:** Gradient blue (`from-[#1E40AF] to-[#3B82F6]`), large score number `/10`, label ("Strong Answer" / "Good Attempt" / "Needs Work" based on score)
- **Correct card:** Green background, `✓ WHAT YOU GOT RIGHT`, bullet list from `correct_points[]`
- **Missing card:** Red background, `✗ WHAT WAS MISSING`, bullet list from `missing_points[]`
- **Improve card:** Blue background, `💡 IMPROVE`, single `improve_tip` text
- **Model answer toggle:** Collapsed by default. Click to expand inline. Shows `model_answer` text.
- **Next button:** "Next Question →" (or "See Results →" on question 10) → calls `router.push(pathname)` + `router.refresh()` to force Server Component re-fetch, which increments the question by deriving from updated answer count

### Score Labels
| Score | Label |
|-------|-------|
| 8–10 | Strong Answer |
| 5–7 | Good Attempt |
| 1–4 | Needs Work |

### Feedback Unavailable State
If `POST /api/feedback` returned `feedback_unavailable`:
- Show inline message: "Feedback unavailable. Your answer was saved."
- Show "Next Question →" button so user is not blocked

---

## Session Complete Stub — `/app/session/[id]/report`

Placeholder page for Phase 4. Shows:
- "Session Complete!" heading
- "Your full report is being built in Phase 4."
- "Back to Dashboard" link → `/app/dashboard`

---

## Session Resume

If user closes browser mid-session and returns to `/app/session/[id]/question`:
- Fetch answers count for this session
- Current question = `order_index === answers.length`
- User resumes from the first unanswered question automatically

---

## Dependencies

```bash
pnpm add groq-sdk
```

Required before any API route can call Groq.

### Groq Client Module

Create `src/lib/groq.ts`:
```typescript
import Groq from 'groq-sdk'

export const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
```

Import `groq` from this module in all API routes. Never instantiate `new Groq()` inline.

---

## Components

```
src/components/session/
  role-autocomplete.tsx       ← 'use client' — searchable input with predefined list
  level-selector.tsx          ← 'use client' — pill toggle (Junior/Mid/Senior)
  interview-type-selector.tsx ← 'use client' — pill toggle (Technical/Behavioral/Mixed)
  session-player.tsx          ← 'use client' — owns question/feedback state toggle
    question-card.tsx         ←   plain component — blue border card + tip box
    answer-form.tsx           ←   'use client' — textarea + submit + voice button
    feedback-view.tsx         ←   'use client' — score + cards + model answer toggle
```

`session-player.tsx` is the Client Component boundary. It receives the current question as a prop from the Server Component page, manages `mode: 'question' | 'feedback'` state, and renders either `<QuestionCard>` + `<AnswerForm>` or `<FeedbackView>` based on state.

---

## Error States Summary

| Scenario | Behaviour |
|----------|-----------|
| Groq question gen fails | Error on setup form, no session created |
| Groq feedback fails | Answer saved, feedback skipped, user can proceed |
| Session not found | Redirect to dashboard |
| Session belongs to another user | Redirect to dashboard |
| Empty / too-short answer | Submit button disabled (client-side) |
| Voice mic denied | Toast notification |
| Voice API unsupported | Button hidden |
| JD over 2000 chars | Trimmed client-side, note shown |
