import { useState } from 'react'
import type { ManifestEntry, PartMeta, Question, QuizConfig, CountOption, Difficulty, FeedbackMode, ProgressStore } from '../types'

interface Props {
  /** entries of the currently open part only */
  manifest: ManifestEntry[]
  part: PartMeta
  questionBank: Record<string, Question[]>
  progress: ProgressStore
  onStartQuiz: (config: QuizConfig) => void
  onReset: (topicId: string) => void
  onBack: () => void
  onDashboard: () => void
}

const COUNT_OPTIONS: { label: string; value: CountOption }[] = [
  { label: '10', value: 10 },
  { label: '20', value: 20 },
  { label: '50', value: 50 },
  { label: 'Все', value: 'all' },
]

const DIFFICULTY_OPTIONS: { label: string; value: Difficulty | 'all' }[] = [
  { label: 'Любая', value: 'all' },
  { label: 'Лёгкие', value: 'easy' },
  { label: 'Средние', value: 'medium' },
  { label: 'Сложные', value: 'hard' },
]

function unseenCount(topicId: string, questionBank: Record<string, Question[]>, progress: ProgressStore): number {
  const questions = questionBank[topicId] ?? []
  const seen = new Set(progress[topicId]?.seenIds ?? [])
  return questions.filter(q => !seen.has(q.id)).length
}

export default function HomePage({
  manifest, part, questionBank, progress, onStartQuiz, onReset, onBack, onDashboard,
}: Props) {
  const [count, setCount] = useState<CountOption>(20)
  const [difficulty, setDifficulty] = useState<Difficulty | 'all'>('all')
  const [feedbackMode, setFeedbackMode] = useState<FeedbackMode>('immediate')

  function buildConfig(topicId: string, topicTitle: string): QuizConfig {
    return { topicId, topicTitle, count, difficulty, feedbackMode, isRepeatMistakes: false }
  }

  // Part-wide totals (only topics of this part)
  const partQuestions = manifest.flatMap(e => questionBank[e.id] ?? [])
  const partSeen = new Set(progress[part.quizId]?.seenIds ?? [])
  const partUnseen = partQuestions.filter(q => !partSeen.has(q.id)).length
  const partTotal = partQuestions.length

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 gap-4">
        <div className="min-w-0">
          <button
            onClick={onBack}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors mb-1"
          >
            ← Все части
          </button>
          <h1 className="text-3xl font-bold text-blue-700">{part.title}</h1>
          <p className="text-gray-500 mt-1">{part.subtitle}</p>
        </div>
        <button
          onClick={onDashboard}
          className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium"
        >
          <span>📊</span> Прогресс
        </button>
      </div>

      {/* Quiz settings */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Настройки теста</h2>
        <div className="flex flex-wrap gap-6">
          {/* Count */}
          <div>
            <p className="text-xs text-gray-500 mb-2">Вопросов за попытку</p>
            <div className="flex gap-1.5">
              {COUNT_OPTIONS.map(o => (
                <button
                  key={String(o.value)}
                  onClick={() => setCount(o.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    count === o.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <p className="text-xs text-gray-500 mb-2">Сложность</p>
            <div className="flex gap-1.5">
              {DIFFICULTY_OPTIONS.map(o => (
                <button
                  key={o.value}
                  onClick={() => setDifficulty(o.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    difficulty === o.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Feedback */}
          <div>
            <p className="text-xs text-gray-500 mb-2">Показывать ответ</p>
            <div className="flex gap-1.5">
              {([['immediate', 'Сразу'], ['deferred', 'В конце']] as [FeedbackMode, string][]).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setFeedbackMode(val)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    feedbackMode === val
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Topic cards */}
      <div className="grid gap-3 mb-4">
        {manifest.map(entry => {
          const total = (questionBank[entry.id] ?? []).length
          const unseen = unseenCount(entry.id, questionBank, progress)
          const seenCount = (progress[entry.id]?.seenIds ?? []).length
          const pct = total > 0 ? Math.round((seenCount / total) * 100) : 0
          const stats = progress[entry.id]
          const exhausted = unseen === 0 && total > 0

          return (
            <div key={entry.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900">{entry.title}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-400">
                      {total === 0 ? 'Вопросов нет' : `${seenCount} / ${total} пройдено`}
                    </span>
                    {stats?.attempts ? (
                      <span className="text-xs text-gray-400">
                        Лучший результат: {stats.bestPercent}%
                      </span>
                    ) : null}
                  </div>
                  {total > 0 && (
                    <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden w-full max-w-xs">
                      <div
                        className="h-full bg-blue-400 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}
                </div>

                {exhausted ? (
                  <div className="text-right shrink-0">
                    <p className="text-xs text-green-600 font-medium mb-1">✓ Все пройдено</p>
                    <button
                      onClick={() => {
                        onReset(entry.id)
                        onStartQuiz({ ...buildConfig(entry.id, entry.title), count: 'all', isRepeatMistakes: false })
                      }}
                      className="text-xs text-blue-600 underline"
                    >
                      Начать заново
                    </button>
                  </div>
                ) : total === 0 ? (
                  <span className="text-xs text-gray-300 shrink-0">Скоро</span>
                ) : (
                  <button
                    onClick={() => onStartQuiz(buildConfig(entry.id, entry.title))}
                    className="shrink-0 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    Начать тест
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Part-wide quiz */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-lg font-bold">Общий тест — вся {part.title}</h3>
            <p className="text-blue-100 text-sm mt-0.5">
              {partTotal === 0
                ? 'Вопросы ещё не добавлены'
                : partUnseen === 0
                ? `Вы прошли все ${partTotal} вопросов`
                : `${partUnseen} непройденных из ${partTotal}`}
            </p>
          </div>
          {partTotal > 0 && (
            partUnseen === 0 ? (
              <button
                onClick={() => {
                  onReset(part.quizId)
                  onStartQuiz({
                    topicId: part.quizId,
                    topicTitle: `Все темы — ${part.title}`,
                    count, difficulty, feedbackMode, isRepeatMistakes: false,
                  })
                }}
                className="shrink-0 px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white text-sm font-medium rounded-xl transition-colors"
              >
                Начать заново
              </button>
            ) : (
              <button
                onClick={() => onStartQuiz({
                  topicId: part.quizId,
                  topicTitle: `Все темы — ${part.title}`,
                  count, difficulty, feedbackMode, isRepeatMistakes: false,
                })}
                className="shrink-0 px-4 py-2 bg-white text-blue-700 text-sm font-semibold rounded-xl hover:bg-blue-50 transition-colors"
              >
                Начать тест
              </button>
            )
          )}
        </div>
      </div>
    </div>
  )
}
