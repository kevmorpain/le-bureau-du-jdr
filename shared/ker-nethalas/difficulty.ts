export const KN_DIFFICULTY_KEYS = ['childsPlay', 'effortless', 'easy', 'normal', 'demanding', 'hard', 'impossible'] as const

export type KnDifficultyKey = (typeof KN_DIFFICULTY_KEYS)[number]

export const KN_DIFFICULTIES: Record<KnDifficultyKey, number> = {
  childsPlay: 30,
  effortless: 20,
  easy: 10,
  normal: 0,
  demanding: -10,
  hard: -20,
  impossible: -30,
}
