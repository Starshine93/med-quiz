import type { ManifestEntry, PartId, PartMeta } from './types'

export const PARTS: PartMeta[] = [
  {
    id: 1,
    title: 'Часть 1',
    subtitle: 'Сердце и сосуды, кровь, фармакология',
    quizId: 'part1',
  },
  {
    id: 2,
    title: 'Часть 2',
    subtitle: 'Дыхательная система, воспаление, шок',
    quizId: 'part2',
  },
]

export function partMeta(id: PartId): PartMeta {
  const meta = PARTS.find(p => p.id === id)
  if (!meta) throw new Error(`Unknown part: ${id}`)
  return meta
}

export function entriesOfPart(manifest: ManifestEntry[], id: PartId): ManifestEntry[] {
  return manifest.filter(e => e.part === id)
}

/** Pseudo topic ids that stand for a whole part rather than a single topic. */
export const PART_QUIZ_IDS = PARTS.map(p => p.quizId)
