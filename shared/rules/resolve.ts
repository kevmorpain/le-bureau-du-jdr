import { evaluate, type Formula, type FormulaContext } from '../utils/formula'
import type { ChoiceKind, OptionSource } from './choices'
import type { SkillKey } from './skills'
import type { AbilityKey } from './abilities'
import type { FeaturePrerequisite } from '../../server/db/schema/features'

/**
 * `resolve()` — volet CHOIX (cf. rules-engine.md §5, decisions.md D8/D10).
 *
 * Fonction **pure et partagée** : lue par le serveur (autorité + validation, lot 5d) et
 * par le client (UX, point 6). Elle prend une PROJECTION du personnage et le CATALOGUE
 * (statique, cachable au edge — construit côté serveur au lot 5b) et rend, pour chaque
 * point de choix applicable au niveau courant : combien de picks sont dus, et parmi quelles
 * options ÉLIGIBLES. La couche « valeurs dérivées » (emplacements de sorts, PV) viendra au
 * lot 5d ; ce module se limite aux choix (« choix dus » + « options résolues »).
 *
 * ⚠️ Contrat de testabilité (cf. instructions du chantier) : ce module doit être importable
 * par le projet vitest `unit` (environnement node, SANS alias `~~`). Il n'importe donc AUCUNE
 * valeur en `~~/…` ni `hub:db` — seulement `evaluate` en RELATIF (`../utils/formula`) et des
 * types (effacés au runtime). Pas de DB, pas d'accès réseau : tout ce qui touche la base est
 * pré-résolu dans le `Catalog` par l'appelant.
 *
 * Les deux couches de rules-engine.md §5 se retrouvent dans les entrées :
 *  - le CATALOGUE porte les options des sources cachables (feature_group/subclasses/spells/
 *    enum/feats), pré-résolues sans l'état du perso, chacune avec ses prérequis ;
 *  - la PROJECTION porte ce qui dépend du perso — dont `proficient_skills` ET l'ÉLIGIBILITÉ
 *    des options (résolus ici même, non cachables, cf. §5).
 *
 * ✅ Éligibilité par option & owner sous-classe : TRAITÉS au lot 5b — `resolveChoices` filtre
 * les options via `isOptionEligible` (prérequis + `levelRequired` propre à l'option, dépendant
 * de l'état du perso), et le gating prend en compte `ownerSubclassId`.
 *
 * ⚠️ LIMITE RESTANTE : les **choix composites** à `payload` (triade de caractéristiques d'un
 * historique 5.5 `ability_scores`, branche `asi_or_feat`) ne sont pas couverts par le modèle
 * « choisir N dans une liste » ; extension de contrat quand ces `kind` seront seedés (Phase 2).
 */

/**
 * Une option résolue d'un point de choix : au plus une référence renseignée, calquée sur les
 * colonnes `selected_*` de `character_choices` (D5). Le front en sélectionne une ; le lot 5d
 * écrira la colonne FK correspondante.
 */
export interface ResolvedOption {
  featureId?: number // feature_group : pacte / invocation / style / métamagie / manœuvre / don
  subclassId?: number // subclasses
  lineageId?: number // lineages : sous-race 2014 / lignée 2024 (D17)
  spellId?: number // spells
  value?: string // enum / skills / languages / tools (valeur typée sans table)
  /**
   * Prérequis de SÉLECTION de l'option (invocations, dons). Porté par le catalogue (lot 5b) et
   * consommé par {@link isOptionEligible}. `null`/absent = pas de prérequis.
   */
  prerequisites?: FeaturePrerequisite | null
  /**
   * Niveau MINIMAL (dans la classe propriétaire) requis pour choisir cette option — ex. une
   * invocation « niv. 5+ ». Comparé au niveau de la classe propriétaire, pas au niveau total.
   */
  levelRequired?: number
}

/**
 * Un point de choix du CATALOGUE, déjà rattaché à sa classe (ou sous-classe) propriétaire et —
 * pour les sources cachables — à son ensemble d'options pré-résolu. Produit par le loader
 * (lot 5b) ; en test, fourni par une fixture.
 */
export interface CatalogProgression {
  progressionId: number
  /** Feature propriétaire (owner, D4) — métadonnée utile en aval ; non requise par la résolution. */
  ownerFeatureId?: number
  /**
   * Owner du point de choix — EXACTEMENT un de `ownerClassId` / `ownerSpeciesId` est renseigné
   * (cf. D17). Une CLASSE possède la plupart des points de choix (sous-classe, invocations…) :
   * c'est SON niveau qui pilote le gating et le `count`. Une ESPÈCE possède le choix de lignée,
   * gaté sur la POSSESSION de l'espèce (pas un niveau de classe), disponible dès la création.
   */
  ownerClassId?: number
  /** Espèce propriétaire (choix de lignée, D17). Exclusif avec `ownerClassId`. */
  ownerSpeciesId?: number
  /**
   * Si le point de choix est possédé par une SOUS-CLASSE (feature de sous-classe), son id : le
   * gating exige alors de POSSÉDER cette sous-classe en plus du niveau de classe requis.
   * Absent pour un choix possédé au niveau de la classe (cas de l'Occultiste).
   */
  ownerSubclassId?: number
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
  /** Espèce du personnage — gating des points de choix possédés par une espèce (lignée, D17). */
  speciesId?: number
  /** Sous-classes possédées — gating des points de choix possédés par une sous-classe. */
  subclassIds?: number[]
  /** Compétences dont le perso a déjà la maîtrise — sert à `optionSource:{proficient_skills}`. */
  proficientSkills?: SkillKey[]
  /** Picks déjà enregistrés (`character_choices`) — sert à calculer `made`/`remaining`. */
  picks?: Array<{ progressionId: number }>
  /**
   * Modificateurs de caractéristique, pour les rares `count` qui en dépendent. Défaut 0 :
   * les `count` usuels (`fixed`, `lookup`) n'en ont pas besoin.
   */
  abilityModifiers?: Partial<Record<AbilityKey, number>>
  // ─── État d'ÉLIGIBILITÉ des options (cf. isOptionEligible / rules-engine.md §5) ───────────
  /** Faveur de pacte choisie (prérequis d'invocation `requiredPactBoon`). */
  pactBoon?: 'chain' | 'blade' | 'tome' | null
  /** Noms des sorts connus (prérequis d'invocation `requiredSpellName`). */
  knownSpellNames?: string[]
  /** Noms des invocations connues (prérequis d'invocation `requiredInvocationName`). */
  knownInvocationNames?: string[]
  /** Scores de caractéristique finaux (prérequis de don `minAbilityScore`). */
  abilityScores?: Partial<Record<AbilityKey, number>>
  /** Catégories de maîtrise d'armure (prérequis de don `requiredArmorProficiency`). */
  armorProficiencies?: Array<'light' | 'medium' | 'heavy'>
  /** Le perso lance-t-il au moins un sort ? (prérequis de don `requiresSpellcasting`). */
  hasSpellcasting?: boolean
}

