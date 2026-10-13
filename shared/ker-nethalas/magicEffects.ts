import type { KnConditionKey } from './catalog/conditions'
import type { KnCreatureType } from './catalog/creatureTypes'
import type { KnDamageType } from './catalog/damageTypes'
import type { KnDice } from './diceSchema'
import type { KnActiveSource, KnEffect, KnReminder } from './effects'
import type { KnItem } from './inventory'
import type { KnMagicMech, KnMagicProperty } from './magicSchema'
import type { KnUseLimit } from './status'

// Un objet magique n'agit que porté (ou tenu) : dans le sac ou à la Ceinture, il n'est qu'un objet.
export const knIsWorn = (item: Pick<KnItem, 'place'>): boolean => item.place !== 'bag' && item.place !== 'quick'

interface Active {
  item: KnItem
  property: KnMagicProperty
  index: number
  mech: KnMagicMech
}

// Les mécaniques des propriétés des objets magiques harmonisés qu'on porte. Une compétence à choisir remplace les cibles de la
// propriété ; tant qu'elle n'est pas choisie, la propriété n'agit pas.
function activeMechs(items: readonly KnItem[]): Active[] {
  return items.filter(item => item.magic?.identified && knIsWorn(item)).flatMap(item =>
    item.magic!.properties.flatMap((property, index) =>
      property.mech.flatMap<Active>((mech) => {
        if (!property.choose || mech.k !== 'modifier') return [{ item, property, index, mech }]
        return property.choice ? [{ item, property, index, mech: { ...mech, targets: [property.choice] } }] : []
      }),
    ),
  )
}

const effectOf = (mech: KnMagicMech): KnEffect | undefined => {
  if (mech.k === 'modifier' && mech.targets.length) return { type: 'modifier', targets: mech.targets, amount: mech.amount }
  if (mech.k === 'advantage') return { type: 'advantage', targets: mech.targets }
  if (mech.k === 'maxVital') return { type: 'maxVitalDelta', vital: mech.vital, amount: mech.amount }
  return undefined
}

// Ce que les objets magiques portés ajoutent à la fiche : modificateurs, Avantages et jauges ; et en rappel, le texte de chaque
// propriété qui ne change aucun chiffre ni ne se joue par bouton.
export function knMagicSources(items: readonly KnItem[]): KnActiveSource[] {
  return items.filter(item => item.magic?.identified && knIsWorn(item)).flatMap((item) => {
    const effects = activeMechs([item]).flatMap(({ mech }) => effectOf(mech) ?? [])
    const reminders = item.magic!.properties
      .filter(property => property.mech.length === 0)
      .map<KnReminder>(property => ({ label: { text: `${item.name} : ${property.text}` }, severity: 'info' }))
    return effects.length || reminders.length
      ? [{ id: `magic:${item.id}`, label: { text: item.name }, effects, reminders }]
      : []
  })
}

const sum = (items: readonly KnItem[], pick: (mech: KnMagicMech) => number): number =>
  activeMechs(items).reduce((total, { mech }) => total + pick(mech), 0)

export const knMagicCarryBonus = (items: readonly KnItem[]): number => sum(items, mech => mech.k === 'carry' ? mech.amount : 0)

export const knMagicProvidesLight = (items: readonly KnItem[]): boolean => activeMechs(items).some(({ mech }) => mech.k === 'light')

export const knMagicInitiative = (items: readonly KnItem[]): number => sum(items, mech => mech.k === 'initiative' ? mech.amount : 0)

// Un bonus de parade (le bouclier d'une Relique) vaut pour toute parade.
export const knMagicParry = (items: readonly KnItem[]): number => sum(items, mech => mech.k === 'parry' ? mech.amount : 0)

// Une pierre qui identifie les potions sans test : il suffit de la posséder, dans le sac comme sur soi.
export const knMagicIdentifiesPotions = (items: readonly KnItem[]): boolean =>
  items.some(item => item.magic?.identified && item.magic.properties.some(property => property.mech.some(mech => mech.k === 'identify')))

export type KnPermanentGain = Extract<KnMagicMech, { k: 'permanent' | 'permanentResist' }>

