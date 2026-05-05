import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { groq } from '@/lib/groq'
import { VALID_LEVELS, VALID_TYPES, VALID_CATEGORIES } from '@/types/session'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { role, level, interviewType, jdText } = body

    // Server-side validation
    if (!role?.trim() || !level || !interviewType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (!VALID_LEVELS.includes(level) || !VALID_TYPES.includes(interviewType)) {
      return NextResponse.json({ error: 'Invalid level or interview type' }, { status: 400 })
    }
    const cappedRole = role.trim().slice(0, 200)
    const cappedJd = jdText ? jdText.slice(0, 2000) : null

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
          content: `Role: ${cappedRole}\nLevel: ${level}\nInterview Type: ${interviewType}\nJob Description: ${cappedJd || 'Not provided'}`,
        },
      ],
      response_format: { type: 'json_object' },
    })

    const content = completion.choices[0]?.message?.content
    if (!content) throw new Error('Empty Groq response')

    let parsed: { questions?: unknown }
    try {
      parsed = JSON.parse(content)
    } catch {
      throw new Error('Groq returned malformed JSON')
    }

    const questions = parsed.questions
    if (!Array.isArray(questions) || questions.length !== 10) {
      throw new Error('Groq did not return exactly 10 questions')
    }

    // Per-item validation
    for (const q of questions) {
      if (
        typeof q.text !== 'string' || !q.text.trim() ||
        !VALID_CATEGORIES.includes(q.category) ||
        typeof q.order_index !== 'number' ||
        q.order_index < 0 || q.order_index > 9
      ) {
        throw new Error('Groq returned invalid question format')
      }
    }
    // Validate no duplicate order_index values
    const indices = questions.map((q: { order_index: number }) => q.order_index)
    if (new Set(indices).size !== 10) {
      throw new Error('Groq returned duplicate order_index values')
    }

    // Insert session
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        user_id: user.id,
        role: cappedRole,
        level,
        interview_type: interviewType,
        jd_text: cappedJd,
      })
      .select('id')
      .single()

    if (sessionError || !session) throw new Error('Failed to create session')

    // Insert questions — clean up session row on failure
    const { error: questionsError } = await supabase.from('questions').insert(
      questions.map((q: { text: string; category: string; order_index: number }) => ({
        session_id: session.id,
        text: q.text,
        category: q.category,
        order_index: q.order_index,
      }))
    )

    if (questionsError) {
      // Delete orphaned session row to prevent partial writes
      await supabase.from('sessions').delete().eq('id', session.id)
      throw new Error('Failed to insert questions')
    }

    return NextResponse.json({ sessionId: session.id })
  } catch (error) {
    console.error('[POST /api/session]', error)
    return NextResponse.json({ error: 'Failed to generate session' }, { status: 500 })
  }
}
