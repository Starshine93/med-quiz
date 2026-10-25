export interface Question {
  id: string
  topicId: string
  question: string
  options: [string, string, string, string]
  correctIndex: 0 | 1 | 2 | 3
  explanation: string
  difficulty: 'easy' | 'medium' | 'hard'
  tags: string[]
}

export type PartId = 1 | 2 | 3 | 4

export interface ManifestEntry {
  id: string
  title: string
  file: string
  questionCount: number
  part: PartId
}

export interface PartMeta {
  id: PartId
  title: string
  subtitle: string
  /** pseudo topic id used for the part-wide quiz and its progress entry */
  quizId: string
}

export type FeedbackMode = 'immediate' | 'deferred'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type CountOption = 10 | 20 | 50 | 'all'

export interface QuizConfig {
  topicId: string          // topic id, or 'all'
  topicTitle: string
  count: CountOption
  difficulty: Difficulty | 'all'
  feedbackMode: FeedbackMode
  isRepeatMistakes: boolean
}

export interface AnswerRecord {
  questionId: string
  selectedIndex: number    // index in ORIGINAL options array
  correct: boolean
}

export interface QuizSession {
  config: QuizConfig
  questions: Question[]    // pre-filtered and shuffled for this session
}

export interface QuizResult {
  config: QuizConfig
  questions: Question[]
  answers: AnswerRecord[]
}

export interface TopicStats {
  seenIds: string[]
  attempts: number
  bestPercent: number
  totalAnswered: number
  correctAnswered: number
}

export type ProgressStore = Record<string, TopicStats>

// Shuffled option for rendering (tracks original index)
export interface ShuffledOption {
  text: string
  originalIndex: number
}
