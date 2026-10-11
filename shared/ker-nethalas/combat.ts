import { KN_CREATURE_TYPE_RULES } from './catalog/creatureTypes'
import { KN_ARMOR_IGNORED, type KnDamageType } from './catalog/damageTypes'
import type { KnHitLocationKey } from './catalog/hitLocations'
import { knCreatureAtLevel, type KnCreature, type KnCreatureAction } from './creatures'
import type { KnDice } from './dice'
import type { KnRollMode } from './resolve'
import type { KnD100Result } from './roll'
import { knRollDie, type KnRng } from './run'

export const KN_ATTACKER_BONUS = 10

// Viser un point faible fait attaquer avec Désavantage.
export function knWithDisadvantage(mode: KnRollMode): KnRollMode {
  return mode === 'normal' || mode === 'disadvantage' ? 'disadvantage' : 'both'
}

export type KnExchangeOutcome = 'hit' | 'defended' | 'bothFail' | 'reroll'

export interface KnExchange {
  outcome: KnExchangeOutcome
  // Une touche faite par un succès critique : les dégâts sont doublés.
  criticalStrike: boolean
  // L'attaquant a fait un échec critique : maladresse.
  fumble: boolean
}

const compare = (a: KnD100Result, b: KnD100Result): 'a' | 'b' | 'tie' => {
  if (a.value !== b.value) return a.value > b.value ? 'a' : 'b'
  if (a.target !== b.target) return a.target > b.target ? 'a' : 'b'
  return 'tie'
}

// Attaque contre défense, jet opposé du livre : un succès bat un échec, un critique bat un succès, un échec critique perd,
// le jet le plus haut gagne entre deux succès. Si les deux échouent, le défenseur subit 1 dégât qu'on ne peut pas éviter.
export function knCombatExchange(attack: KnD100Result, defense: KnD100Result): KnExchange {
  const fumble = attack.critical === 'failure'
  if (!attack.success && !defense.success) return { outcome: 'bothFail', criticalStrike: false, fumble }
  if (fumble) return { outcome: 'defended', criticalStrike: false, fumble }
  if (defense.critical === 'failure') return { outcome: 'hit', criticalStrike: attack.critical === 'success', fumble }

  const attackCrit = attack.critical === 'success'
  const defenseCrit = defense.critical === 'success'
  if (attackCrit && !defenseCrit) return { outcome: 'hit', criticalStrike: true, fumble }
  if (defenseCrit && !attackCrit) return { outcome: 'defended', criticalStrike: false, fumble }
  if (attack.success !== defense.success) {
    return { outcome: attack.success ? 'hit' : 'defended', criticalStrike: false, fumble }
  }

  const winner = compare(attack, defense)
  if (winner === 'tie') return { outcome: 'reroll', criticalStrike: false, fumble }
  return { outcome: winner === 'a' ? 'hit' : 'defended', criticalStrike: winner === 'a' && attackCrit, fumble }
}

export interface KnDamageRoll {
  dice: { sides: number, roll: number }[]
  bonus: number
  // Le dé retenu : le plus haut de la réserve, auquel s'ajoutent tous les bonus fixes.
  picked: number
  total: number
}

export function knRollDamagePool(pool: readonly KnDice[], rng: KnRng = Math.random): KnDamageRoll {
  const dice = pool.flatMap(entry => Array.from({ length: entry.count }, () => ({ sides: entry.sides, roll: knRollDie(entry.sides, rng) })))
  const bonus = pool.reduce((sum, entry) => sum + entry.bonus, 0)
  const picked = dice.reduce((best, die) => Math.max(best, die.roll), 0)
  return { dice, bonus, picked, total: Math.max(0, picked + bonus) }
}

export interface KnDamageTarget {
  vulnerable: readonly KnDamageType[]
  resistant: readonly KnDamageType[]
  restored: readonly KnDamageType[]
  // Résistant à tous les dégâts physiques non magiques.
  resistantPhysical?: boolean
}

const PHYSICAL_DAMAGE: readonly KnDamageType[] = ['bludgeoning', 'piercing', 'slashing']

// Ce qu'une créature subit, selon son type, ses traits et sa fiche. Vulnérable et Résistant à la fois s'annulent.
export function knCreatureDamageTarget(creature: KnCreature): KnDamageTarget {
  const rules = creature.types.map(type => KN_CREATURE_TYPE_RULES[type])
  const affinity = rules.some(rule => rule.restoredByAffinity) && creature.affinity ? [creature.affinity] : []
  return {
    vulnerable: [...rules.flatMap(rule => rule.vulnerable), ...(creature.vulnerable ?? [])],
    resistant: creature.resistant ?? [],
    restored: [...rules.flatMap(rule => rule.restored), ...affinity],
    resistantPhysical: creature.resistantPhysical,
  }
}

export interface KnDamageInput {
  roll: KnDamageRoll
  damageType: KnDamageType
  criticalStrike: boolean
  weakSpot: boolean
  armor: number
  // Pénétrant (X) : points d'Armure ignorés en plus.
  armorIgnored?: number
  target: KnDamageTarget
  // Une attaque magique n'est pas freinée par « Résistant aux dégâts physiques non magiques ».
  magical?: boolean
}

