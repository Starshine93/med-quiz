import { useEffect, useMemo, useState } from 'react'
import type { AnswerRecord, Question, QuizResult, QuizSession, ShuffledOption } from '../types'

interface Props {
  session: QuizSession
  onQuizEnd: (result: QuizResult) => void
  onHome: () => void
}

function shuffleOptions(question: Question): ShuffledOption[] {
  const opts: ShuffledOption[] = question.options.map((text, i) => ({ text, originalIndex: i }))
  for (let i = opts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [opts[i], opts[j]] = [opts[j], opts[i]]
  }
  return opts
}

export default function QuizPage({ session, onQuizEnd, onHome }: Props) {
  const { config, questions } = session
  const immediate = config.feedbackMode === 'immediate'

  // Pre-shuffle all option orders once at mount
  const shuffledOptionSets = useMemo(
    () => questions.map(q => shuffleOptions(q)),
    [questions]
  )

  const [currentIdx, setCurrentIdx] = useState(0)
  const [selectedShuffled, setSelectedShuffled] = useState<number | null>(null) // index in shuffled array
  const [answers, setAnswers] = useState<AnswerRecord[]>([])
  const [revealed, setRevealed] = useState(false) // true after answering (for immediate mode)

  const question = questions[currentIdx]
  const shuffledOpts = shuffledOptionSets[currentIdx]
  const isLast = currentIdx === questions.length - 1
  const progressPct = ((currentIdx) / questions.length) * 100

  // Reset per-question state when moving forward
  useEffect(() => {
    setSelectedShuffled(null)
    setRevealed(false)
  }, [currentIdx])

  if (questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-2xl font-bold text-gray-700 mb-2">Нет доступных вопросов</p>
        <p className="text-gray-500 mb-6">
          Вы прошли все вопросы по этой теме или не добавлено ни одного вопроса.
          Смотрите <code className="bg-gray-100 px-1 rounded">GENERATE.md</code> для добавления новых.
        </p>
        <button onClick={onHome} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
          На главную
        </button>
      </div>
    )
  }

  function handleSelect(shuffledIdx: number) {
    if (selectedShuffled !== null) return // already answered
    setSelectedShuffled(shuffledIdx)
    if (immediate) {
      setRevealed(true)
    } else {
      // deferred: record and advance immediately
      const originalIdx = shuffledOpts[shuffledIdx].originalIndex
      const correct = originalIdx === question.correctIndex
      const record: AnswerRecord = { questionId: question.id, selectedIndex: originalIdx, correct }
      const newAnswers = [...answers, record]
      setAnswers(newAnswers)
      if (isLast) {
        onQuizEnd({ config, questions, answers: newAnswers })
      } else {
        setTimeout(() => setCurrentIdx(i => i + 1), 300)
      }
    }
  }

  function handleNext() {
    if (selectedShuffled === null) return
    const originalIdx = shuffledOpts[selectedShuffled].originalIndex
    const correct = originalIdx === question.correctIndex
    const record: AnswerRecord = { questionId: question.id, selectedIndex: originalIdx, correct }
    const newAnswers = [...answers, record]
    setAnswers(newAnswers)
    if (isLast) {
      onQuizEnd({ config, questions, answers: newAnswers })
    } else {
      setCurrentIdx(i => i + 1)
    }
  }

  function optionClass(idx: number): string {
    const base = 'w-full text-left px-4 py-3 rounded-xl border-2 font-medium transition-all text-sm'
    if (!revealed || selectedShuffled === null) {
      if (selectedShuffled === idx && !immediate) {
        return `${base} border-blue-400 bg-blue-50 text-blue-700`
      }
      return `${base} border-gray-200 bg-white text-gray-800 ${selectedShuffled === null ? 'hover:border-blue-400 hover:bg-blue-50 cursor-pointer' : 'cursor-default'}`
    }
    const opt = shuffledOpts[idx]
    const isCorrect = opt.originalIndex === question.correctIndex
    const isSelected = idx === selectedShuffled
    if (isCorrect) return `${base} border-green-500 bg-green-50 text-green-800`
    if (isSelected && !isCorrect) return `${base} border-red-400 bg-red-50 text-red-700`
    return `${base} border-gray-200 bg-white text-gray-400 cursor-default`
  }

  const difficultyLabel: Record<string, string> = { easy: 'Лёгкий', medium: 'Средний', hard: 'Сложный' }
  const difficultyColor: Record<string, string> = {
    easy: 'text-green-600 bg-green-50',
    medium: 'text-yellow-700 bg-yellow-50',
    hard: 'text-red-600 bg-red-50',
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={onHome} className="text-gray-400 hover:text-gray-600 transition-colors text-sm">
          ← На главную
        </button>
        <span className="text-sm text-gray-500 font-medium">
          {currentIdx + 1} / {questions.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-100 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Question card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
            {config.topicTitle}
          </span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${difficultyColor[question.difficulty] ?? ''}`}>
            {difficultyLabel[question.difficulty] ?? question.difficulty}
          </span>
        </div>
        <p className="text-gray-900 text-base font-medium leading-relaxed">{question.question}</p>
      </div>

      {/* Options */}
      <div className="flex flex-col gap-2 mb-4">
        {shuffledOpts.map((opt, idx) => (
          <button
            key={idx}
            className={optionClass(idx)}
            onClick={() => handleSelect(idx)}
            disabled={selectedShuffled !== null}
          >
            <span className="mr-2 text-gray-400 font-normal">{['А', 'Б', 'В', 'Г'][idx]}.</span>
            {opt.text}
          </button>
        ))}
      </div>

      {/* Explanation (immediate mode) */}
      {revealed && immediate && (
        <div className={`rounded-xl p-4 mb-4 border ${
          shuffledOpts[selectedShuffled!].originalIndex === question.correctIndex
            ? 'bg-green-50 border-green-200'
            : 'bg-amber-50 border-amber-200'
        }`}>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Объяснение</p>
          <p className="text-sm text-gray-700 leading-relaxed">{question.explanation}</p>
        </div>
      )}

      {/* Next / Submit button (immediate mode) */}
      {immediate && revealed && (
        <button
          onClick={handleNext}
          className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
        >
          {isLast ? 'Завершить тест' : 'Следующий вопрос →'}
        </button>
      )}
    </div>
  )
}
