import { evaluate, type Formula, type FormulaContext } from '../utils/formula'
import { PICK_CHOICE_KINDS, type ChoiceKind, type OptionSource } from './choices'
import type { SkillKey } from './skills'
import type { AbilityKey } from './abilities'
import type { FeaturePrerequisite } from '../../server/db/schema/features'

// Pur et partagé client/serveur. Doit rester importable par le projet vitest `unit` (sans alias `~~`) :
// aucun import de valeur `~~/…`, la base est pré-résolue dans le `Catalog` par l'appelant.

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

// Porteur de maîtrises d'une classe qui porte le choix : celui de la 1re classe (`start`) ou celui reçu en
// rejoignant la classe par multiclassage (`multiclass`).
export type ClassGrant = 'start' | 'multiclass'

// Propriétaire d'un point de choix : au plus un de classe (précisée par `ownerSubclassId` / `classGrant`),
// espèce, lignée ou historique. Aucun pour une règle générale (`global`), due à tout personnage.
export interface ProgressionOwner {
  ownerFeatureId?: number
  ownerClassId?: number
  ownerSpeciesId?: number
  ownerLineageId?: number
  ownerBackgroundId?: number
  ownerSubclassId?: number
  classGrant?: ClassGrant
  global?: boolean
}

/** Ce qu'un pick enregistre pour cette option : l'id d'un sort, sinon la valeur (compétence, outil, langue…). */
export const optionPickValue = (o: ResolvedOption): string | number | undefined => o.spellId ?? o.value

export interface CatalogProgression extends ProgressionOwner {
  progressionId: number
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
  /** Absent : chaque classe est traitée comme la 1re (création, une seule classe). */
  mainClassId?: number
  speciesId?: number
  lineageId?: number
  backgroundId?: number
  subclassIds?: number[]
  /** Maîtrises reçues en double de deux sources fixes, à remplacer (cf. `duplicateGrants`). */
  duplicates?: { skills: number, tools: number }
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

export interface ResolvedChoice extends ProgressionOwner {
  progressionId: number
  ownerLevelRequired: number
  kind: ChoiceKind
  /** Niveau de la classe propriétaire (≠ niveau total en multiclasse) ; niveau total (au moins 1) sinon. */
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
    let ownerLevel: number
    if (p.ownerClassId != null) {
      const isMain = projection.mainClassId == null || projection.mainClassId === p.ownerClassId
      if (p.classGrant === 'start' && !isMain) continue
      if (p.classGrant === 'multiclass' && isMain) continue
      ownerLevel = classLevels[p.ownerClassId] ?? 0
    }
    else {
      if (p.ownerSpeciesId != null && projection.speciesId !== p.ownerSpeciesId) continue
      if (p.ownerLineageId != null && projection.lineageId !== p.ownerLineageId) continue
      if (p.ownerBackgroundId != null && projection.backgroundId !== p.ownerBackgroundId) continue
      // Acquis dès la création, sans classe propriétaire : niveau total, au moins 1 (builder avant la classe).
      ownerLevel = Math.max(1, totalLevel)
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
      duplicate_skills: projection.duplicates?.skills ?? 0,
      duplicate_tools: projection.duplicates?.tools ?? 0,
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
      ownerLineageId: p.ownerLineageId,
      ownerBackgroundId: p.ownerBackgroundId,
      ownerSubclassId: p.ownerSubclassId,
      classGrant: p.classGrant,
      global: p.global,
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

// Choix de maîtrise, de sort mineur ou de libellé (terrain) passant par le chemin générique des picks. Les
// compétences de classe ont leur propre étape (création) et leur propre règle de multiclassage
// (`multiclassSkillGrant`).
export function isPickChoice(c: ResolvedChoice): boolean {
  return PICK_CHOICE_KINDS.includes(c.kind) && !(c.kind === 'skill' && c.ownerClassId != null)
}

// Points de choix d'une classe devenus dus en la passant de `fromLevel` à `toLevel` (level-up). Une classe
// rejointe (`fromLevel` 0, autre que `mainClassId`) reçoit ceux de son porteur de multiclassage. Les choix d'une
// sous-classe ne se résolvent qu'une fois la sous-classe connue : celle d'avant le level-up pour l'état de départ,
// celle d'après (peut-être choisie à ce niveau) pour l'état d'arrivée.
export function choicesGainedAtLevelUp(
  catalog: Catalog,
  { classId, fromLevel, toLevel, mainClassId, subclassIdsBefore = [], subclassIdsAfter = [] }: {
    classId: number
    fromLevel: number
    toLevel: number
    mainClassId: number
    subclassIdsBefore?: number[]
    subclassIdsAfter?: number[]
  },
): ResolvedChoice[] {
  const at = (level: number, subclassIds: number[]) =>
    level > 0 ? resolveChoices({ classLevels: { [classId]: level }, mainClassId, subclassIds }, catalog).choices : []
  const before = new Set(at(fromLevel, subclassIdsBefore).map(c => c.progressionId))
  return at(toLevel, subclassIdsAfter).filter(c => c.ownerClassId === classId && !before.has(c.progressionId))
}
