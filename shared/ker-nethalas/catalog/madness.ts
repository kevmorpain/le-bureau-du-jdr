import type { KnActiveSource, KnEffect } from '../effects'
import type { KnSkillKey } from '../skills'

// Gravebound p. 91 : résultats cumulatifs du tableau de Folie (D10). Les résultats 1, 9 et 10 sont immédiats
// et ne s'enregistrent pas.
export const KN_MADNESS_COUNTER_KEYS = [
  'fragileMind',
  'physicalReactions',
  'darknessComing',
  'rushing',
  'darkResistance',
  'forgetfulness',
] as const

export type KnMadnessCounterKey = (typeof KN_MADNESS_COUNTER_KEYS)[number]

export interface KnLostSkill {
  skill?: KnSkillKey
}

export interface KnMadness {
  counters: Record<KnMadnessCounterKey, number>
  lostSkills: KnLostSkill[]
}

// Résultat du D10 qui donne chaque entrée ; `lostSkills` correspond au résultat 8.
export const KN_MADNESS_D10: Record<KnMadnessCounterKey | 'lostSkill', number> = {
  fragileMind: 2,
  physicalReactions: 3,
  darknessComing: 4,
  rushing: 5,
  darkResistance: 6,
  forgetfulness: 7,
  lostSkill: 8,
}

export const emptyKnMadness = (): KnMadness => ({
  counters: Object.fromEntries(KN_MADNESS_COUNTER_KEYS.map(key => [key, 0])) as Record<KnMadnessCounterKey, number>,
  lostSkills: [],
})

const COUNTER_EFFECTS: Record<KnMadnessCounterKey, (count: number) => KnEffect[]> = {
  fragileMind: () => [],
  physicalReactions: count => [{ type: 'maxVitalDelta', vital: 'toughness', amount: -count }],
  darknessComing: () => [],
  rushing: count => [{ type: 'modifier', targets: ['scavenge'], amount: -10 * count }],
  darkResistance: count => [{ type: 'modifier', targets: ['resolve'], amount: -10 * count }],
  forgetfulness: () => [],
}

export function knMadnessSources(madness: KnMadness): KnActiveSource[] {
  const sources: KnActiveSource[] = KN_MADNESS_COUNTER_KEYS
    .filter(key => madness.counters[key] > 0)
    .map(key => ({
      id: `madness:${key}`,
      label: { key: `ker_nethalas.madness.${key}`, params: { count: madness.counters[key] } },
      effects: COUNTER_EFFECTS[key](madness.counters[key]),
      reminders: [],
    }))

  madness.lostSkills.forEach(({ skill }, index) => {
    sources.push({
      id: `madness:lostSkill:${index}`,
      label: {
        key: 'ker_nethalas.madness.lostSkill',
        params: { skill: skill ? `ker_nethalas.skills.${skill}` : 'ker_nethalas.reminders.noSkillChosen' },
      },
      effects: skill ? [{ type: 'modifier', targets: [skill], amount: -10 }] : [],
      reminders: [],
    })
  })

  return sources
}