/**
 * Un point de choix résolu pour un personnage donné : combien il doit choisir (`count`),
 * combien il a déjà choisi (`made`), combien il reste (`remaining`), et parmi quelles
 * `options` ÉLIGIBLES. Un choix est DÛ quand `remaining > 0` (cf. {@link dueChoices}).
 */
export interface ResolvedChoice {
  progressionId: number
  ownerFeatureId?: number
  /** Owner du point de choix (exactement un renseigné, cf. CatalogProgression). */
  ownerClassId?: number
  ownerSpeciesId?: number
  ownerSubclassId?: number
  ownerLevelRequired: number
  kind: ChoiceKind
  /**
   * Niveau de l'OWNER ayant servi au `count` et au gating : niveau de la classe propriétaire
   * (≠ niveau total en multiclasse) pour un choix de classe ; niveau total pour un choix
   * d'espèce (lignée), qui n'a pas de niveau de classe.
   */
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
 * Une option est-elle SÉLECTIONNABLE par ce personnage ? Filtre d'éligibilité PUR
 * (rules-engine.md §5) : dépend de l'état du perso (pacte, sorts/invocations connus,
 * caractéristiques, maîtrises), donc NON cachable — il vit ici, pas dans le catalogue.
 * Calqué sur `InvocationPicker.vue` `isSelectable()` (invocations) et étendu aux prérequis de
 * dons (`minAbilityScore` / `requiredArmorProficiency` / `requiresSpellcasting`).
 *
 * `ownerClassLevel` = niveau de la classe propriétaire, pour comparer le `levelRequired` propre
 * à l'option (une invocation « niv. 5+ » = niveau d'occultiste 5, pas le niveau total).
 */
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

/**
 * Résout, pour un personnage, l'ensemble des points de choix du catalogue qui lui sont
 * APPLICABLES (classe — et sous-classe — propriétaire présente et de niveau suffisant,
 * `count > 0`). Chaque entrée porte `remaining` (choix restant à faire) et ses `options`
 * ÉLIGIBLES (filtrées par {@link isOptionEligible}).
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
  const subclassIds = projection.subclassIds ?? []

  const choices: ResolvedChoice[] = []

  for (const p of catalog.progressions) {
    // Owner du point de choix (D17) : une CLASSE (son niveau pilote gating + `count`) ou une
    // ESPÈCE (choix de lignée — gaté sur la POSSESSION de l'espèce ; le `count`, un `fixed`,
    // s'évalue au niveau total faute de niveau de classe). Exactement un des deux est renseigné.
    let ownerLevel: number
    if (p.ownerSpeciesId != null) {
      if (projection.speciesId !== p.ownerSpeciesId) continue
      ownerLevel = totalLevel
    }
    else {
      ownerLevel = classLevels[p.ownerClassId!] ?? 0
    }
    // Gating : l'owner doit être possédé à un niveau suffisant…
    if (ownerLevel < p.ownerLevelRequired) continue
    // …et, si le point de choix est possédé par une sous-classe, posséder cette sous-classe.
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
    // Un point de choix qui n'offre aucun pick à ce niveau n'est pas applicable (ex. une
    // table `lookup` retombée à 0 malgré le gating).
    if (count <= 0) continue

    const made = picks.filter(x => x.progressionId === p.progressionId).length
    const remaining = Math.max(0, count - made)

    const rawOptions = p.optionSource.type === 'proficient_skills'
      ? proficientSkills.map(skill => ({ value: skill }))
      : (p.options ?? [])
    // Ne garder que les options que le perso peut réellement choisir (prérequis + niveau).
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

/**
 * Filtre les choix RESTANT à faire (`remaining > 0`) — les « choix dus » qui pilotent le
 * wizard (builder / level-up). Les choix `replaceable` déjà complets (invocations à
 * échanger) restent lisibles dans le résultat complet de {@link resolveChoices} via leur
 * drapeau `replaceable` ; ils ne sont pas « dus » au sens strict.
 */
export function dueChoices(result: { choices: ResolvedChoice[] }): ResolvedChoice[] {
  return result.choices.filter(c => c.remaining > 0)
}
