import { evaluate, type Formula, type FormulaContext } from '../utils/formula'
import type { ChoiceKind, OptionSource } from './choices'
import type { SkillKey } from './skills'
import type { AbilityKey } from './abilities'
import type { FeaturePrerequisite } from '../../server/db/schema/features'

// Pur et partagé client/serveur. Doit rester importable par le projet vitest `unit` (sans alias `~~`) :
// aucun import de valeur `~~/…` ni `hub:db`, la base est pré-résolue dans le `Catalog` par l'appelant.

export interface ResolvedOption {
  featureId?: number // feature_group : pacte / invocation / style / métamagie / manœuvre / don
  subclassId?: number // subclasses
  lineageId?: number // lineages : sous-race 2014 / lignée 2024 (D17)
  spellId?: number // spells
  value?: string // enum / skills / languages / tools (valeur typée sans table)
  prerequisites?: FeaturePrerequisite | null
  /** Comparé au niveau de la classe propriétaire, pas au niveau total. */
  levelRequired?: number
}

export interface CatalogProgression {
  progressionId: number
  ownerFeatureId?: number
  /** Exactement un de `ownerClassId` / `ownerSpeciesId` est renseigné (D17). */
  ownerClassId?: number
  ownerSpeciesId?: number
  ownerSubclassId?: number
  ownerLevelRequired: number
  kind: ChoiceKind
  count: Formula
  optionSource: OptionSource
  replaceable: boolean
  /** Absent pour les sources résolues contre la projection (`proficient_*`). */
  options?: ResolvedOption[]
}

export interface Catalog {
  progressions: CatalogProgression[]
}

export interface CharacterProjection {
  classLevels: Record<number, number>
  speciesId?: number
  subclassIds?: number[]
  proficientSkills?: SkillKey[]
  proficientWeapons?: string[]
  picks?: Array<{ progressionId: number }>
  abilityModifiers?: Partial<Record<AbilityKey, number>>
  pactBoon?: 'chain' | 'blade' | 'tome' | null
  knownSpellNames?: string[]
  knownInvocationNames?: string[]
  abilityScores?: Partial<Record<AbilityKey, number>>
  armorProficiencies?: Array<'light' | 'medium' | 'heavy'>
  hasSpellcasting?: boolean
}

export interface ResolvedChoice {
  progressionId: number
  ownerFeatureId?: number
  ownerClassId?: number
  ownerSpeciesId?: number
  ownerSubclassId?: number
  ownerLevelRequired: number
  kind: ChoiceKind
  /** Niveau de la classe propriétaire (≠ niveau total en multiclasse) ; niveau total pour un choix d'espèce. */
  classLevel: number
  count: number
  made: number
  remaining: number
  replaceable: boolean
  optionSource: OptionSource
  options: ResolvedOption[]
}

function proficiencyBonus(totalLevel: number): number {
  return 2 + Math.floor((Math.max(1, totalLevel) - 1) / 4)
}

// Dépend de l'état du perso : non cachable, donc évalué ici et pas dans le catalogue.
export function isOptionEligible(option: ResolvedOption, ownerClassLevel: number, projection: CharacterProjection): boolean {
  if (option.levelRequired != null && option.levelRequired > ownerClassLevel) return false
  const pre = option.prerequisites
  if (!pre) return true
  if (pre.requiredPactBoon && pre.requiredPactBoon !== (projection.pactBoon ?? null)) return false
  if (pre.requiredSpellName && !(projection.knownSpellNames ?? []).includes(pre.requiredSpellName)) return false
  if (pre.requiredInvocationName && !(projection.knownInvocationNames ?? []).includes(pre.requiredInvocationName)) return false
  if (pre.minAbilityScore) {
    const scores = projection.abilityScores ?? {}
    const meets = pre.minAbilityScore.abilities.some(a => (scores[a] ?? 0) >= pre.minAbilityScore!.score)
    if (!meets) return false
  }
  if (pre.requiredArmorProficiency && !(projection.armorProficiencies ?? []).includes(pre.requiredArmorProficiency)) return false
  if (pre.requiresSpellcasting && !projection.hasSpellcasting) return false
  return true
}

// ⚠️ Multiclasse : le `count` s'évalue au niveau de la classe PROPRIÉTAIRE, pas au niveau total
// (Occultiste 5 / Guerrier 3 → table de niveau 5).
export function resolveChoices(projection: CharacterProjection, catalog: Catalog): { choices: ResolvedChoice[] } {
  const classLevels = projection.classLevels
  const totalLevel = Object.values(classLevels).reduce((sum, l) => sum + l, 0)
  const profBonus = proficiencyBonus(totalLevel)
  const mods = projection.abilityModifiers ?? {}
  const picks = projection.picks ?? []
  const proficientSkills = projection.proficientSkills ?? []
  const proficientWeapons = projection.proficientWeapons ?? []
  const subclassIds = projection.subclassIds ?? []

  const choices: ResolvedChoice[] = []

  for (const p of catalog.progressions) {
    // Choix d'espèce (lignée) : gaté sur la possession ; `count` évalué au niveau total faute de niveau de classe.
    let ownerLevel: number
    if (p.ownerSpeciesId != null) {
      if (projection.speciesId !== p.ownerSpeciesId) continue
      ownerLevel = totalLevel
    }
    else {
      ownerLevel = classLevels[p.ownerClassId!] ?? 0
    }
    if (ownerLevel < p.ownerLevelRequired) continue
    if (p.ownerSubclassId != null && !subclassIds.includes(p.ownerSubclassId)) continue

    const ctx: FormulaContext = {
      level: totalLevel,
      class_level: ownerLevel,
      prof_bonus: profBonus,
      str_mod: mods.str ?? 0,
      dex_mod: mods.dex ?? 0,
      con_mod: mods.con ?? 0,
      int_mod: mods.int ?? 0,
      wis_mod: mods.wis ?? 0,
      cha_mod: mods.cha ?? 0,
    }
    const count = evaluate(p.count, ctx)
    if (count <= 0) continue

    const made = picks.filter(x => x.progressionId === p.progressionId).length
    const remaining = Math.max(0, count - made)

    const rawOptions = p.optionSource.type === 'proficient_skills'
      ? proficientSkills.map(skill => ({ value: skill }))
      : p.optionSource.type === 'proficient_weapons'
        ? proficientWeapons.map(weapon => ({ value: weapon }))
        : (p.options ?? [])
    const options = rawOptions.filter(o => isOptionEligible(o, ownerLevel, projection))

    choices.push({
      progressionId: p.progressionId,
      ownerFeatureId: p.ownerFeatureId,
      ownerClassId: p.ownerClassId,
      ownerSpeciesId: p.ownerSpeciesId,
      ownerSubclassId: p.ownerSubclassId,
      ownerLevelRequired: p.ownerLevelRequired,
      kind: p.kind,
      classLevel: ownerLevel,
      count,
      made,
      remaining,
      replaceable: p.replaceable,
      optionSource: p.optionSource,
      options,
    })
  }

  return { choices }
}

// Les choix `replaceable` déjà complets ne sont pas « dus ».
export function dueChoices(result: { choices: ResolvedChoice[] }): ResolvedChoice[] {
  return result.choices.filter(c => c.remaining > 0)
}