export interface KnDamageResult {
  base: number
  doubled: boolean
  armorAbsorbed: number
  // Dégâts finalement subis, ou 0.
  damage: number
  // Soin quand la cible est Restaurée par ce type de dégâts.
  heal: number
  notes: string[]
}

// Dans l'ordre du livre : la réserve (un dé et les bonus fixes), doublée par un Coup critique ou un point faible (pas
// triplée quand les deux s'ajoutent), l'Armure ensuite sauf ce que le type de dégâts ignore, puis les modificateurs de type.
export function knResolveDamage(input: KnDamageInput): KnDamageResult {
  const notes: string[] = []
  let total = input.roll.total
  const doubled = input.criticalStrike || input.weakSpot
  if (doubled) total *= 2
  if (input.damageType === 'piercing' && input.criticalStrike) {
    total += 2
    notes.push('perforant : +2 sur un Coup critique, non doublé')
  }

  const ignored = KN_ARMOR_IGNORED[input.damageType]
  const effective = ignored === 'all' ? 0 : Math.max(0, input.armor - ignored - (input.armorIgnored ?? 0))
  const armorAbsorbed = Math.min(total, effective)
  total -= armorAbsorbed

  if (input.damageType === 'slashing' && total <= 3) {
    total += 1
    notes.push('tranchant : +1 sous 4 dégâts, après l\'Armure')
  }

  const { target } = input
  if (target.restored.includes(input.damageType)) {
    return { base: input.roll.total, doubled, armorAbsorbed, damage: 0, heal: total, notes: [...notes, 'restaurée par ce type de dégâts'] }
  }

  const physicalResist = target.resistantPhysical && !input.magical && PHYSICAL_DAMAGE.includes(input.damageType)
  const vulnerable = target.vulnerable.includes(input.damageType)
  const resistant = target.resistant.includes(input.damageType) || !!physicalResist
  if (vulnerable && !resistant) {
    total *= 2
    notes.push('vulnérable : dégâts doublés')
  } else if (resistant && !vulnerable) {
    total = Math.ceil(total / 2)
    notes.push('résistante : dégâts divisés par deux, arrondis au supérieur')
  }
  return { base: input.roll.total, doubled, armorAbsorbed, damage: Math.max(0, total), heal: 0, notes }
}

// La réserve de dégâts d'une créature : le dé de l'action et les dés ajoutés par ses paliers de niveau.
export function knActionPool(action: KnCreatureAction, creature: KnCreature, level: number): KnDice[] {
  return action.damage ? [action.damage.dice, ...(action.damage.extra ?? []), ...knCreatureAtLevel(creature, level).damageBonuses] : []
}

// Une action qui se joue sur un test du survivant plutôt que sur un jet d'attaque : Magique, ou sans étiquette mais avec
// des dégâts.
export const knActionIsTest = (action: Pick<KnCreatureAction, 'tag' | 'damage'>) =>
  action.tag === 'magical' || (!action.tag && !!action.damage)

// Les dégâts de l'action sont dus : sur une touche, à l'échec du test, ou toujours.
export function knActionDamageDue(action: Pick<KnCreatureAction, 'tag' | 'damage'>, state: { hit?: boolean, testFailed?: boolean }): boolean {
  if (!action.damage) return false
  if (action.damage.always) return true
  return action.tag === 'physical' ? !!state.hit : !!state.testFailed
}

// Où les coups portent sur le survivant, pour son Armure : le torse protège la poitrine et l'abdomen.
export const KN_SURVIVOR_ARMOR_ZONES = ['head', 'torso', 'arms', 'legs'] as const

export type KnSurvivorArmorZone = (typeof KN_SURVIVOR_ARMOR_ZONES)[number]

export function knSurvivorArmorZone(location: KnHitLocationKey): KnSurvivorArmorZone {
  if (location === 'head') return 'head'
  if (location === 'chest' || location === 'abdomen') return 'torso'
  if (location === 'leftArm' || location === 'rightArm') return 'arms'
  return 'legs'
}

export const KN_PACK_BONUS = 5

// Meute : +5 en Compétence de combat pour chaque autre créature semblable encore en vie dans la pièce.
export const knPackBonus = (creature: KnCreature, aliveSameKind: number) =>
  creature.traits.some(trait => trait.key === 'pack') ? KN_PACK_BONUS * Math.max(0, aliveSameKind - 1) : 0

// Pénétrant (X) : les attaques de la créature ignorent X points d'Armure.
export const knPenetrating = (creature: KnCreature) =>
  creature.traits.reduce((sum, trait) => sum + (trait.key === 'penetrating' ? (trait.value ?? 0) : 0), 0)

const RANK = { critSuccess: 3, success: 2, fail: 1, critFail: 0 } as const

const rankOf = (check: KnD100Result) =>
  check.critical === 'success' ? RANK.critSuccess : check.critical === 'failure' ? RANK.critFail : check.success ? RANK.success : RANK.fail

// Jet opposé hors combat (Initiative, surprise) : un critique bat un succès, qui bat un échec, qui bat un échec critique ;
// à rang égal, le jet le plus haut gagne, puis la compétence la plus haute ; sinon on relance.
export function knOpposedCheck(a: KnD100Result, b: KnD100Result): 'a' | 'b' | 'tie' {
  const rankA = rankOf(a)
  const rankB = rankOf(b)
  if (rankA !== rankB) return rankA > rankB ? 'a' : 'b'
  return compare(a, b)
}
