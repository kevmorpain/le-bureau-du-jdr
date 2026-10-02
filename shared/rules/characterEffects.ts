import type { Effect } from '~~/server/db/schema/effects'
import type { FeatChoices } from '~~/server/db/schema/character_features'
import type { EffectSource } from '~~/shared/rules/effectBonuses'
import type { SkillKey } from '~~/shared/rules/skills'
import type { TemporaryEffect } from '~~/shared/utils/temporary_effects'

export type { FeatChoices }

export const featLanguageChoiceCount = (effects: Effect[]): number =>
  effects.reduce((n, e) => e.type === 'language_proficiency_choice' ? n + e.value.count : n, 0)

/**
 * Résout les effets « à choix » d'un don selon les choix enregistrés (`character_features.choices`).
 * Sans choix enregistré, l'effet n'accorde rien. `ability_increase_choice`/`saving_throw_proficiency_choice`
 * lisent `choices.ability` (count 1) ; le marqueur `skilled_choice` (don Doué) lit `choices.skills`/`tools`
 * et `language_proficiency_choice` (Linguiste) `choices.languages` → une maîtrise par entrée.
 */
export const resolveFeatEffects = (effects: Effect[], choices: FeatChoices | null): Effect[] =>
  effects.flatMap((e) => {
    if (e.type === 'language_proficiency_choice') {
      return (choices?.languages ?? []).slice(0, e.value.count)
        .map((language): Effect => ({ type: 'language_proficiency', value: language }))
    }
    if (e.type === 'ability_increase_choice') {
      const ability = choices?.ability
      if (!ability) return []
      return [{ type: 'ability_increase' as const, value: { ability, amount: e.value.amount } }]
    }
    if (e.type === 'saving_throw_proficiency_choice') {
      const ability = choices?.ability
      if (!ability || e.value.count !== 1) return []
      return [{ type: 'saving_throw_proficiency' as const, value: { ability } }]
    }
    if (e.type === 'other' && (e.value as { kind?: string }).kind === 'skilled_choice') {
      return [
        ...(choices?.skills ?? []).map((skill): Effect => ({ type: 'skill_proficiency', value: { skill: skill as SkillKey } })),
        ...(choices?.tools ?? []).map((tool): Effect => ({ type: 'tool_proficiency', value: tool })),
      ]
    }
    return [e]
  })

// Forme minimale de ce que lisent ces dérivations : la fiche du GET, ses relations Drizzle ou l'état
// du builder projeté, sans dépendre du type applicatif `CharacterSheet`.
interface FeatureWithEffects {
  featureType: string
  levelRequired?: number | null
  classId?: number | null
  subclassId?: number | null
  // Ligne Drizzle de la table des effets : le type d'union `Effect` en est le contrat, pas son type inféré.
  featureEffects?: { effect?: object | null }[]
}

export interface EffectInputsSheet {
  species?: { speciesFeatures?: { feature?: FeatureWithEffects | null }[] } | null
  features?: { feature?: FeatureWithEffects | null, choices?: FeatChoices | null }[]
  classes?: { classId: number, level: number, subclass?: { id: number } | null }[]
  abilityScoreImprovements?: { classId: number, classLevel: number, ability: Extract<Effect, { type: 'ability_increase' }>['value']['ability'], amount: number }[]
}

const effectsOf = (feature: FeatureWithEffects): Effect[] =>
  (feature.featureEffects ?? []).flatMap(fe => (fe.effect ? [fe.effect as Effect] : []))

export const speciesEffectsOf = (sheet: EffectInputsSheet | null | undefined): Effect[] =>
  (sheet?.species?.speciesFeatures ?? []).flatMap(sf => (sf.feature ? effectsOf(sf.feature) : []))

export const featureEffectsOf = (sheet: EffectInputsSheet | null | undefined): Effect[] => {
  const classes = sheet?.classes ?? []
  return (sheet?.features ?? []).flatMap((cf) => {
    const feature = cf.feature
    if (!feature) return []
    const effects = effectsOf(feature)
    if (feature.featureType === 'species_trait' || feature.featureType === 'eldritch_invocation') return effects
    if (feature.featureType === 'feat') return resolveFeatEffects(effects, cf.choices ?? null)
    const owner = feature.featureType === 'class_feature'
      ? classes.find(c => c.classId === feature.classId)
      : classes.find(c => c.subclass?.id === feature.subclassId)
    return owner && owner.level >= (feature.levelRequired ?? 1) ? effects : []
  })
}

export const asiEffectsOf = (sheet: EffectInputsSheet | null | undefined): Effect[] => {
  const classes = sheet?.classes ?? []
  return (sheet?.abilityScoreImprovements ?? [])
    .filter((asi) => {
      const c = classes.find(cc => cc.classId === asi.classId)
      return c && c.level >= asi.classLevel
    })
    .map(asi => ({ type: 'ability_increase' as const, value: { ability: asi.ability, amount: asi.amount } }))
}

export interface InventoryEntryEffects {
  equipped: boolean
  attuned: boolean
  item?: { name: string, requiresAttunement: boolean, effects?: Effect[] } | null
}

// DMG : « Une créature qui ne se lie pas à un objet qui nécessite un lien obtient uniquement les
// avantages non magiques de celui-ci » → aucun effet sans lien.
export const activeItemEffectSources = (inventory: readonly InventoryEntryEffects[]): EffectSource[] =>
  inventory
    .filter(e => e.equipped && (!e.item?.requiresAttunement || e.attuned) && e.item?.effects?.length)
    .map(e => ({ label: e.item!.name, effects: e.item!.effects! }))

export const activeTemporaryEffectSources = (temporaryEffects: readonly TemporaryEffect[]): EffectSource[] =>
  temporaryEffects
    .filter(t => t.active)
    .map(t => ({ label: t.name, effects: t.effects }))
