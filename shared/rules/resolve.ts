import { evaluate, type Formula, type FormulaContext } from '../utils/formula'
import type { ChoiceKind, OptionSource } from './choices'
import type { SkillKey } from './skills'
import type { AbilityKey } from './abilities'

/**
 * `resolve()` — volet CHOIX (cf. rules-engine.md §5, decisions.md D8/D10).
 *
 * Fonction **pure et partagée** : lue par le serveur (autorité + validation, lot 5d) et
 * par le client (UX, point 6). Elle prend une PROJECTION du personnage et le CATALOGUE
 * (statique, cachable au edge — construit côté serveur au lot 5b) et rend, pour chaque
 * point de choix applicable au niveau courant : combien de picks sont dus, et parmi quelles
 * options. La couche « valeurs dérivées » (emplacements de sorts, PV) viendra au lot 5d ;
 * ce module se limite aux choix (« choix dus » + « options résolues »).
 *
 * ⚠️ Contrat de testabilité (cf. instructions du chantier) : ce module doit être importable
 * par le projet vitest `unit` (environnement node, SANS alias `~~`). Il n'importe donc AUCUNE
 * valeur en `~~/…` ni `hub:db` — seulement `evaluate` en RELATIF (`../utils/formula`) et des
 * types (effacés au runtime). Pas de DB, pas d'accès réseau : tout ce qui touche la base est
 * pré-résolu dans le `Catalog` par l'appelant.
 *
 * Les deux couches de rules-engine.md §5 se retrouvent dans les entrées :
 *  - le CATALOGUE porte les options des sources cachables (feature_group/subclasses/spells/
 *    enum/feats), pré-résolues sans l'état du perso ;
 *  - la PROJECTION porte ce qui dépend du perso — dont `proficient_skills`, résolu ici même
 *    (non cachable, cf. §5).
 */

/**
 * Une option résolue d'un point de choix : au plus une référence renseignée, calquée sur les
 * colonnes `selected_*` de `character_choices` (D5). Le front en sélectionne une ; le lot 5d
 * écrira la colonne FK correspondante.
 */
export interface ResolvedOption {
  featureId?: number // feature_group : pacte / invocation / style / métamagie / manœuvre / don
  subclassId?: number // subclasses
  spellId?: number // spells
  value?: string // enum / skills / languages / tools (valeur typée sans table)
}

/**
 * Un point de choix du CATALOGUE, déjà rattaché à sa classe propriétaire et — pour les
 * sources cachables — à son ensemble d'options pré-résolu. Produit par le loader (lot 5b) ;
 * en test, fourni par une fixture.
 */
export interface CatalogProgression {
  progressionId: number
  /** Feature propriétaire (owner, D4) — métadonnée utile en aval ; non requise par la résolution. */
  ownerFeatureId?: number
  /** Classe qui possède le point de choix : c'est SON niveau qui pilote le gating et le `count`. */
  ownerClassId: number
  /** Niveau (dans la classe propriétaire) auquel le point de choix se débloque. */
  ownerLevelRequired: number
  kind: ChoiceKind
  count: Formula
  optionSource: OptionSource
  replaceable: boolean
  /**
   * Options pré-résolues des sources cachables. Absent pour `optionSource:{proficient_skills}`,
   * qui se résout ici contre la projection (non cachable).
   */
  options?: ResolvedOption[]
}

export interface Catalog {
  progressions: CatalogProgression[]
}

/**
 * Projection minimale du personnage nécessaire à la résolution des choix. Volontairement
 * réduite : `resolveChoices` ne lit rien d'autre, ce qui la garde pure et facile à fixturer.
 */
export interface CharacterProjection {
  /** Niveau du perso dans chaque classe (id → niveau). En multiclasse, plusieurs entrées. */
  classLevels: Record<number, number>
  /** Compétences dont le perso a déjà la maîtrise — sert à `optionSource:{proficient_skills}`. */
  proficientSkills?: SkillKey[]
  /** Picks déjà enregistrés (`character_choices`) — sert à calculer `made`/`remaining`. */
  picks?: Array<{ progressionId: number }>
  /**
   * Modificateurs de caractéristique, pour les rares `count` qui en dépendent. Défaut 0 :
   * les `count` usuels (`fixed`, `lookup`) n'en ont pas besoin.
   */
  abilityModifiers?: Partial<Record<AbilityKey, number>>
}

