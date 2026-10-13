import type { KnSurvivorArmorZone } from './combat'
import type { KnDamageType } from './catalog/damageTypes'
import type { KnActiveSource, KnEffect } from './effects'
import { knIntegrityDown, KN_INTEGRITY_DICE, type KnItem, type KnIntegrityDie } from './inventory'
import { knMagicArmorBonus, knMagicAttack, knMagicInitiative, type KnMagicAttack } from './magicEffects'
import { knRollDie, type KnRng } from './run'
import type { KnSkillKey } from './skills'

// Le type de pièce qui protège chaque zone du survivant.
const ZONE_KINDS = { head: 'helmet', torso: 'torso', arms: 'vambraces', legs: 'greaves' } as const satisfies Record<KnSurvivorArmorZone, KnItem['kind']>

export const knArmorPieces = (items: readonly KnItem[], zone: KnSurvivorArmorZone): KnItem[] =>
  items.filter(item => item.kind === ZONE_KINDS[zone] && (zone === 'head' ? item.place === 'head' : item.place === 'armor'))

const protectionOf = (pieces: readonly KnItem[], bonus = 0) =>
  pieces.length ? pieces.reduce((sum, item) => sum + (item.protection ?? 0), bonus) : 0

// Des gants ou des bottes magiques améliorent l'Armure des vambraces ou des jambières, quand on en porte.
export const knArmorByZone = (items: readonly KnItem[]): Record<KnSurvivorArmorZone, number> => ({
  head: protectionOf(knArmorPieces(items, 'head')),
  torso: protectionOf(knArmorPieces(items, 'torso')),
  arms: protectionOf(knArmorPieces(items, 'arms'), knMagicArmorBonus(items, 'vambraces')),
  legs: protectionOf(knArmorPieces(items, 'legs'), knMagicArmorBonus(items, 'greaves')),
})

// Une armure lourde gêne les mouvements (Acrobatie, Esquive, Furtivité), un casque la vue (Perception).
export function knEquipmentSources(items: readonly KnItem[]): KnActiveSource[] {
  const worn = items.filter(item => item.place === 'armor' || item.place === 'head')
  const maneuverability = worn.reduce((sum, item) => sum + (item.maneuverability ?? 0), 0)
  const perception = worn.reduce((sum, item) => sum + (item.perception ?? 0), 0)
  const effects: KnEffect[] = [
    ...(maneuverability ? [{ type: 'modifier' as const, targets: ['acrobatics', 'dodge', 'stealth'] as const, amount: -maneuverability }] : []),
    ...(perception ? [{ type: 'modifier' as const, targets: ['perception'] as const, amount: -perception }] : []),
  ]
  return effects.length ? [{ id: 'equipment', label: { key: 'ker_nethalas.sources.equipment' }, effects, reminders: [] }] : []
}

export const knWieldedWeapons = (items: readonly KnItem[]): KnItem[] =>
  items.filter(item => item.weapon && (item.place === 'mainHand' || item.place === 'offHand'))

const traits = (item: KnItem) => item.weapon?.traits ?? []

// La réserve de dégâts d'une arme : D6, et ses bonus (Puissante +1, À deux mains +2, Polyvalente +1 tenue à deux mains).
export function knWeaponPool(item: KnItem, offHandEmpty: boolean): string {
  const bonus = (traits(item).includes('powerful') ? 1 : 0) + (traits(item).includes('twoHanded') ? 2 : 0) + (traits(item).includes('versatile') && offHandEmpty ? 1 : 0)
  return bonus ? `D6+${bonus}` : 'D6'
}

export interface KnAttackOption {
  id: string
  // Le nom de l'arme, ou rien pour les mains nues.
  weapon?: string
  skill: KnSkillKey
  speed: number
  pool: string
  damageType: KnDamageType
  // Bonus à l'attaque (Simple : +10).
  bonus: number
  // Ce que les objets magiques ajoutent : déjà dans la réserve ; à rappeler quand les dés ont un type de dégâts propre, ou que
  // le bonus ne vaut que contre un type d'adversaire.
  magic?: KnMagicAttack
}

export const KN_UNARMED_OPTION: KnAttackOption = { id: 'unarmed', skill: 'unarmedCombat', speed: 0, pool: 'D4', damageType: 'bludgeoning', bonus: 0 }

// La réserve d'une arme, complétée des dés et des bonus que lui donnent les objets magiques.
function withMagicPool(pool: string, magic: KnMagicAttack): string {
  const tokens = magic.dice.map(({ dice }) => dice.count ? `${dice.count > 1 ? dice.count : ''}D${dice.sides}${dice.bonus ? `+${dice.bonus}` : ''}` : String(dice.bonus))
  return [pool, ...tokens].join('+')
}

