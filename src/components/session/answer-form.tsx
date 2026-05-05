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
    setVoiceSupported(!!(window.SpeechRecognition || window.webkitSpeechRecognition))
  }, [])

  function handleVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
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