/**
 * Un point de choix résolu pour un personnage donné : combien il doit choisir (`count`),
 * combien il a déjà choisi (`made`), combien il reste (`remaining`), et parmi quelles
 * `options`. Un choix est DÛ quand `remaining > 0` (cf. {@link dueChoices}).
 */
export interface ResolvedChoice {
  progressionId: number
  ownerFeatureId?: number
  ownerClassId: number
  ownerLevelRequired: number
  kind: ChoiceKind
  /** Niveau de la classe PROPRIÉTAIRE ayant servi au `count` (≠ niveau total en multiclasse). */
  classLevel: number
  count: number
  made: number
  remaining: number
  replaceable: boolean
  optionSource: OptionSource
  options: ResolvedOption[]
}

/** Bonus de maîtrise D&D 5e à partir du niveau total (2 aux niv. 1-4, +1 tous les 4 niveaux). */
function proficiencyBonus(totalLevel: number): number {
  return 2 + Math.floor((Math.max(1, totalLevel) - 1) / 4)
}

/**
 * Résout, pour un personnage, l'ensemble des points de choix du catalogue qui lui sont
 * APPLICABLES (classe propriétaire présente et de niveau suffisant, `count > 0`). Chaque
 * entrée porte `remaining` (choix restant à faire) et ses `options`.
 *
 * ⚠️ Multiclasse : le `count` d'un point de choix est évalué avec le niveau de la classe
 * PROPRIÉTAIRE (`ownerClassId`), pas le niveau total ni celui de la classe principale
 * (rules-engine.md §4). C'est ce qui distingue un Occultiste 5 / Guerrier 3 (5 invocations
 * pour la table de niveau 5) d'un Occultiste 8 (6 invocations).
 */
export function resolveChoices(projection: CharacterProjection, catalog: Catalog): { choices: ResolvedChoice[] } {
  const classLevels = projection.classLevels
  const totalLevel = Object.values(classLevels).reduce((sum, l) => sum + l, 0)
  const profBonus = proficiencyBonus(totalLevel)
  const mods = projection.abilityModifiers ?? {}
  const picks = projection.picks ?? []
  const proficientSkills = projection.proficientSkills ?? []

  const choices: ResolvedChoice[] = []

  for (const p of catalog.progressions) {
    const classLevel = classLevels[p.ownerClassId] ?? 0
    // Gating : le perso doit posséder la classe propriétaire à un niveau suffisant.
    if (classLevel < p.ownerLevelRequired) continue

    const ctx: FormulaContext = {
      level: totalLevel,
      class_level: classLevel,
      prof_bonus: profBonus,
      str_mod: mods.str ?? 0,
      dex_mod: mods.dex ?? 0,
      con_mod: mods.con ?? 0,
      int_mod: mods.int ?? 0,
      wis_mod: mods.wis ?? 0,
      cha_mod: mods.cha ?? 0,
    }
    const count = evaluate(p.count, ctx)
    // Un point de choix qui n'offre aucun pick à ce niveau n'est pas applicable (ex. une
    // table `lookup` retombée à 0 malgré le gating).
    if (count <= 0) continue

    const made = picks.filter(x => x.progressionId === p.progressionId).length
    const remaining = Math.max(0, count - made)

    const options = p.optionSource.type === 'proficient_skills'
      ? proficientSkills.map(skill => ({ value: skill }))
      : (p.options ?? [])

    choices.push({
      progressionId: p.progressionId,
      ownerFeatureId: p.ownerFeatureId,
      ownerClassId: p.ownerClassId,
      ownerLevelRequired: p.ownerLevelRequired,
      kind: p.kind,
      classLevel,
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

/**
 * Filtre les choix RESTANT à faire (`remaining > 0`) — les « choix dus » qui pilotent le
 * wizard (builder / level-up). Les choix `replaceable` déjà complets (invocations à
 * échanger) restent lisibles dans le résultat complet de {@link resolveChoices} via leur
 * drapeau `replaceable` ; ils ne sont pas « dus » au sens strict.
 */
export function dueChoices(result: { choices: ResolvedChoice[] }): ResolvedChoice[] {
  return result.choices.filter(c => c.remaining > 0)
}