// Les façons d'attaquer : à mains nues, ou avec chaque arme tenue.
export function knAttackOptions(items: readonly KnItem[]): KnAttackOption[] {
  const offHandEmpty = !items.some(item => item.place === 'offHand')
  return [
    ...knWieldedWeapons(items).map((item) => {
      const magic = knMagicAttack(items, item.id)
      const hasMagic = magic.dice.length || magic.speed || magic.vs.length
      return {
        id: item.id,
        weapon: item.name,
        skill: item.weapon!.skill,
        speed: item.weapon!.speed + magic.speed,
        pool: withMagicPool(knWeaponPool(item, offHandEmpty), magic),
        damageType: item.weapon!.damageType,
        bonus: traits(item).includes('simple') ? 10 : 0,
        ...(hasMagic ? { magic } : {}),
      }
    }),
    KN_UNARMED_OPTION,
  ]
}

// Une arme Rapide donne +10 à l'Initiative, comme certains objets magiques.
export const knInitiativeBonus = (items: readonly KnItem[]): number =>
  (knWieldedWeapons(items).some(item => traits(item).includes('quick')) ? 10 : 0) + knMagicInitiative(items)

export interface KnDefenseOption {
  id: string
  // 'dodge' : l'Esquive ; 'parry' : parade avec une arme tenue, que le bouclier appuie ou non.
  kind: 'dodge' | 'parry'
  skill: KnSkillKey
  weapon?: string
  shield?: string
  bonus: number
  // Les pièces qui servent à cette défense, dont l'Intégrité sera jouée après le combat.
  used: string[]
}

// Se défendre : à l'Esquive, ou à l'arme quand elle Pare ou qu'un bouclier le permet (qui ajoute son bonus de parade, et +10
// pour une arme Défensive).
export function knDefenseOptions(items: readonly KnItem[]): KnDefenseOption[] {
  const shield = items.find(item => item.kind === 'shield' && item.place === 'offHand')
  const parries = knWieldedWeapons(items)
    .filter(item => shield || traits(item).includes('parrying'))
    .map<KnDefenseOption>(item => ({
      id: `parry:${item.id}`,
      kind: 'parry',
      skill: item.weapon!.skill,
      weapon: item.name,
      ...(shield ? { shield: shield.name } : {}),
      bonus: shield ? (shield.parry ?? 0) + (traits(item).includes('defensive') ? 10 : 0) : 0,
      used: shield ? [shield.id] : [],
    }))
  return [{ id: 'dodge', kind: 'dodge', skill: 'dodge', bonus: 0, used: [] }, ...parries]
}

export interface KnIntegrityResult {
  id: string
  name: string
  die: KnIntegrityDie
  roll: number
  outcome: 'held' | 'down' | 'destroyed'
  to?: KnIntegrityDie
}

// Après un combat, l'Intégrité d'une pièce utilisée se joue : 1 ou 2 la fait baisser d'un cran, et au D4 elle est perdue.
export function knRollIntegrity(items: readonly KnItem[], id: string, rng: KnRng = Math.random): { items: KnItem[], result?: KnIntegrityResult } {
  const item = items.find(entry => entry.id === id)
  if (!item?.integrity) return { items: [...items] }
  const { current } = item.integrity
  const roll = knRollDie(current, rng)
  if (roll > 2) return { items: [...items], result: { id, name: item.name, die: current, roll, outcome: 'held' } }
  if (current === KN_INTEGRITY_DICE[0]) {
    return { items: items.filter(entry => entry.id !== id), result: { id, name: item.name, die: current, roll, outcome: 'destroyed' } }
  }
  const to = knIntegrityDown(current)
  return {
    items: items.map(entry => entry.id === id && entry.integrity ? { ...entry, integrity: { ...entry.integrity, current: to } } : entry),
    result: { id, name: item.name, die: current, roll, outcome: 'down', to },
  }
}

// Réparer remonte l'Intégrité d'un cran, sans dépasser son maximum d'origine.
export function knRepairItem(items: readonly KnItem[], id: string): KnItem[] {
  return items.map((item) => {
    if (item.id !== id || !item.integrity) return item
    const { current, max } = item.integrity
    const up = KN_INTEGRITY_DICE[Math.min(KN_INTEGRITY_DICE.indexOf(max), KN_INTEGRITY_DICE.indexOf(current) + 1)]!
    return { ...item, integrity: { max, current: up } }
  })
}
