import type { KnMasteryEntry } from './amulets'
import type { KnProvisionKey } from './camp'
import type { KnConditionKey } from './catalog/conditions'
import type { KnDamageType } from './catalog/damageTypes'
import type { KnPoolEntry } from './combat'
import type { KnItem } from './inventory'
import type { KnAbilityAttack, KnMastery, KnMasteryAbility, KnSelfEffect } from './masteries'
import { knAbilityBlockers, knIsUsedUp, knMarkUsed, knPayAbility, knSustainedKey, type KnAbilityPurse } from './masteryEffects'
import type { KnSkillKey } from './skills'
import type { KnStatus } from './status'

export interface KnAttackAbility {
  // `maîtrise:palier`, la clé d'usage et d'allumage de l'aptitude.
  id: string
  masteryKey: string
  masteryName: string
  ability: KnMasteryAbility
  attack: KnAbilityAttack
}

export const knPoolEntries = (list: KnAbilityAttack['dice']): KnPoolEntry[] =>
  (list ?? []).map(({ dice, type }) => ({ ...dice, ...(type ? { type } : {}) }))

function unlocked(masteries: readonly KnMastery[], entries: readonly KnMasteryEntry[]): KnAttackAbility[] {
  return entries.flatMap((entry) => {
    const mastery = masteries.find(candidate => candidate.key === entry.key)
    return (mastery?.abilities ?? []).flatMap(ability =>
      ability.attack && ability.tier <= entry.tiers
        ? [{ id: knSustainedKey(entry.key, ability.tier), masteryKey: entry.key, masteryName: mastery!.name, ability, attack: ability.attack }]
        : [])
  })
}

// Les aptitudes qui se cochent dans l'attaque qu'on lance : ni Maintenues, ni marques de cible.
export const knAttackAbilities = (masteries: readonly KnMastery[], entries: readonly KnMasteryEntry[]): KnAttackAbility[] =>
  unlocked(masteries, entries).filter(({ ability, attack }) => !ability.sustained && !attack.mark && !attack.afterDodge)

// Les aptitudes Maintenues allumées : elles valent pour toutes les attaques.
export const knSustainedAttackAbilities = (masteries: readonly KnMastery[], entries: readonly KnMasteryEntry[], sustained: readonly string[]): KnAttackAbility[] =>
  unlocked(masteries, entries).filter(({ ability, id }) => ability.sustained && sustained.includes(id))

// Les aptitudes de réaction qui répondent à une défense à l'Esquive réussie.
export const knDodgeAbilities = (masteries: readonly KnMastery[], entries: readonly KnMasteryEntry[]): KnAttackAbility[] =>
  unlocked(masteries, entries).filter(({ attack }) => attack.afterDodge)

export const knMarkAbilities = (masteries: readonly KnMastery[], entries: readonly KnMasteryEntry[]): KnAttackAbility[] =>
  unlocked(masteries, entries).filter(({ attack }) => attack.mark)

// Ce qui empêche d'utiliser l'aptitude dans cette attaque : déjà utilisée (limite atteinte), ou coût qu'on ne peut pas payer.
export function knAttackAbilityBlockers(entry: KnAttackAbility, purse: KnAbilityPurse, status: Pick<KnStatus, 'used'>): string[] {
  if (knIsUsedUp(status, entry.id)) return ['Déjà utilisée']
  return knAbilityBlockers(entry.ability, purse)
}

export interface KnAttackPlan {
  bonus: number
  dice: KnPoolEntry[]
  // Remplace la réserve de l'arme.
  pool?: KnPoolEntry[]
  critical: boolean
  undefendable: boolean
  allTargets: boolean
  followUp?: { dice?: KnPoolEntry[] }
  afterDefense: number
  afterDefenseIfHit: number
  noDamage: boolean
  stripArmor: boolean
  noDefense: boolean
  // Ce que le survivant récupère si cette attaque tue sa cible.
  onKill: KnSelfEffect[]
  // Ce que le mouvement défensif ou une réaction a préparé pour cette attaque.
  advantage: boolean
  freeAim: boolean
}

export const KN_EMPTY_ATTACK_PLAN: KnAttackPlan = { bonus: 0, dice: [], critical: false, undefendable: false, allTargets: false, afterDefense: 0, afterDefenseIfHit: 0, noDamage: false, stripArmor: false, noDefense: false, onKill: [], advantage: false, freeAim: false }

// Ce que les aptitudes choisies ajoutent à l'attaque : les bonus s'additionnent, les dés se joignent à la réserve.
export function knAttackPlan(abilities: readonly KnAttackAbility[]): KnAttackPlan {
  const plan: KnAttackPlan = { ...KN_EMPTY_ATTACK_PLAN, dice: [] }
  for (const { attack } of abilities) {
    plan.bonus += attack.bonus ?? 0
    plan.dice.push(...knPoolEntries(attack.dice))
    if (attack.pool) plan.pool = knPoolEntries(attack.pool)
    if (attack.critical) plan.critical = true
    if (attack.undefendable) plan.undefendable = true
    if (attack.allTargets) plan.allTargets = true
    if (attack.followUp && !plan.followUp) plan.followUp = { dice: attack.followUp.dice ? knPoolEntries(attack.followUp.dice) : undefined }
    plan.afterDefense += attack.afterDefense ?? 0
    plan.afterDefenseIfHit += attack.afterDefenseIfHit ?? 0
    if (attack.noDamage) plan.noDamage = true
    if (attack.stripArmor) plan.stripArmor = true
    if (attack.noDefense) plan.noDefense = true
    if (attack.onKill) plan.onKill = [...plan.onKill, ...attack.onKill]
  }
  return plan
}

