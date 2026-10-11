import type { Ref } from 'vue'
import type { KnCharacter } from '~~/server/utils/drizzle'
import { KN_DEFENSIVE_MOVE_DIE, KN_MONSTER_FUMBLE_DIE } from '~~/shared/ker-nethalas/catalog/combatTables'
import type { KnDamageType } from '~~/shared/ker-nethalas/catalog/damageTypes'
import { knHitLocation, type KnHitLocationKey } from '~~/shared/ker-nethalas/catalog/hitLocations'
import {
  KN_ATTACKER_BONUS,
  knActionDamageDue,
  knActionIsTest,
  knActionPool,
  knBuffedTarget,
  knBuffTotals,
  knCombatExchange,
  knCreatureDamageTarget,
  knOpposedCheck,
  knPackBonus,
  knPenetrating,
  knResolveDamage,
  knRollDamagePool,
  knSelfAmount,
  knSurvivorArmorZone,
  knWithDisadvantage,
  type KnDamageResult,
  type KnDamageRoll,
  type KnExchange,
} from '~~/shared/ker-nethalas/combat'
import { knReactionPenalty, type KnCombat } from '~~/shared/ker-nethalas/combatState'
import { knArmorAt, knCreatureAtLevel, knFindCreature, type KnCreature, type KnCreatureAction, type KnCreatureSelfEffect } from '~~/shared/ker-nethalas/creatures'
import { knRollDice, type KnDice } from '~~/shared/ker-nethalas/dice'
import type { KnResolvedSheet } from '~~/shared/ker-nethalas/resolve'
import { knD100Check, type KnD100Result } from '~~/shared/ker-nethalas/roll'
import {
  knAddCreatureBuff,
  knCombatLog,
  knConsumeCreatureEffects,
  knDamageCombatCreature,
  knExpireCreatureTurnEffects,
  knExpireCombatTemporary,
  knGainCombatTemporary,
  knRegisterReaction,
  knRollDie,
  knSetCombatFirst,
  knSetCombatSurprise,
  knStartCombat,
} from '~~/shared/ker-nethalas/run'
import { KN_RESISTANCE_KEYS, type KnResistanceKey, type KnSkillKey } from '~~/shared/ker-nethalas/skills'
import { knApplyDamage } from '~~/shared/ker-nethalas/tables'

export interface KnAttackResult {
  index: number
  name: string
  attack: KnD100Result
  defense: KnD100Result
  exchange: KnExchange
  location?: KnHitLocationKey
  weakSpot: boolean
  // Dégâts que les effets de la créature renvoient à qui l'attaque.
  reflect?: { label: string, type: KnDamageType, amount: number, applied: boolean }[]
  damageRoll?: KnDamageRoll
  damage?: KnDamageResult
  // Les deux jets ont échoué : 1 dégât qu'on ne peut pas éviter.
  unavoidable: boolean
  // Mouvement défensif de la créature (D10) quand elle a paré, maladresse du survivant (D10) sur un échec critique.
  monsterMove?: number
  fumble?: number
  applied: boolean
}

export interface KnTurnResult {
  index: number
  name: string
  action: KnCreatureAction
  d6: number
  check?: KnD100Result
  defense?: KnD100Result
  exchange?: KnExchange
  location?: KnHitLocationKey
  damageRoll?: KnDamageRoll
  damage?: KnDamageResult
  unavoidable: boolean
  survivorMove?: number
  monsterFumble?: number
  // Dégâts à retirer au survivant, quand l'outil sait les calculer.
  amount?: number
  // Les dégâts atteignent la Santé sans passer par la Robustesse.
  direct?: boolean
  applied: boolean
  // Dégâts finalement retirés au survivant.
  dealt?: number
}

