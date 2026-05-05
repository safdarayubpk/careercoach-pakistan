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
