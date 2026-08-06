import type { ManifestEntry, PartId, ProgressStore, Question } from '../types'
import { PARTS, entriesOfPart } from '../parts'

interface Props {
  manifest: ManifestEntry[]
  questionBank: Record<string, Question[]>
  progress: ProgressStore
  onOpenPart: (part: PartId) => void
  onDashboard: () => void
}

export default function PartsPage({ manifest, questionBank, progress, onOpenPart, onDashboard }: Props) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-blue-700">Медицинский тест</h1>
          <p className="text-gray-500 mt-1">Выберите часть курса</p>
        </div>
        <button
          onClick={onDashboard}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium"
        >
          <span>📊</span> Прогресс
        </button>
      </div>

      {/* Part cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {PARTS.map(part => {
          const entries = entriesOfPart(manifest, part.id)
          const questions = entries.flatMap(e => questionBank[e.id] ?? [])
          const total = questions.length

          // A question counts as seen if it was seen in its own topic or in a part-wide run
          const seenIds = new Set<string>(progress[part.quizId]?.seenIds ?? [])
          for (const e of entries) {
            for (const id of progress[e.id]?.seenIds ?? []) seenIds.add(id)
          }
          const seen = questions.filter(q => seenIds.has(q.id)).length
          const pct = total > 0 ? Math.round((seen / total) * 100) : 0

          return (
            <button
              key={part.id}
              onClick={() => onOpenPart(part.id)}
              className="group text-left bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-gray-900">{part.title}</h2>
                  <p className="text-sm text-gray-500 mt-1">{part.subtitle}</p>
                </div>
                <span className="text-gray-300 group-hover:text-blue-500 transition-colors text-xl shrink-0">
                  →
                </span>
              </div>

              <p className="text-xs text-gray-400 mt-4">
                {entries.length} тем · {total} вопросов
              </p>

              <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-400 rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1.5">
                {seen} / {total} пройдено · {pct}%
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
