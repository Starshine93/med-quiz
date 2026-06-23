import type { QuizResult } from '../types'

interface Props {
  result: QuizResult
  onHome: () => void
  onRepeatMistakes: (result: QuizResult) => void
  onRetry: () => void
}

export default function EndScreen({ result, onHome, onRepeatMistakes, onRetry }: Props) {
  const { config, questions, answers } = result
  const correctCount = answers.filter(a => a.correct).length
  const total = answers.length
  const pct = total > 0 ? Math.round((correctCount / total) * 100) : 0

  const mistakes = answers
    .filter(a => !a.correct)
    .map(a => {
      const q = questions.find(q => q.id === a.questionId)!
      return { question: q, selectedIndex: a.selectedIndex }
    })

  const scoreColor =
    pct >= 80 ? 'text-green-600' :
    pct >= 50 ? 'text-yellow-600' :
    'text-red-600'

  const scoreBg =
    pct >= 80 ? 'bg-green-50 border-green-200' :
    pct >= 50 ? 'bg-yellow-50 border-yellow-200' :
    'bg-red-50 border-red-200'

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="text-4xl mb-2">
          {pct >= 80 ? '🎉' : pct >= 50 ? '💪' : '📚'}
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Тест завершён</h1>
        <p className="text-gray-500 mt-1">{config.topicTitle}</p>
      </div>

      {/* Score card */}
      <div className={`rounded-2xl border p-6 text-center mb-6 ${scoreBg}`}>
        <p className={`text-5xl font-bold mb-1 ${scoreColor}`}>{pct}%</p>
        <p className="text-gray-600">
          {correctCount} из {total} правильно
        </p>
        {pct >= 80 && <p className="text-green-600 text-sm mt-2 font-medium">Отличный результат!</p>}
        {pct >= 50 && pct < 80 && <p className="text-yellow-700 text-sm mt-2">Хороший результат — есть куда расти.</p>}
        {pct < 50 && <p className="text-red-600 text-sm mt-2">Стоит повторить материал.</p>}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 mb-8">
        <button
          onClick={onHome}
          className="flex-1 min-w-[140px] py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors text-sm"
        >
          ← На главную
        </button>
        <button
          onClick={onRetry}
          className="flex-1 min-w-[140px] py-2.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 font-medium hover:bg-blue-100 transition-colors text-sm"
        >
          Пройти ещё раз
        </button>
        {mistakes.length > 0 && (
          <button
            onClick={() => onRepeatMistakes(result)}
            className="flex-1 min-w-[140px] py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors text-sm"
          >
            Повторить ошибки ({mistakes.length})
          </button>
        )}
      </div>

      {/* Mistakes list */}
      {mistakes.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Ошибки ({mistakes.length})
          </h2>
          <div className="flex flex-col gap-3">
            {mistakes.map(({ question, selectedIndex }) => (
              <div key={question.id} className="bg-white rounded-xl border border-red-100 p-4">
                <p className="text-sm font-medium text-gray-900 mb-2">{question.question}</p>
                <p className="text-xs text-red-600 mb-0.5">
                  Ваш ответ: {question.options[selectedIndex]}
                </p>
                <p className="text-xs text-green-700 mb-2">
                  Правильно: {question.options[question.correctIndex]}
                </p>
                <p className="text-xs text-gray-500 leading-relaxed bg-gray-50 rounded-lg p-2">
                  {question.explanation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {mistakes.length === 0 && (
        <div className="text-center py-6">
          <p className="text-gray-400 text-sm">Ошибок нет — все ответы правильные!</p>
        </div>
      )}
    </div>
  )
}
