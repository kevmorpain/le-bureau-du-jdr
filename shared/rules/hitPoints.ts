import type { Effect } from '~~/server/db/schema/effects'
import { abilityMod } from '~~/shared/rules/math'
import { computeAbilityScores } from '~~/shared/rules/abilityScores'
import {
  activeItemEffectSources,
  activeTemporaryEffectSources,
  asiEffectsOf,
  featureEffectsOf,
  speciesEffectsOf,
  type EffectInputsSheet,
  type InventoryEntryEffects,
} from '~~/shared/rules/characterEffects'
import type { TemporaryEffect } from '~~/shared/utils/temporary_effects'

// AideDD, « Au-delà du niveau 1 » : le dé de vie plus le modificateur de CON s'ajoute à chaque niveau
// « (minimum 1) » ; la valeur fixe est la moyenne arrondie au supérieur ; quand le modificateur de CON
// augmente de 1, le maximum augmente de 1 par niveau atteint.
//
// `character_sheets.hp_base` ne garde donc que la part « dés » : le modificateur de CON et les bonus par niveau
// (Robuste) s'ajoutent à la lecture, jamais stockés.

export const EXHAUSTION_HALVES_MAX_HP_AT = 4

export const averageHitDieValue = (sides: number): number => Math.ceil(sides / 2) + 1

// Le minimum de 1 PV par niveau se joue au gain, sur le modificateur de CON naturel (hors objets et effets
// temporaires) : la part stockée est relevée de ce qui manque, puisque la CON est ajoutée plus tard.
export const hitPointGain = (dieValue: number, naturalConMod: number): number =>
  Math.max(dieValue, 1 - naturalConMod)

// Niveau 1 : dé au maximum ; niveaux suivants : la valeur de chaque dé.
export const baseHitPoints = (sides: number, laterLevelValues: readonly number[], naturalConMod: number): number =>
  hitPointGain(sides, naturalConMod) + laterLevelValues.reduce((sum, v) => sum + hitPointGain(v, naturalConMod), 0)

export const averageBaseHitPoints = (sides: number, level: number, naturalConMod: number): number =>
  baseHitPoints(sides, Array.from({ length: Math.max(0, level - 1) }, () => averageHitDieValue(sides)), naturalConMod)

// Bornes de ce qu'on peut obtenir avec des dés : 1 PV par niveau au plus bas, le dé maximal à chaque niveau
// au plus haut (le relèvement du minimum ne dépasse jamais 6, plus petit dé de classe).
export const baseHitPointsBounds = (sides: number, level: number): { min: number, max: number } =>
  ({ min: level, max: level * sides })

export const hitPointsPerLevelBonus = (effects: readonly Effect[]): number =>
  effects.reduce((sum, e) => e.type === 'hp_per_level' ? sum + e.value.amount : sum, 0)

export interface MaxHitPointsInput {
  hpBase: number
  totalLevel: number
  conMod: number
  perLevelBonus: number
  exhaustionLevel: number
}

export const maxHitPoints = (input: MaxHitPointsInput): number => {
  // Plancher : un malus de CON ne fait jamais passer le maximum sous 1.
  const full = Math.max(1, input.hpBase + (input.conMod + input.perLevelBonus) * input.totalLevel)
  return input.exhaustionLevel >= EXHAUSTION_HALVES_MAX_HP_AT ? Math.floor(full / 2) : full
}

// Édition directe du maximum : on saisit le total affiché, on stocke ce qui reste hors CON et hors bonus par niveau.
export const hpBaseFromTotal = (total: number, totalLevel: number, conMod: number, perLevelBonus: number): number =>
  total - (conMod + perLevelBonus) * totalLevel

export interface HitPointsSheet extends EffectInputsSheet {
  hpBase: number
  exhaustionLevel: number
  baseAbilityScores?: { abilityId: string, value: number }[]
  inventory?: readonly InventoryEntryEffects[]
  temporaryEffects?: readonly TemporaryEffect[]
}

export interface SheetHitPoints {
  maxHp: number
  conMod: number
  // Sans les objets ni les effets temporaires : celui du minimum de 1 PV par niveau au gain.
  naturalConMod: number
  totalLevel: number
  perLevelBonus: number
}

// Équivalent serveur de ce que la fiche calcule dans ses composables : mêmes sources d'effets, mêmes plafonds.
export const sheetHitPoints = (sheet: HitPointsSheet): SheetHitPoints => {
  const speciesEffects = speciesEffectsOf(sheet)
  const featureEffects = featureEffectsOf(sheet)
  const activeEffects = [
    ...activeItemEffectSources(sheet.inventory ?? []),
    ...activeTemporaryEffectSources(sheet.temporaryEffects ?? []),
  ].flatMap(s => s.effects)

  const scores = computeAbilityScores({
    base: Object.fromEntries((sheet.baseAbilityScores ?? []).map(s => [s.abilityId, s.value])),
    speciesEffects,
    featureEffects,
    asiEffects: asiEffectsOf(sheet),
    activeEffects,
  })
  const conMod = abilityMod(scores.con.total)
  const totalLevel = (sheet.classes ?? []).reduce((sum, c) => sum + c.level, 0)
  const perLevelBonus = hitPointsPerLevelBonus([...speciesEffects, ...featureEffects, ...activeEffects])

  return {
    maxHp: maxHitPoints({ hpBase: sheet.hpBase, totalLevel, conMod, perLevelBonus, exhaustionLevel: sheet.exhaustionLevel }),
    conMod,
    naturalConMod: abilityMod(scores.con.total - scores.con.items),
    totalLevel,
    perLevelBonus,
  }
}
