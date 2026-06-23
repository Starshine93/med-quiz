import { useCallback, useEffect, useState } from 'react'
import type { AnswerRecord, Question, QuizConfig, TopicStats, ProgressStore } from '../types'

const STORAGE_PREFIX = 'medquiz_'

function progressKey(topicId: string) {
  return `${STORAGE_PREFIX}progress_${topicId}`
}

function loadStats(topicId: string): TopicStats {
  try {
    const raw = localStorage.getItem(progressKey(topicId))
    if (raw) return JSON.parse(raw) as TopicStats
  } catch { /* ignore */ }
  return { seenIds: [], attempts: 0, bestPercent: 0, totalAnswered: 0, correctAnswered: 0 }
}

function saveStats(topicId: string, stats: TopicStats) {
  localStorage.setItem(progressKey(topicId), JSON.stringify(stats))
}

export function loadAllProgress(topicIds: string[]): ProgressStore {
  const store: ProgressStore = {}
  for (const id of topicIds) store[id] = loadStats(id)
  store['all'] = loadStats('all')
  return store
}

export function useProgress(topicIds: string[]) {
  const [progress, setProgress] = useState<ProgressStore>(() => loadAllProgress(topicIds))

  // topicIds starts as [] (manifest not yet loaded); re-read localStorage once they're available
  const topicIdsKey = topicIds.join(',')
  useEffect(() => {
    if (topicIds.length > 0) setProgress(loadAllProgress(topicIds))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicIdsKey])

  const recordQuizEnd = useCallback((
    config: QuizConfig,
    questions: Question[],
    answers: AnswerRecord[],
  ) => {
    const key = config.topicId  // 'all' or specific topicId
    const current = loadStats(key)

    const correctCount = answers.filter(a => a.correct).length
    const percent = answers.length > 0 ? Math.round((correctCount / answers.length) * 100) : 0

    const newSeenIds = config.isRepeatMistakes
      ? current.seenIds  // already seen — don't re-add
      : [...new Set([...current.seenIds, ...questions.map(q => q.id)])]

    const updated: TopicStats = {
      seenIds: newSeenIds,
      attempts: current.attempts + 1,
      bestPercent: Math.max(current.bestPercent, percent),
      totalAnswered: current.totalAnswered + answers.length,
      correctAnswered: current.correctAnswered + correctCount,
    }

    saveStats(key, updated)
    setProgress(prev => ({ ...prev, [key]: updated }))
  }, [])

  const resetProgress = useCallback((topicId: string) => {
    const empty: TopicStats = {
      seenIds: [], attempts: 0, bestPercent: 0, totalAnswered: 0, correctAnswered: 0,
    }
    saveStats(topicId, empty)
    setProgress(prev => ({ ...prev, [topicId]: empty }))
  }, [])

  const refreshProgress = useCallback(() => {
    setProgress(loadAllProgress(topicIds))
  }, [topicIds])

  return { progress, recordQuizEnd, resetProgress, refreshProgress }
}