export function useKnCombat(character: Ref<KnCharacter>, resolved: () => KnResolvedSheet, bestiary: () => KnCreature[] | null) {
  const toast = useToast()
  const { t } = useI18n()

  const combat = computed<KnCombat | undefined>(() => character.value.run.combat)
  const level = computed(() => character.value.level)

  const creatureOf = (index: number) => knFindCreature(bestiary(), combat.value?.creatures[index]?.ref)

  const d100 = () => knRollDie(100)

  function log(line: string) {
    character.value.run = knCombatLog(character.value.run, `Round ${combat.value?.round ?? 1} : ${line}`)
  }

  // Engager un combat : le nombre de créatures se tire, chacune garde sa Santé de départ, à son niveau.
  function engage(creature: KnCreature, overseer = false) {
    const count = Math.max(1, knRollDice(creature.number).total)
    const maxHealth = Math.max(1, knCreatureAtLevel(creature, level.value).health)
    const instances = Array.from({ length: count }, (_, i) => ({
      ref: creature.key,
      name: count > 1 ? `${creature.name} ${i + 1}` : creature.name,
      health: maxHealth,
      maxHealth,
    }))
    character.value.run = knStartCombat(character.value.run, instances, overseer)
  }

  const highestMind = () => (combat.value?.creatures ?? []).reduce((best, creature, index) => {
    return creature.health > 0 ? Math.max(best, creatureOf(index)?.mind ?? 0) : best
  }, 0)

  // Surprendre (Furtivité contre l'Esprit le plus haut) ou jouer l'Initiative (Perception contre cet Esprit).
  function opposed(kind: 'surprise' | 'initiative', modifier: number) {
    const skill: KnSkillKey = kind === 'surprise' ? 'stealth' : 'perception'
    const mind = highestMind()
    const mine = resolved().skills[skill]
    const player = knD100Check({ roll: d100(), score: mine.effective, difficulty: modifier, mode: mine.rollMode })
    const foes = knD100Check({ roll: d100(), score: mind, difficulty: 0, mode: 'normal' })
    const winner = knOpposedCheck(player, foes)
    const won = winner === 'a'
    if (winner !== 'tie') {
      character.value.run = knSetCombatFirst(character.value.run, won ? 'survivor' : 'creatures')
      character.value.run = knSetCombatSurprise(character.value.run, kind === 'surprise' && won)
    }
    const label = kind === 'surprise' ? 'Surprise' : 'Initiative'
    log(`${label} : ${player.value} pour ${player.target}, adversaire ${foes.value} pour ${foes.target} — ${winner === 'tie' ? 'égalité, à relancer' : won ? 'le survivant agit en premier' : 'les créatures agissent en premier'}`)
    return { player, foes, winner, mind }
  }

  function attack(input: {
    index: number
    skill: KnSkillKey
    bonus: number
    speed: number
    pool: KnDice[]
    damageType: KnDamageType
    aim: boolean
    magical: boolean
  }): KnAttackResult | undefined {
    const target = combat.value?.creatures[input.index]
    const creature = creatureOf(input.index)
    if (!combat.value || !target || !creature) return undefined
    const adapted = knCreatureAtLevel(creature, level.value)
    const alive = combat.value.creatures.filter(c => c.ref === target.ref && c.health > 0).length

    const buffs = knBuffTotals(target.effects)
    const mine = resolved().skills[input.skill]
    const aimed = input.aim && creature.hitLocation?.weakSpot ? knWithDisadvantage(mine.rollMode) : mine.rollMode
    const mode = buffs.disadvantageAgainst ? knWithDisadvantage(aimed) : aimed
    const attackCheck = knD100Check({ roll: d100(), score: mine.effective, difficulty: KN_ATTACKER_BONUS + input.bonus, mode })
    const defenseScore = adapted.combatSkill - input.speed + knPackBonus(creature, alive) + buffs.defenseBonus
    const defenseCheck = knD100Check({ roll: d100(), score: defenseScore, difficulty: 0, mode: buffs.defenseAdvantage ? 'advantage' : 'normal' })
    const exchange = knCombatExchange(attackCheck, defenseCheck)

    const result: KnAttackResult = {
      index: input.index,
      name: target.name,
      attack: attackCheck,
      defense: defenseCheck,
      exchange,
      weakSpot: false,
      unavoidable: exchange.outcome === 'bothFail',
      applied: false,
    }
    if (buffs.reflect.length) {
      result.reflect = buffs.reflect.map(entry => ({ label: entry.label, type: entry.type, amount: knRollDamagePool([entry.dice]).total, applied: false }))
    }
    if (exchange.fumble) result.fumble = knRollDie(KN_DEFENSIVE_MOVE_DIE)
    if (exchange.outcome === 'defended') result.monsterMove = knRollDie(KN_DEFENSIVE_MOVE_DIE)

    if (exchange.outcome === 'hit') {
      const spot = creature.hitLocation?.weakSpot
      result.location = creature.hitLocation
        ? (input.aim && spot ? spot : knHitLocation(creature.hitLocation.table, knRollDie(20)))
        : 'body'
      result.weakSpot = !!spot && result.location === spot
      result.damageRoll = knRollDamagePool(input.pool)
      result.damage = knResolveDamage({
        roll: result.damageRoll,
        damageType: input.damageType,
        criticalStrike: exchange.criticalStrike,
        weakSpot: result.weakSpot,
        armor: knArmorAt(adapted.armor, result.location),
        target: knBuffedTarget(knCreatureDamageTarget(creature), target.effects),
        magical: input.magical,
      })
    }
    return result
  }

  // Une fois l'attaque lue, on retire la Santé à la créature ; la surprise ne vaut que pour la première attaque.
  function applyAttack(result: KnAttackResult) {
    const amount = result.unavoidable ? 1 : result.damage ? result.damage.damage - result.damage.heal : 0
    character.value.run = knDamageCombatCreature(character.value.run, result.index, amount)
    character.value.run = knSetCombatSurprise(character.value.run, false)
    const left = combat.value?.creatures[result.index]?.health ?? 0
    log(`${result.name} ${amount > 0 ? `subit ${amount}` : amount < 0 ? `récupère ${-amount}` : 'ne subit rien'} (reste ${left})`)
    result.applied = true
  }

  // Ce que l'action fait à la créature qui l'a jouée : soins, Santé temporaire. `damage` : ce qu'elle vient d'infliger.
  function applySelfEffect(index: number, effect: KnCreatureSelfEffect, damage: number) {
    const target = combat.value?.creatures[index]
    if (!target) return 0
    if (effect.kind === 'buff') {
      const { kind: _kind, scope, rounds, ...fields } = effect
      const duration = rounds ? knRollDice(rounds).total : 0
      character.value.run = knAddCreatureBuff(character.value.run, index, { ...fields, ...(duration > 0 ? { rounds: duration } : {}) }, scope)
      log(`${target.name} : ${effect.label}${duration > 0 ? ` (${duration} round${duration > 1 ? 's' : ''})` : ''}`)
      return duration
    }
    const amount = knSelfAmount(effect.amount, { damage, health: target.health, maxHealth: target.maxHealth })
    if (effect.kind === 'heal') {
      character.value.run = knDamageCombatCreature(character.value.run, index, -amount)
      log(`${target.name} récupère ${amount} Santé`)
    } else {
      character.value.run = knGainCombatTemporary(character.value.run, index, amount, { cap: effect.cap, until: effect.until })
      log(`${target.name} gagne ${amount} Santé temporaire`)
    }
    return amount
  }

  function drawAction(index: number) {
    const creature = creatureOf(index)
    if (!creature) return undefined
    character.value.run = knExpireCreatureTurnEffects(knExpireCombatTemporary(character.value.run, 'turn', index), index)
    const d6 = knRollDie(6)
    const action = creature.actions.find(a => d6 >= a.min && d6 <= a.max)
    return action ? { d6, action } : undefined
  }

  const survivorArmor = (location: KnHitLocationKey) =>
    character.value.status.armor?.[knSurvivorArmorZone(location)] ?? 0

  // L'action d'une créature contre le survivant. Physique : jet opposé contre sa défense ; Magique : test de Résistance
  // magique ; sans étiquette, c'est le texte de l'action qui décide.
  function takeTurn(input: { index: number, d6: number, action: KnCreatureAction, defense: KnSkillKey, magicCheck: KnSkillKey | KnResistanceKey, bonus: number }): KnTurnResult | undefined {
    const target = combat.value?.creatures[input.index]
    const creature = creatureOf(input.index)
    if (!combat.value || !target || !creature) return undefined
    const adapted = knCreatureAtLevel(creature, level.value)
    const { action } = input
    const result: KnTurnResult = { index: input.index, name: target.name, action, d6: input.d6, unavoidable: false, applied: false }
    const buffs = knBuffTotals(target.effects)
    const pool = knActionPool(action, creature, level.value, buffs.damageBonuses)
    const damageType = action.damage?.type
    const penalty = knReactionPenalty(combat.value.reactions)
    const alive = combat.value.creatures.filter(c => c.ref === target.ref && c.health > 0).length
    const sheet = resolved()

    if (action.tag === 'physical') {
      const mine = sheet.skills[input.defense]
      result.check = knD100Check({ roll: d100(), score: adapted.combatSkill + knPackBonus(creature, alive) + buffs.attackBonus, difficulty: KN_ATTACKER_BONUS, mode: buffs.attackAdvantage ? 'advantage' : 'normal' })
      result.defense = knD100Check({ roll: d100(), score: mine.effective, difficulty: input.bonus - penalty, mode: mine.rollMode })
      result.exchange = knCombatExchange(result.check, result.defense)
      character.value.run = knRegisterReaction(character.value.run)
      if (result.exchange.fumble) result.monsterFumble = knRollDie(KN_MONSTER_FUMBLE_DIE)
      if (result.exchange.outcome === 'defended') result.survivorMove = knRollDie(KN_DEFENSIVE_MOVE_DIE)
      if (result.exchange.outcome === 'bothFail') {
        result.unavoidable = true
        result.amount = 1
      }
      if (result.exchange.outcome === 'hit') {
        result.location = knHitLocation('humanoid', knRollDie(20))
        if (pool.length && damageType && knActionDamageDue(action, { hit: true })) {
          result.damageRoll = knRollDamagePool(pool)
          result.damage = knResolveDamage({
            roll: result.damageRoll,
            damageType,
            criticalStrike: result.exchange.criticalStrike,
            weakSpot: false,
            armor: action.damage?.direct ? 0 : survivorArmor(result.location),
            armorIgnored: knPenetrating(creature),
            target: { vulnerable: [], resistant: [], restored: [] },
          })
          result.amount = result.damage.damage
          result.direct = action.damage?.direct
        }
      }
    } else if (knActionIsTest(action)) {
      const hasTest = action.tag === 'magical' || !!action.checks?.length
      if (hasTest) {
        const ward = (KN_RESISTANCE_KEYS as readonly string[]).includes(input.magicCheck)
          ? sheet.resistances[input.magicCheck as KnResistanceKey]
          : sheet.skills[input.magicCheck as KnSkillKey]
        result.defense = knD100Check({ roll: d100(), score: ward.effective, difficulty: input.bonus - penalty, mode: ward.rollMode })
        character.value.run = knRegisterReaction(character.value.run)
      }
      if (pool.length && damageType && knActionDamageDue(action, { testFailed: result.defense ? !result.defense.success : true })) {
        result.damageRoll = knRollDamagePool(pool)
        result.damage = knResolveDamage({
          roll: result.damageRoll,
          damageType,
          criticalStrike: false,
          weakSpot: false,
          armor: 0,
          target: { vulnerable: [], resistant: [], restored: [] },
        })
        result.amount = result.damage.damage
        result.direct = action.damage?.direct
      }
    }
    if (result.damage) character.value.run = knConsumeCreatureEffects(character.value.run, input.index)
    return result
  }

  // Dégâts reçus par le survivant : Robustesse temporaire, Robustesse, puis Santé.
  function damageSurvivor(amount: number, direct: boolean | undefined, line: string) {
    const c = character.value
    const maxVitals = resolved().maxVitals
    const before = c.healthCurrent
    const next = knApplyDamage(
      { toughness: c.toughnessCurrent, health: c.healthCurrent, status: c.status },
      { toughness: maxVitals.toughness.effective, health: maxVitals.health.effective },
      amount,
      direct,
    )
    c.toughnessCurrent = next.toughness
    c.healthCurrent = next.health
    c.status = next.status
    log(`${line} : le survivant subit ${amount}${direct ? ' directement à la Santé' : ''}`)
    toast.add({
      title: amount > 0 ? `${amount} dégâts subis` : 'Aucun dégât',
      description: before > 0 && next.health === 0 ? 'La Santé tombe à 0 : le survivant meurt.' : `Robustesse ${next.toughness}, Santé ${next.health}`,
      color: before > 0 && next.health === 0 ? 'error' : 'neutral',
    })
  }

  function applyToSurvivor(result: KnTurnResult, amount: number) {
    damageSurvivor(amount, result.direct, `${result.name} (${result.action.name})`)
    result.applied = true
    result.dealt = amount
  }

  // Les dégâts qu'un effet de la créature renvoie à celui qui l'attaque.
  function applyReflect(result: KnAttackResult, index: number) {
    const entry = result.reflect?.[index]
    if (!entry || entry.applied) return
    damageSurvivor(entry.amount, false, `${result.name} (${entry.label})`)
    entry.applied = true
  }

  const moveText = (table: 'survivorDefensiveMoves' | 'monsterDefensiveMoves' | 'monsterFumbles', roll: number) =>
    t(`ker_nethalas.combat.${table}.${roll}`)

  return { combat, level, creatureOf, engage, opposed, attack, applyAttack, drawAction, takeTurn, applyToSurvivor, applyReflect, applySelfEffect, moveText, survivorArmor, log }
}
