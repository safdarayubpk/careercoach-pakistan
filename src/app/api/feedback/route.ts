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
    const cappedAnswer = answerText.slice(0, 5000)

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

    // Prevent duplicate answer submission
    const { data: existing } = await supabase
      .from('answers')
      .select('id')
      .eq('question_id', questionId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Already answered' }, { status: 409 })
    }

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
            content: `Question: ${question.text}\nCategory: ${question.category}\nCandidate Answer: ${cappedAnswer}\nRole: ${session.role} | Level: ${session.level}\nJD Context: ${session.jd_text || 'Not provided'}`,
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
      answer_text: cappedAnswer.trim(),
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
