import type { Effect } from '~~/server/db/schema/effects'

type SightKind = Extract<Effect, { type: 'sight_modifier' }>['value']['kind']

export const SIGHT_MODIFIER_LABELS: Record<SightKind, string> = {
  read_all_writing: 'Lit toutes les écritures, quelle que soit la langue',
  magical_darkness_120: 'Voit dans les ténèbres, magiques ou non, jusqu\'à 36 m',
  invisible_in_dim_light: 'Peut devenir invisible par une action dans la pénombre ou l\'obscurité',
  true_sight_disguise: 'Discerne la forme véritable des métamorphes et des illusions à 9 m',
}

export const darkvisionRange = (effects: readonly Effect[]): number =>
  Math.max(0, ...effects.flatMap(e => (e.type === 'darkvision' ? [e.value.range] : [])))

export const sensesOf = (effects: readonly Effect[]): string[] => {
  const range = darkvisionRange(effects)
  const kinds = new Set(effects.flatMap(e => (e.type === 'sight_modifier' ? [e.value.kind] : [])))
  return [...(range ? [`Vision dans le noir ${range} m`] : []), ...[...kinds].map(kind => SIGHT_MODIFIER_LABELS[kind])]
}
