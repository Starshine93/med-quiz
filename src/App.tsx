import { useEffect, useState } from 'react'
import type { ManifestEntry, Question, QuizConfig, QuizResult, QuizSession } from './types'
import { useProgress } from './hooks/useProgress'
import HomePage from './components/HomePage'
import QuizPage from './components/QuizPage'
import EndScreen from './components/EndScreen'
import Dashboard from './components/Dashboard'

type View = 'home' | 'quiz' | 'results' | 'dashboard'

// Vite glob import — loads all topic question files lazily
const questionModules = import.meta.glob<{ default: Question[] }>('../data/questions/*.json')

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function App() {
  const [manifest, setManifest] = useState<ManifestEntry[]>([])
  const [questionBank, setQuestionBank] = useState<Record<string, Question[]>>({})
  const [loading, setLoading] = useState(true)

  const [view, setView] = useState<View>('home')
  const [session, setSession] = useState<QuizSession | null>(null)
  const [result, setResult] = useState<QuizResult | null>(null)

  // Load manifest + all question files on mount
  useEffect(() => {
    async function load() {
      const manifestMod = await import('../data/manifest.json')
      const entries = manifestMod.default as ManifestEntry[]
      setManifest(entries)

      const bank: Record<string, Question[]> = {}
      await Promise.all(
        Object.entries(questionModules).map(async ([path, loader]) => {
          const m = await loader()
          const topicId = path.replace(/^.*\/([^/]+)\.json$/, '$1')
          bank[topicId] = m.default ?? []
        })
      )
      setQuestionBank(bank)
      setLoading(false)
    }
    load()
  }, [])

  const topicIds = manifest.map(e => e.id)
  const { progress, recordQuizEnd, resetProgress, refreshProgress } = useProgress(topicIds)

  function startQuiz(config: QuizConfig, mistakeIds?: string[]) {
    // Gather raw question pool
    let pool: Question[]
    if (config.topicId === 'all') {
      pool = Object.values(questionBank).flat()
    } else {
      pool = questionBank[config.topicId] ?? []
    }

    // Filter difficulty
    if (config.difficulty !== 'all') {
      pool = pool.filter(q => q.difficulty === config.difficulty)
    }

    // For "repeat mistakes", use the specific ids
    if (config.isRepeatMistakes && mistakeIds) {
      const idSet = new Set(mistakeIds)
      pool = pool.filter(q => idSet.has(q.id))
    } else {
      // Filter to unseen only
      const seen = new Set(progress[config.topicId]?.seenIds ?? [])
      pool = pool.filter(q => !seen.has(q.id))
    }

    // Shuffle and limit
    const shuffled = shuffle(pool)
    const questions = config.count === 'all' ? shuffled : shuffled.slice(0, config.count)

    setSession({ config, questions })
    setView('quiz')
  }

  function handleQuizEnd(quizResult: QuizResult) {
    recordQuizEnd(quizResult.config, quizResult.questions, quizResult.answers)
    setResult(quizResult)
    setView('results')
  }

  function handleRepeatMistakes(quizResult: QuizResult) {
    const mistakeIds = quizResult.answers
      .filter(a => !a.correct)
      .map(a => a.questionId)
    startQuiz({ ...quizResult.config, isRepeatMistakes: true }, mistakeIds)
  }

  function handleHome() {
    refreshProgress()
    setView('home')
    setSession(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-lg">Загрузка вопросов…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {view === 'home' && (
        <HomePage
          manifest={manifest}
          questionBank={questionBank}
          progress={progress}
          onStartQuiz={startQuiz}
          onReset={resetProgress}
          onDashboard={() => setView('dashboard')}
        />
      )}
      {view === 'quiz' && session && (
        <QuizPage
          session={session}
          onQuizEnd={handleQuizEnd}
          onHome={handleHome}
        />
      )}
      {view === 'results' && result && (
        <EndScreen
          result={result}
          onHome={handleHome}
          onRepeatMistakes={handleRepeatMistakes}
          onRetry={() => startQuiz(result.config)}
        />
      )}
      {view === 'dashboard' && (
        <Dashboard
          manifest={manifest}
          questionBank={questionBank}
          progress={progress}
          onReset={resetProgress}
          onHome={handleHome}
        />
      )}
    </div>
  )
}
