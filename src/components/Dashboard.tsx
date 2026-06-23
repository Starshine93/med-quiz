import { useState } from 'react'
import type { ManifestEntry, Question, ProgressStore } from '../types'

interface Props {
  manifest: ManifestEntry[]
  questionBank: Record<string, Question[]>
  progress: ProgressStore
  onReset: (topicId: string) => void
  onHome: () => void
}

export default function Dashboard({ manifest, questionBank, progress, onReset, onHome }: Props) {
  const [confirmReset, setConfirmReset] = useState<string | null>(null)

  function handleReset(topicId: string) {
    onReset(topicId)
    setConfirmReset(null)
  }

  const allQuestions = Object.values(questionBank).flat()
  const allStats = progress['all']
  const allTotal = allQuestions.length
  const allSeen = (allStats?.seenIds ?? []).length

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button onClick={onHome} className="text-gray-400 hover:text-gray-600 transition-colors">
          ← Назад
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Прогресс</h1>
      </div>

      {/* Overall summary */}
      <div className="bg-blue-600 rounded-2xl text-white p-6 mb-6">
        <h2 className="text-sm font-semibold opacity-70 uppercase tracking-wide mb-3">Общий прогресс</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-2xl font-bold">{allSeen} / {allTotal}</p>
            <p className="text-blue-200 text-xs mt-0.5">Вопросов пройдено</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{allStats?.attempts ?? 0}</p>
            <p className="text-blue-200 text-xs mt-0.5">Тестов завершено</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{allStats?.bestPercent ?? 0}%</p>
            <p className="text-blue-200 text-xs mt-0.5">Лучший результат</p>
          </div>
        </div>
      </div>

      {/* Per-topic table */}
      <div className="flex flex-col gap-3">
        {manifest.map(entry => {
          const total = (questionBank[entry.id] ?? []).length
          const stats = progress[entry.id]
          const seen = stats?.seenIds.length ?? 0
          const pct = total > 0 ? Math.round((seen / total) * 100) : 0
          const accuracy = stats && stats.totalAnswered > 0
            ? Math.round((stats.correctAnswered / stats.totalAnswered) * 100)
            : null

          return (
            <div key={entry.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm">{entry.title}</h3>
                </div>
                {confirmReset === entry.id ? (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleReset(entry.id)}
                      className="text-xs px-2.5 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Да, сбросить
                    </button>
                    <button
                      onClick={() => setConfirmReset(null)}
                      className="text-xs px-2.5 py-1 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Отмена
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmReset(entry.id)}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors shrink-0"
                    title="Сбросить прогресс"
                  >
                    Сбросить
                  </button>
                )}
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-gray-100 rounded-full mb-3">
                <div
                  className="h-full bg-blue-400 rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{seen} / {total}</p>
                  <p className="text-xs text-gray-400">Пройдено</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{pct}%</p>
                  <p className="text-xs text-gray-400">Охват</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {accuracy !== null ? `${accuracy}%` : '—'}
                  </p>
                  <p className="text-xs text-gray-400">Точность</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{stats?.bestPercent ?? 0}%</p>
                  <p className="text-xs text-gray-400">Лучший</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Reset all */}
      <div className="mt-6 text-center">
        {confirmReset === 'ALL' ? (
          <div className="flex items-center justify-center gap-3">
            <p className="text-sm text-gray-600">Сбросить весь прогресс?</p>
            <button
              onClick={() => {
                manifest.forEach(e => onReset(e.id))
                onReset('all')
                setConfirmReset(null)
              }}
              className="text-sm px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Да
            </button>
            <button
              onClick={() => setConfirmReset(null)}
              className="text-sm px-3 py-1 border border-gray-200 rounded-lg text-gray-600"
            >
              Отмена
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmReset('ALL')}
            className="text-sm text-gray-400 hover:text-red-500 transition-colors"
          >
            Сбросить весь прогресс
          </button>
        )}
      </div>
    </div>
  )
}
