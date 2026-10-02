import { reactive } from 'vue'
import type { FeatureDef } from '../../server/db/seeds/lib/seedClass'

// Fiche minimale assemblée à partir des FeatureDef des seeds : ce que le GET servirait pour une classe unique.

let nextFeatureId = 1

export const featureRow = (def: FeatureDef, classId: number, patch: { currentUses?: number, active?: boolean } = {}) => {
  const featureId = nextFeatureId++
  return {
    featureId,
    currentUses: patch.currentUses ?? 0,
    active: patch.active ?? false,
    feature: {
      id: featureId,
      name: def.name,
      description: def.description,
      featureType: 'class_feature',
      classId,
      subclassId: null,
      levelRequired: def.levelRequired,
      actionType: def.actionType ?? null,
      rechargeType: def.rechargeType ?? null,
      maxUsesFormula: def.maxUsesFormula ?? null,
      meta: def.meta ?? null,
      featureEffects: (def.effects ?? []).map(effect => ({ effect })),
    },
  }
}

export const named = (defs: FeatureDef[], name: string) => defs.find(f => f.name === name)!

export const abilityScores = (overrides: Record<string, number> = {}) =>
  ['str', 'dex', 'con', 'int', 'wis', 'cha'].map(abilityId => ({ abilityId, value: overrides[abilityId] ?? 10 }))

// Réactive comme la fiche de la page (un `ref`) : un composant relit ce qu'il a muté.
export const classSheet = (
  sheetId: number,
  className: string,
  classId: number,
  level: number,
  features: ReturnType<typeof featureRow>[],
  extra: Record<string, unknown> = {},
) => reactive({
  id: sheetId,
  baseAbilityScores: abilityScores(),
  classes: [{ classId, level, isMain: true, class: { name: className }, subclass: null }],
  features,
  skills: [],
  abilityScoreImprovements: [],
  spellSlots: [],
  temporaryEffects: [],
  species: null,
  ...extra,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}) as any