// La marque d'une cible joue comme une aptitude d'attaque pour les coups qui la visent.
export function knMarkPlan(mark: Pick<KnAbilityAttack, 'bonus' | 'dice'> | undefined): KnAttackPlan {
  return mark ? { ...KN_EMPTY_ATTACK_PLAN, bonus: mark.bonus ?? 0, dice: knPoolEntries(mark.dice) } : { ...KN_EMPTY_ATTACK_PLAN, dice: [] }
}

export const knMergePlans = (...plans: readonly KnAttackPlan[]): KnAttackPlan => plans.reduce<KnAttackPlan>((total, plan) => ({
  bonus: total.bonus + plan.bonus,
  dice: [...total.dice, ...plan.dice],
  ...(plan.pool ?? total.pool ? { pool: plan.pool ?? total.pool } : {}),
  critical: total.critical || plan.critical,
  undefendable: total.undefendable || plan.undefendable,
  allTargets: total.allTargets || plan.allTargets,
  ...(total.followUp ?? plan.followUp ? { followUp: total.followUp ?? plan.followUp } : {}),
  afterDefense: total.afterDefense + plan.afterDefense,
  afterDefenseIfHit: total.afterDefenseIfHit + plan.afterDefenseIfHit,
  noDamage: total.noDamage || plan.noDamage,
  stripArmor: total.stripArmor || plan.stripArmor,
  noDefense: total.noDefense || plan.noDefense,
  onKill: [...total.onKill, ...plan.onKill],
  advantage: total.advantage || plan.advantage,
  freeAim: total.freeAim || plan.freeAim,
}), { ...KN_EMPTY_ATTACK_PLAN, dice: [] })

// Payer chaque aptitude choisie et noter son usage quand elle a une limite.
export function knSpendAttackAbilities(
  picked: readonly KnAttackAbility[],
  purse: KnAbilityPurse,
  status: KnStatus,
): { purse: KnAbilityPurse, status: KnStatus } {
  let nextPurse = purse
  let nextStatus = status
  for (const { id, ability } of picked) {
    nextPurse = knPayAbility(ability, nextPurse)
    if (ability.limit) nextStatus = knMarkUsed(nextStatus, id, ability.limit)
  }
  return { purse: nextPurse, status: nextStatus }
}

export interface KnPermanentEffects {
  resistant: KnDamageType[]
  immune: KnDamageType[]
  restored: KnDamageType[]
  damageType?: KnDamageType
  healOnDamage: number
  immuneConditions: KnConditionKey[]
  // Le malus le plus faible des Réactions consécutives.
  reactionPenalty?: number
  // La clé d'usage de l'aptitude qui sauve une fois d'une attaque mortelle.
  surviveKey?: string
  tensionStart?: number
  trapAvoid: { skill: KnSkillKey, amount: number }[]
  scavengeFinds: { key: KnProvisionKey, count: number }[]
  minionBonuses: NonNullable<NonNullable<KnMasteryAbility['permanent']>['minionBonus']>[]
}

// Ce que les aptitudes passives débloquées changent toujours : défenses du survivant, type de ses dégâts, soin par dégât infligé.
export function knPermanentEffects(masteries: readonly KnMastery[], entries: readonly KnMasteryEntry[]): KnPermanentEffects {
  const total: KnPermanentEffects = { resistant: [], immune: [], restored: [], healOnDamage: 0, immuneConditions: [], trapAvoid: [], scavengeFinds: [], minionBonuses: [] }
  for (const entry of entries) {
    const mastery = masteries.find(candidate => candidate.key === entry.key)
    for (const ability of mastery?.abilities ?? []) {
      const permanent = ability.permanent
      if (!permanent || ability.tier > entry.tiers) continue
      total.resistant.push(...(permanent.resistant ?? []))
      total.immune.push(...(permanent.immune ?? []))
      total.restored.push(...(permanent.restored ?? []))
      if (permanent.damageType) total.damageType = permanent.damageType
      total.healOnDamage += permanent.healOnDamage ?? 0
      total.immuneConditions.push(...(permanent.immuneConditions ?? []))
      if (permanent.reactionPenalty !== undefined) total.reactionPenalty = Math.min(total.reactionPenalty ?? permanent.reactionPenalty, permanent.reactionPenalty)
      if (permanent.surviveOnce) total.surviveKey = knSustainedKey(entry.key, ability.tier)
      if (permanent.tensionStart !== undefined) total.tensionStart = Math.max(total.tensionStart ?? 0, permanent.tensionStart)
      if (permanent.trapAvoid) total.trapAvoid.push(permanent.trapAvoid)
      total.scavengeFinds.push(...(permanent.scavengeFinds ?? []))
      if (permanent.minionBonus) total.minionBonuses.push(permanent.minionBonus)
    }
  }
  return total
}

// Les armes que l'aptitude de gravure peut encore marquer : une fois par arme.
export const knEngravableWeapons = (items: readonly KnItem[]): KnItem[] => items.filter(item => item.weapon && !item.engraved?.length)

export function knEngrave(items: readonly KnItem[], weaponId: string, dice: NonNullable<KnAbilityAttack['dice']>): KnItem[] {
  return items.map(item => item.id === weaponId && item.weapon && !item.engraved?.length ? { ...item, engraved: dice } : item)
}
