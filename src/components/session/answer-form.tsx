'use client'

import { useState, useEffect, useRef } from 'react'

interface Props {
  onSubmit: (answerText: string) => void
  loading: boolean
}

export default function AnswerForm({ onSubmit, loading }: Props) {
  const [answer, setAnswer] = useState('')
  const [interimText, setInterimText] = useState('')
  const [voiceSupported] = useState(
    () => typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  )
  const [listening, setListening] = useState(false)
  const [micError, setMicError] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  // Ref (not state) so onend always reads the latest intended value without stale closure
  const listeningRef = useRef(false)

  useEffect(() => {
    return () => {
      listeningRef.current = false
      recognitionRef.current?.abort()
    }
  }, [])

  function startRecognition() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR || !listeningRef.current) return

    const recognition = new SR()
    recognition.lang = 'ur-PK'
    recognition.interimResults = true
    // continuous = false: single-utterance mode fixes two Android bugs —
    // (1) duplicate text from resultIndex resetting on internal restart,
    // (2) recording appearing stopped when Android kills the session.
    // onend auto-restarts as long as listeningRef.current is true.
    recognition.continuous = false
    recognitionRef.current = recognition

    recognition.onend = () => {
      setInterimText('')
      if (listeningRef.current) {
        startRecognition() // seamless restart — user never needs to tap again
      }
    }

    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      setInterimText('')
      if (e.error === 'not-allowed') {
        listeningRef.current = false
        setListening(false)
        setMicError(true)
      }
      // Other errors (no-speech, network, aborted): onend fires next and
      // restarts if listeningRef.current is still true.
    }

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript
        if (e.results[i].isFinal) {
          setAnswer(prev => (prev ? `${prev} ${transcript}` : transcript))
        } else {
          interim += transcript
        }
      }
      setInterimText(interim)
    }

    recognition.start()
  }

  function handleVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return

    if (listeningRef.current) {
      listeningRef.current = false
      setListening(false)
      recognitionRef.current?.stop()
      return
    }

    listeningRef.current = true
    setListening(true)
    setMicError(false)
    startRecognition()
  }

  const isValid = answer.trim().length >= 10

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        Your Answer
      </label>
      <textarea
        dir="auto"
        value={answer}
        onChange={e => setAnswer(e.target.value)}
        rows={5}
        placeholder="Type your answer here (English or Urdu)…"
        disabled={loading}
        className="w-full min-h-[120px] resize-none rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-[#1E40AF] focus:outline-none focus:ring-1 focus:ring-[#1E40AF]"
      />
      {interimText && (
        <p dir="auto" className="mt-1 text-xs italic text-gray-400">{interimText}…</p>
      )}
      {!interimText && answer.trim().length > 0 && answer.trim().length < 10 && (
        <p className="mt-1 text-xs text-gray-400">Please give a more complete answer.</p>
      )}
      <div className="mt-3 flex gap-3">
        <button
          type="button"
          onClick={() => onSubmit(answer)}
          disabled={!isValid || loading}
          className="w-full flex-1 rounded-md bg-[#1E40AF] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Evaluating…' : 'Submit Answer'}
        </button>
        {voiceSupported && (
          <button
            type="button"
            onClick={handleVoice}
            disabled={loading}
            className={`min-h-[44px] min-w-[44px] rounded-md border px-4 py-2.5 text-sm font-medium transition-colors ${
              listening
                ? 'border-red-300 bg-red-50 text-red-600'
                : 'border-gray-300 bg-white text-gray-700 hover:border-[#1E40AF]'
            }`}
          >
            {listening ? '⏹ Stop' : '🎤 بولیں'}
          </button>
        )}
      </div>
      {micError && (
        <p role="alert" className="mt-2 text-xs text-red-600">
          Microphone access denied. Please allow microphone access in your browser settings.
        </p>
      )}
    </div>
  )
}