// Un objet à consommer qui augmente à jamais une jauge ou une Résistance.
export const knPermanentGains = (item: Pick<KnItem, 'magic'>): KnPermanentGain[] =>
  (item.magic?.identified ? item.magic.properties : []).flatMap(property =>
    property.mech.filter((mech): mech is KnPermanentGain => mech.k === 'permanent' || mech.k === 'permanentResist'))

// Une pièce d'armure qui en protège mieux une autre : les vambraces ou les jambières portées gagnent de l'Armure.
export const knMagicArmorBonus = (items: readonly KnItem[], piece: 'vambraces' | 'greaves'): number =>
  sum(items, mech => mech.k === 'armor' && mech.piece === piece ? mech.amount : 0)

export interface KnMagicDefenses {
  resistant: KnDamageType[]
  reduction: Partial<Record<KnDamageType, number>>
  immune: KnConditionKey[]
}

// Ce que l'équipement porté accorde contre les dégâts et les états : deux Résistances au même type ne se cumulent pas, deux
// réductions oui.
export function knMagicDefenses(items: readonly KnItem[]): KnMagicDefenses {
  const defenses: KnMagicDefenses = { resistant: [], reduction: {}, immune: [] }
  for (const { mech } of activeMechs(items)) {
    if (mech.k === 'resist' && !defenses.resistant.includes(mech.damage)) defenses.resistant.push(mech.damage)
    if (mech.k === 'reduce') defenses.reduction[mech.damage] = (defenses.reduction[mech.damage] ?? 0) + mech.amount
    if (mech.k === 'immune' && !defenses.immune.includes(mech.condition)) defenses.immune.push(mech.condition)
  }
  return defenses
}

export interface KnMagicAttack {
  // Des dés et des bonus à ajouter à la Réserve de dégâts, avec le type de dégâts de ceux qui en ont un.
  dice: { dice: KnDice, type?: KnDamageType }[]
  speed: number
  vs: { enemy: KnCreatureType, amount: number }[]
}

// Ce que les objets magiques ajoutent à une attaque : ceux de l'arme qu'on manie, et ceux des autres objets portés (des gants
// qui ajoutent +1 dégât).
export function knMagicAttack(items: readonly KnItem[], weaponId: string | null): KnMagicAttack {
  const attack: KnMagicAttack = { dice: [], speed: 0, vs: [] }
  for (const { item, mech } of activeMechs(items)) {
    const ownedByAnother = item.kind === 'weapon' && item.id !== weaponId
    const needsWeapon = item.kind !== 'weapon' && weaponId === null
    if (ownedByAnother || (needsWeapon && mech.k === 'damage')) continue
    if (mech.k === 'damage') attack.dice.push({ dice: mech.dice, ...(mech.type ? { type: mech.type } : {}) })
    if (mech.k === 'damageVs') attack.vs.push({ enemy: mech.enemy, amount: mech.amount })
    if (mech.k === 'speed' && item.id === weaponId) attack.speed += mech.amount
  }
  return attack
}

export interface KnMagicUse {
  // La clé de `status.used` : l'objet et le rang de la propriété (de 1 à 4).
  key: string
  itemId: string
  itemName: string
  label: string
  limit: KnUseLimit
  heal?: KnDice
  self: boolean
}

// Les usages limités des propriétés des objets magiques portés.
export function knMagicUses(items: readonly KnItem[]): KnMagicUse[] {
  return activeMechs(items).flatMap<KnMagicUse>(({ item, index, mech }) =>
    mech.k === 'use'
      ? [{ key: `${item.id}:${index + 1}`, itemId: item.id, itemName: item.name, label: mech.label, limit: mech.limit, ...(mech.heal ? { heal: mech.heal } : {}), self: !!mech.self }]
      : [],
  )
}

// Les propriétés d'un objet qui ne sont pas encore actives parce que le joueur doit d'abord choisir une compétence.
export const knMagicPendingChoices = (item: Pick<KnItem, 'magic'>): number[] =>
  (item.magic?.properties ?? []).flatMap((property, index) => property.choose && !property.choice ? [index] : [])
