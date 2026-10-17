import { knSurvivorMove } from '~~/shared/ker-nethalas/survivorMoves'
import { KN_EMPTY_ATTACK_PLAN, knMarkPlan, knMergePlans, knPoolEntries, type KnAttackPlan } from '~~/shared/ker-nethalas/abilityAttack'
import type { KnAbilityAttack } from '~~/shared/ker-nethalas/masteries'
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
  KN_NO_DEFENSE,
  knArmorAfterLoss,
  knWithAdvantage,
  knRollDamagePool,
  type KnPoolEntry,
  knSelfAmount,
  knSurvivorArmorZone,
  knWithDisadvantage,
  type KnDamageResult,
  type KnDamageRoll,
  type KnExchange,
} from '~~/shared/ker-nethalas/combat'
import { knReactionPenalty, type KnCombat } from '~~/shared/ker-nethalas/combatState'
import { knArmorAt, knCreatureAtLevel, knFearLoss, knFindCreature, type KnCreature, type KnCreatureAction, type KnCreatureSelfEffect } from '~~/shared/ker-nethalas/creatures'
import { knRollDice, type KnDice } from '~~/shared/ker-nethalas/dice'
import { knArmorByZone, knArmorPieces, knBreakItem, knInitiativeBonus, knSacrificeChoices } from '~~/shared/ker-nethalas/equipment'
import { knMagicDefenses } from '~~/shared/ker-nethalas/magicEffects'
import { knGoalCriticalTriple, knGoalReductions, knHasActivePerk, knMergeReductions } from '~~/shared/ker-nethalas/goalEffects'
import type { KnResolvedSheet } from '~~/shared/ker-nethalas/resolve'
import { knD100Check, type KnD100Result } from '~~/shared/ker-nethalas/roll'
import {
  knAddCombatCreatures,
  knAddCreatureBuff,
  knAddMinion,
  knCombatLog,
  knConsumeCreatureEffects,
  knDamageCombatCreature,
  knDamageMinion,
  knExpireCreatureTurnEffects,
  knExpireCombatTemporary,
  knGainCombatTemporary,
  knMarkGearUsed,
  knRegisterReaction,
  knRollDie,
  knAddNextAttack,
  knClearNextAttack,
  knLoseCreatureArmor,
  knMarkCreature,
  knRaiseNextAttackBonus,
  knSetCreatureDefenseMalus,
  knMarkCreatureSlain,
  knSetCombatDefense,
  knSetCombatDual,
  knSetCombatFirst,
  knSetCombatLamp,
  knSetCombatSurprise,
  knSpillLamp,
  knUseFreeParry,
  knSpendCombatCreature,
  knStartCombat,
  knVanishSpentCreatures,
} from '~~/shared/ker-nethalas/run'
import { KN_RESISTANCE_KEYS, knIsWeaponSkill, type KnResistanceKey, type KnSkillKey } from '~~/shared/ker-nethalas/skills'
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
  // Atout de relance des dégâts critiques : les dégâts d'un Coup critique se relancent une fois, avant d'être appliqués.
  reroll?: { pool: KnPoolEntry[], damageType: KnDamageType, magical: boolean, used: boolean }
  // Seconde attaque gratuite d'une aptitude.
  followUp?: boolean
  // Une aptitude : pas de dégâts, mais l'Armure d'une localisation à retirer.
  noDamage?: boolean
  stripArmor?: boolean
  stripped?: boolean
  // Aptitude : la cible n'a pas pu se défendre.
  undefended?: boolean
  // Les deux jets ont échoué : 1 dégât qu'on ne peut pas éviter.
  unavoidable: boolean
  // Mouvement défensif de la créature (D10) quand elle a paré, maladresse du survivant (D10) sur un échec critique.
  monsterMove?: number
  fumble?: number
  // Lampe posée : la maladresse la renverse au lieu de tirer dans la table des maladresses.
  lampSpilled?: boolean
  lampSpillApplied?: boolean
  // Une attaque du survivant (et non d'un sbire), avec sa compétence et son type de dégâts : de quoi faire avancer les objectifs.
  survivor?: boolean
  skill?: KnSkillKey
  damageType?: KnDamageType
  applied: boolean
}

// Le test de Résistance magique d'une créature visée par un sort de sbire, et les dégâts qui suivent un échec.
export interface KnSpellResult {
  index: number
  name: string
  test: KnD100Result
  damageRoll?: KnDamageRoll
  damage?: KnDamageResult
  applied: boolean
}

export interface KnTurnResult {
  index: number
  name: string
  // Le sbire visé par l'action, quand ce n'est pas le survivant.
  minion?: number
  action: KnCreatureAction
  d6: number
  check?: KnD100Result
  defense?: KnD100Result
  // Une aptitude interdit au survivant de se défendre.
  undefended?: boolean
  exchange?: KnExchange
  location?: KnHitLocationKey
  damageRoll?: KnDamageRoll
  damage?: KnDamageResult
  unavoidable: boolean
  survivorMove?: number
  // L'outil a appliqué l'effet du mouvement défensif (il n'est pas que du texte).
  survivorMoveApplied?: boolean
  // Le survivant a défendu à l'Esquive : une aptitude de réaction peut répondre.
  dodged?: boolean
  monsterFumble?: number
  // L'arme ou le bouclier sacrifié pour annuler un Coup critique.
  sacrificed?: string
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
  const { record } = useKnGoalProgress(character)

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
    character.value.run = knStartCombat(character.value.run, instances, overseer, knFearLoss([creature]))
  }

  const highestMind = () => (combat.value?.creatures ?? []).reduce((best, creature, index) => {
    return creature.health > 0 ? Math.max(best, creatureOf(index)?.mind ?? 0) : best
  }, 0)

  // Surprendre (Furtivité contre l'Esprit le plus haut) ou jouer l'Initiative (Perception contre cet Esprit).
  function opposed(kind: 'surprise' | 'initiative', modifier: number) {
    const skill: KnSkillKey = kind === 'surprise' ? 'stealth' : 'perception'
    const mind = highestMind()
    const mine = resolved().skills[skill]
    const gear = kind === 'initiative' ? knInitiativeBonus(character.value.inventory) : 0
    const player = knD100Check({ roll: d100(), score: mine.effective, difficulty: modifier + gear, mode: mine.rollMode })
    const foes = knD100Check({ roll: d100(), score: mind, difficulty: 0, mode: 'normal' })
    const winner = knOpposedCheck(player, foes)
    const won = winner === 'a'
    if (winner !== 'tie') {
      character.value.run = knSetCombatFirst(character.value.run, won ? 'survivor' : 'creatures')
      character.value.run = knSetCombatSurprise(character.value.run, kind === 'surprise' && won)
      if (kind === 'surprise' && won) record({ kind: 'surprise', creatures: combat.value?.creatures.filter(creature => creature.health > 0).length ?? 0 })
    }
    const label = kind === 'surprise' ? 'Surprise' : 'Initiative'
    log(`${label} : ${player.value} pour ${player.target}, adversaire ${foes.value} pour ${foes.target} — ${winner === 'tie' ? 'égalité, à relancer' : won ? 'le survivant agit en premier' : 'les créatures agissent en premier'}`)
    return { player, foes, winner, mind }
  }

  // Atout de surprise assurée : la surprise réussit toujours, sans test.
  function surpriseAutomatically() {
    character.value.run = knSetCombatFirst(character.value.run, 'survivor')
    character.value.run = knSetCombatSurprise(character.value.run, true)
    record({ kind: 'surprise', creatures: combat.value?.creatures.filter(creature => creature.health > 0).length ?? 0 })
    log('Surprise assurée par un Atout : le survivant agit en premier')
  }

  function attack(input: {
    index: number
    // Compétence du survivant, ou `attackerScore` : la Compétence de combat d'un sbire qui attaque à sa place.
    skill?: KnSkillKey
    attackerScore?: number
    bonus: number
    speed: number
    pool: KnPoolEntry[]
    damageType: KnDamageType
    aim: boolean
    magical: boolean
    // Aptitudes : la touche est un Coup critique ; la cible ne se défend pas.
    critical?: boolean
    undefendable?: boolean
    // Mouvement défensif ou réaction : Avantage à cette attaque, visée d'une partie du corps sans Désavantage.
    advantage?: boolean
    freeAim?: boolean
    // Aptitude : la touche n'inflige aucun dégât.
    noDamage?: boolean
  }): KnAttackResult | undefined {
    const target = combat.value?.creatures[input.index]
    const creature = creatureOf(input.index)
    if (!combat.value || !target || !creature) return undefined
    const adapted = knCreatureAtLevel(creature, level.value)
    const alive = combat.value.creatures.filter(c => c.ref === target.ref && c.health > 0).length

    const mark = input.attackerScore === undefined ? knMarkPlan(target.mark) : undefined
    const attackBonus = input.bonus + (mark?.bonus ?? 0)
    const pool = mark ? [...input.pool, ...mark.dice] : input.pool
    const buffs = knBuffTotals(target.effects)
    const mine = input.attackerScore === undefined
      ? resolved().skills[input.skill ?? 'bladedWeapons']
      : { effective: input.attackerScore, rollMode: 'normal' as const }
    const aimed = input.aim && !input.freeAim && creature.hitLocation?.weakSpot ? knWithDisadvantage(mine.rollMode) : mine.rollMode
    const disadvantaged = buffs.disadvantageAgainst ? knWithDisadvantage(aimed) : aimed
    const mode = input.advantage ? knWithAdvantage(disadvantaged) : disadvantaged
    const attackCheck = knD100Check({ roll: d100(), score: mine.effective, difficulty: KN_ATTACKER_BONUS + attackBonus, mode })
    const defenseScore = adapted.combatSkill - input.speed + knPackBonus(creature, alive) + buffs.defenseBonus - (target.defenseMalus ?? 0)
    if (target.defenseMalus && !input.undefendable) character.value.run = knSetCreatureDefenseMalus(character.value.run, input.index, 0)
    const defenseCheck = input.undefendable
      ? KN_NO_DEFENSE
      : knD100Check({ roll: d100(), score: defenseScore, difficulty: 0, mode: buffs.defenseAdvantage ? 'advantage' : 'normal' })
    const rolled = knCombatExchange(attackCheck, defenseCheck)
    const exchange = input.critical && rolled.outcome === 'hit' ? { ...rolled, criticalStrike: true } : rolled

    const result: KnAttackResult = {
      index: input.index,
      name: target.name,
      attack: attackCheck,
      defense: defenseCheck,
      exchange,
      weakSpot: false,
      unavoidable: exchange.outcome === 'bothFail',
      applied: false,
      ...(input.undefendable ? { undefended: true } : {}),
      ...(input.attackerScore === undefined ? { survivor: true, skill: input.skill ?? 'bladedWeapons', damageType: input.damageType } : {}),
    }
    if (buffs.reflect.length) {
      result.reflect = buffs.reflect.map(entry => ({ label: entry.label, type: entry.type, amount: knRollDamagePool([entry.dice]).total, applied: false }))
    }
    if (exchange.fumble) {
      if (combat.value.lampDown && input.attackerScore === undefined) result.lampSpilled = true
      else result.fumble = knRollDie(KN_DEFENSIVE_MOVE_DIE)
    }
    if (exchange.outcome === 'defended') result.monsterMove = knRollDie(KN_DEFENSIVE_MOVE_DIE)

    if (exchange.outcome === 'hit') {
      const spot = creature.hitLocation?.weakSpot
      result.location = creature.hitLocation
        ? (input.aim && spot ? spot : knHitLocation(creature.hitLocation.table, knRollDie(20)))
        : 'body'
      result.weakSpot = !!spot && result.location === spot
      const damage = { pool, damageType: input.damageType, magical: input.magical }
      if (input.noDamage) result.noDamage = true
      else rollHitDamage(result, damage)
      if (exchange.criticalStrike && input.attackerScore === undefined && knHasActivePerk(character.value, 'precisionStriker')) {
        result.reroll = { ...damage, used: false }
      }
    }
    return result
  }

  function rollHitDamage(result: KnAttackResult, input: { pool: KnPoolEntry[], damageType: KnDamageType, magical: boolean }) {
    const target = combat.value?.creatures[result.index]
    const creature = creatureOf(result.index)
    if (!target || !creature || !result.location) return
    result.damageRoll = knRollDamagePool(input.pool)
    const damageType = result.damageRoll.pickedType ?? input.damageType
    if (result.survivor) result.damageType = damageType
    result.damage = knResolveDamage({
      roll: result.damageRoll,
      damageType,
      criticalStrike: result.exchange.criticalStrike,
      criticalTriple: knGoalCriticalTriple(character.value.goalEffects, creature.types),
      weakSpot: result.weakSpot,
      armor: knArmorAfterLoss(knArmorAt(knCreatureAtLevel(creature, level.value).armor, result.location), target.armorLoss, result.location),
      target: knBuffedTarget(knCreatureDamageTarget(creature), target.effects),
      magical: input.magical,
    })
  }

  type SurvivorAttackInput = Parameters<typeof attack>[0]

  // Ce que la prochaine attaque reçoit des mouvements défensifs et des réactions, sous forme de plan d'attaque.
  const nextPlan = (next: NonNullable<typeof combat.value>['next']): KnAttackPlan => ({
    ...KN_EMPTY_ATTACK_PLAN,
    bonus: next?.bonus ?? 0,
    dice: knPoolEntries(next?.dice),
    advantage: !!next?.advantage,
    freeAim: !!next?.freeAim,
  })

  // L'attaque du survivant avec ses aptitudes et ce que le combat lui a préparé : une attaque par cible visée, chacune suivie de
  // la seconde attaque gratuite si elle touche. Ce qui était préparé pour « la prochaine attaque » est consommé, touchée ou non ;
  // la défense du survivant se règle ensuite pour la suite.
  function attackWithAbilities(input: SurvivorAttackInput, plan: KnAttackPlan): KnAttackResult[] {
    const first = knMergePlans(plan, nextPlan(combat.value?.next))
    const targets = plan.allTargets
      ? (combat.value?.creatures ?? []).flatMap((creature, index) => creature.health > 0 ? [index] : [])
      : [input.index]
    const results: KnAttackResult[] = []
    for (const index of targets) {
      const shot = attack({
        ...input,
        index,
        bonus: input.bonus + first.bonus,
        pool: [...(first.pool ?? input.pool), ...first.dice],
        critical: first.critical,
        undefendable: first.undefendable,
        advantage: first.advantage,
        freeAim: first.freeAim,
        noDamage: first.noDamage,
      })
      if (!shot) continue
      results.push(first.stripArmor && shot.exchange.outcome === 'hit' ? { ...shot, stripArmor: true } : shot)
      if (plan.followUp && shot.exchange.outcome === 'hit') {
        const second = attack({ ...input, index, bonus: input.bonus + plan.bonus, pool: plan.followUp.dice ?? [...input.pool, ...plan.dice] })
        if (second) results.push({ ...second, followUp: true })
      }
    }
    const hit = results.some(shot => !shot.followUp && shot.exchange.outcome === 'hit')
    character.value.run = knClearNextAttack(character.value.run)
    character.value.run = knSetCombatDefense(character.value.run, { bonus: plan.afterDefense + (hit ? plan.afterDefenseIfHit : 0), none: plan.noDefense })
    return results
  }

  // Le mouvement défensif du survivant : ce que l'outil sait appliquer l'est tout de suite (le reste est du texte à lire).
  function applySurvivorMove(index: number, roll: number): boolean {
    const target = combat.value?.creatures[index]
    const creature = creatureOf(index)
    if (!target || !creature) return false
    const effect = knSurvivorMove(roll)
    if (effect.kind === 'nextAttack') {
      character.value.run = knAddNextAttack(character.value.run, { bonus: effect.bonus, dice: effect.dice, advantage: effect.advantage, freeAim: effect.freeAim })
      return true
    }
    if (effect.kind === 'armorLoss') {
      const location = creature.hitLocation ? knHitLocation(creature.hitLocation.table, knRollDie(20)) : 'body'
      character.value.run = knLoseCreatureArmor(character.value.run, index, location, effect.points)
      log(`${target.name} : Armure −${effect.points} (${t(`ker_nethalas.hitLocations.${location}`)}) jusqu'à la fin du combat`)
      return true
    }
    if (effect.kind === 'piercing') {
      const hurt = knResolveDamage({
        roll: { dice: [], bonus: effect.amount, picked: 0, total: effect.amount },
        damageType: 'piercing',
        criticalStrike: false,
        weakSpot: false,
        armor: 0,
        target: knBuffedTarget(knCreatureDamageTarget(creature), target.effects),
      })
      character.value.run = knDamageCombatCreature(character.value.run, index, hurt.damage)
      log(`${target.name} subit ${hurt.damage} dégât perforant qui ignore l'Armure`)
      return true
    }
    if (effect.kind === 'foeDefense') {
      character.value.run = knSetCreatureDefenseMalus(character.value.run, index, effect.amount)
      return true
    }
    if (effect.kind === 'recover') {
      const c = character.value
      c.toughnessCurrent = Math.min(resolved().maxVitals.toughness.effective, c.toughnessCurrent + effect.amount)
      return true
    }
    return false
  }

  // Une aptitude de réaction après une défense à l'Esquive réussie : la prochaine attaque reçoit ce bonus, qui remplace celui du
  // mouvement défensif.
  function reactAfterDodge(bonus: number) {
    character.value.run = knRaiseNextAttackBonus(character.value.run, bonus)
  }

  // Sur une touche d'aptitude qui retire l'Armure : toute l'Armure de la localisation choisie.
  function stripArmor(index: number, location: string) {
    const target = combat.value?.creatures[index]
    if (!target) return
    character.value.run = knLoseCreatureArmor(character.value.run, index, location, 99)
    log(`${target.name} : plus d'Armure (${t(`ker_nethalas.hitLocations.${location}`)}) jusqu'à la fin du combat`)
  }

  function markCreature(index: number, mark: Pick<KnAbilityAttack, 'bonus' | 'dice'>) {
    const target = combat.value?.creatures[index]
    if (!target || target.mark) return false
    character.value.run = knMarkCreature(character.value.run, index, mark)
    log(`${target.name} : faille exploitée`)
    return true
  }

  function setDual(dominant: string | null) {
    character.value.run = knSetCombatDual(character.value.run, dominant)
    log(dominant ? 'Combat à deux armes : arme dominante choisie' : 'Combat à deux armes abandonné')
  }

  function setLamp(down: boolean) {
    character.value.run = knSetCombatLamp(character.value.run, down)
    log(down ? 'Lampe posée au sol (Action Standard)' : 'Lampe reprise en main')
  }

  function spillLamp(result: KnAttackResult) {
    if (!result.lampSpilled || result.lampSpillApplied) return
    character.value.run = knSpillLamp(character.value.run)
    log('Maladresse : la lampe se renverse, son huile se répand, le survivant est Aveuglé')
    result.lampSpillApplied = true
  }

  function rerollDamage(result: KnAttackResult) {
    if (!result.reroll || result.reroll.used || result.applied) return
    const previous = result.damage?.damage
    rollHitDamage(result, result.reroll)
    result.reroll.used = true
    log(`Atout : dégâts du Coup critique relancés (${previous ?? 0} → ${result.damage?.damage ?? 0})`)
  }

  const minions = computed(() => character.value.run.minions ?? [])

  const minionSheetAt = (index: number) => knFindCreature(bestiary(), minions.value[index]?.ref)

  // Un sbire invoqué rejoint l'équipe avec toute sa Santé, qui ne grandit pas avec le niveau.
  function addMinion(sheet: KnCreature) {
    const same = minions.value.filter(minion => minion.ref === sheet.key).length
    const health = Math.max(1, sheet.health.base)
    const next = knAddMinion(character.value.run, { ref: sheet.key, name: same ? `${sheet.name} ${same + 1}` : sheet.name, health, maxHealth: health })
    if (next === character.value.run) {
      toast.add({ title: 'Équipe pleine', description: 'Six sbires au plus.', color: 'warning' })
      return
    }
    character.value.run = next
  }

  function drawMinionAction(index: number) {
    const sheet = minionSheetAt(index)
    if (!sheet) return undefined
    const d6 = knRollDie(6)
    const action = sheet.actions.find(a => d6 >= a.min && d6 <= a.max)
    return action ? { d6, action } : undefined
  }

  // Un sbire attaque une créature de la même façon qu'une créature attaque : jet opposé contre sa Compétence de combat.
  function minionAttack(input: { minion: number, target: number, action: KnCreatureAction, bonus: number, extra: KnDice[] }): KnAttackResult | undefined {
    const sheet = minionSheetAt(input.minion)
    const { damage } = input.action
    if (!sheet || !damage) return undefined
    return attack({
      index: input.target,
      attackerScore: sheet.combatSkill,
      bonus: input.bonus,
      speed: 0,
      pool: knActionPool(input.action, sheet, 1, input.extra),
      damageType: damage.type,
      aim: false,
      magical: false,
    })
  }

  // Une action Magique d'un sbire : la créature visée fait un test de Résistance magique, et les dégâts suivent un échec.
  function minionSpell(input: { minion: number, target: number, action: KnCreatureAction, extra: KnDice[] }): KnSpellResult | undefined {
    const sheet = minionSheetAt(input.minion)
    const target = combat.value?.creatures[input.target]
    const creature = creatureOf(input.target)
    const { damage } = input.action
    if (!sheet || !target || !creature || !damage) return undefined
    const adapted = knCreatureAtLevel(creature, level.value)
    const test = knD100Check({ roll: d100(), score: adapted.magicResistance, difficulty: 0, mode: 'normal' })
    const result: KnSpellResult = { index: input.target, name: target.name, test, applied: false }
    if (!test.success || damage.always) {
      result.damageRoll = knRollDamagePool(knActionPool(input.action, sheet, 1, input.extra))
      result.damage = knResolveDamage({
        roll: result.damageRoll,
        damageType: damage.type,
        criticalStrike: false,
        weakSpot: false,
        armor: 0,
        target: knBuffedTarget(knCreatureDamageTarget(creature), target.effects),
        magical: true,
      })
    }
    return result
  }

  function applySpell(result: KnSpellResult) {
    const amount = result.damage ? result.damage.damage - result.damage.heal : 0
    character.value.run = knDamageCombatCreature(character.value.run, result.index, amount)
    log(`${result.name} ${amount > 0 ? `subit ${amount}` : amount < 0 ? `récupère ${-amount}` : 'ne subit rien'} (reste ${combat.value?.creatures[result.index]?.health ?? 0})`)
    result.applied = true
  }

  // Une fois l'attaque lue, on retire la Santé à la créature ; la surprise ne vaut que pour la première attaque.
  function applyAttack(result: KnAttackResult) {
    const amount = result.unavoidable ? 1 : result.damage ? result.damage.damage - result.damage.heal : 0
    character.value.run = knDamageCombatCreature(character.value.run, result.index, amount)
    character.value.run = knSetCombatSurprise(character.value.run, false)
    const left = combat.value?.creatures[result.index]?.health ?? 0
    log(`${result.name} ${amount > 0 ? `subit ${amount}` : amount < 0 ? `récupère ${-amount}` : 'ne subit rien'} (reste ${left})`)
    result.applied = true
    recordSurvivorHit(result, amount, left)
  }

  // Les coups du survivant font avancer les objectifs : dégâts par type, Coups critiques, et la compétence qui a porté le coup fatal.
  function recordSurvivorHit(result: KnAttackResult, amount: number, left: number) {
    if (!result.survivor || !result.damage) return
    if (result.exchange.criticalStrike) record({ kind: 'critical' })
    if (amount > 0 && result.damageType) record({ kind: 'damage', damage: result.damageType, amount })
    if (amount > 0 && left <= 0 && result.skill && knIsWeaponSkill(result.skill)) {
      character.value.run = knMarkCreatureSlain(character.value.run, result.index, result.skill)
    }
  }

  // Ce que l'action fait à la créature qui l'a jouée : soins, Santé temporaire. `damage` : ce qu'elle vient d'infliger.
  function applySelfEffect(index: number, effect: KnCreatureSelfEffect, damage: number) {
    const target = combat.value?.creatures[index]
    if (!target) return 0
    if (effect.kind === 'summon') {
      const sheet = knFindCreature(bestiary(), effect.ref)
      if (!sheet) {
        toast.add({ title: 'Fiche absente', description: 'La créature invoquée n\'est pas dans le contenu chargé : ajoutez-la à la main.', color: 'warning' })
        return 0
      }
      const count = knRollDice(effect.count).total
      const maxHealth = Math.max(1, knCreatureAtLevel(sheet, level.value).health)
      const already = combat.value?.creatures.filter(c => c.ref === sheet.key).length ?? 0
      const instances = Array.from({ length: count }, (_, i) => ({ ref: sheet.key, name: `${sheet.name} ${already + i + 1}`, health: maxHealth, maxHealth }))
      const before = combat.value?.creatures.length ?? 0
      character.value.run = knAddCombatCreatures(character.value.run, instances, effect.max)
      const added = (combat.value?.creatures.length ?? 0) - before
      const { buff } = effect
      if (buff) {
        for (let i = before; i < before + added; i++) character.value.run = knAddCreatureBuff(character.value.run, i, buff)
      }
      log(`${target.name} invoque ${added} ${sheet.name}${added < count ? ` (${count} tirés, limite atteinte)` : ''}`)
      return added
    }
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
    character.value.run = knVanishSpentCreatures(knExpireCreatureTurnEffects(knExpireCombatTemporary(character.value.run, 'turn', index), index))
    const d6 = knRollDie(6)
    const action = creature.actions.find(a => d6 >= a.min && d6 <= a.max)
    return action ? { d6, action } : undefined
  }

  const survivorArmor = (location: KnHitLocationKey) => knArmorByZone(character.value.inventory, resolved().armorBonus)[knSurvivorArmorZone(location)]

  // L'action d'une créature contre le survivant, ou contre un sbire (`minion`). Physique : jet opposé contre sa défense ;
  // Magique : test de Résistance magique ; sans étiquette, c'est le texte de l'action qui décide.
  function takeTurn(input: { index: number, d6: number, action: KnCreatureAction, defense: KnSkillKey, magicCheck: KnSkillKey | KnResistanceKey, bonus: number, minion?: number, defenseBonus?: number, gear?: string[], freeParry?: boolean }): KnTurnResult | undefined {
    const target = combat.value?.creatures[input.index]
    const creature = creatureOf(input.index)
    if (!combat.value || !target || !creature) return undefined
    const minionState = input.minion === undefined ? undefined : character.value.run.minions?.[input.minion]
    const minionSheet = knFindCreature(bestiary(), minionState?.ref)
    if (input.minion !== undefined && !minionSheet) return undefined
    const adapted = knCreatureAtLevel(creature, level.value)
    const { action } = input
    const result: KnTurnResult = { index: input.index, name: target.name, action, d6: input.d6, unavoidable: false, applied: false, ...(minionSheet ? { minion: input.minion } : {}) }
    const buffs = knBuffTotals(target.effects)
    const pool = knActionPool(action, creature, level.value, buffs.damageBonuses)
    const damageType = action.damage?.type
    const free = !!input.freeParry && !minionSheet && !combat.value.freeParryUsed
    const penalty = free ? 0 : knReactionPenalty(combat.value.reactions)
    const alive = combat.value.creatures.filter(c => c.ref === target.ref && c.health > 0).length
    const sheet = resolved()
    const undefended = !minionSheet && !!combat.value.noDefense

    // Qui se défend : le survivant (sa fiche, son Armure saisie) ou un sbire (sa propre fiche, qui ne s'adapte pas au niveau).
    const defend = (kind: 'physical' | 'magic') => {
      if (minionSheet) return knD100Check({ roll: d100(), score: kind === 'physical' ? minionSheet.combatSkill : minionSheet.magicResistance, difficulty: 0, mode: 'normal' })
      if (kind === 'physical') {
        if (undefended) return KN_NO_DEFENSE
        const mine = sheet.skills[input.defense]
        const aftermath = combat.value?.defenseBonus ?? 0
        const check = knD100Check({ roll: d100(), score: mine.effective, difficulty: input.bonus + (input.defenseBonus ?? 0) + aftermath - penalty, mode: mine.rollMode })
        if (aftermath) character.value.run = knSetCombatDefense(character.value.run, { none: combat.value?.noDefense })
        return check
      }
      const ward = (KN_RESISTANCE_KEYS as readonly string[]).includes(input.magicCheck)
        ? sheet.resistances[input.magicCheck as KnResistanceKey]
        : sheet.skills[input.magicCheck as KnSkillKey]
      return knD100Check({ roll: d100(), score: ward.effective, difficulty: input.bonus - penalty, mode: ward.rollMode })
    }
    const locationOf = () => minionSheet
      ? (minionSheet.hitLocation ? knHitLocation(minionSheet.hitLocation.table, knRollDie(20)) : 'body' as const)
      : knHitLocation('humanoid', knRollDie(20))
    const armorAt = (location: KnHitLocationKey) => minionSheet ? knArmorAt(minionSheet.armor, location) : survivorArmor(location)
    const survivorDefenses = knMagicDefenses(character.value.inventory)
    const damageTarget = minionSheet
      ? knBuffedTarget(knCreatureDamageTarget(minionSheet), minionState?.effects)
      : { vulnerable: [], resistant: survivorDefenses.resistant, restored: [], reduction: knMergeReductions(survivorDefenses.reduction, knGoalReductions(character.value.goalEffects)) }
    const registerReaction = () => {
      if (minionSheet) return
      character.value.run = free ? knUseFreeParry(character.value.run) : knRegisterReaction(character.value.run)
    }

    if (action.tag === 'physical') {
      result.check = knD100Check({ roll: d100(), score: adapted.combatSkill + knPackBonus(creature, alive) + buffs.attackBonus, difficulty: KN_ATTACKER_BONUS, mode: buffs.attackAdvantage ? 'advantage' : 'normal' })
      result.defense = defend('physical')
      if (undefended) result.undefended = true
      result.exchange = knCombatExchange(result.check, result.defense)
      if (!undefended) registerReaction()
      if (!minionSheet && input.defense === 'dodge' && result.exchange.outcome === 'defended') result.dodged = true
      if (!minionSheet) character.value.run = knMarkGearUsed(character.value.run, input.gear ?? [])
      if (result.exchange.fumble) result.monsterFumble = knRollDie(KN_MONSTER_FUMBLE_DIE)
      if (result.exchange.outcome === 'defended' && !minionSheet) {
        result.survivorMove = knRollDie(KN_DEFENSIVE_MOVE_DIE)
        result.survivorMoveApplied = applySurvivorMove(input.index, result.survivorMove)
      }
      if (result.exchange.outcome === 'bothFail') {
        result.unavoidable = true
        result.amount = 1
      }
      if (result.exchange.outcome === 'hit') {
        result.location = locationOf()
        if (pool.length && damageType && knActionDamageDue(action, { hit: true })) {
          result.damageRoll = knRollDamagePool(pool)
          result.damage = knResolveDamage({
            roll: result.damageRoll,
            damageType,
            criticalStrike: result.exchange.criticalStrike,
            weakSpot: false,
            armor: action.damage?.direct ? 0 : armorAt(result.location),
            armorIgnored: knPenetrating(creature),
            target: damageTarget,
          })
          result.amount = result.damage.damage
          result.direct = action.damage?.direct
          if (!minionSheet && result.damage.armorAbsorbed > 0) {
            const zone = knSurvivorArmorZone(result.location)
            character.value.run = knMarkGearUsed(character.value.run, knArmorPieces(character.value.inventory, zone).map(piece => piece.id))
          }
        }
      }
    } else if (knActionIsTest(action)) {
      const hasTest = action.tag === 'magical' || !!action.checks?.length
      if (hasTest) {
        result.defense = defend('magic')
        registerReaction()
      }
      if (pool.length && damageType && knActionDamageDue(action, { testFailed: result.defense ? !result.defense.success : true })) {
        result.damageRoll = knRollDamagePool(pool)
        result.damage = knResolveDamage({
          roll: result.damageRoll,
          damageType,
          criticalStrike: false,
          weakSpot: false,
          armor: 0,
          target: damageTarget,
          magical: true,
        })
        result.amount = result.damage.damage
        result.direct = action.damage?.direct
      }
    }
    if (result.damage) character.value.run = knConsumeCreatureEffects(character.value.run, input.index)
    if (creature.ephemeral) character.value.run = knSpendCombatCreature(character.value.run, input.index)
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

  // Dégâts subis par un sbire : à 0 Santé, il est détruit et quitte l'équipe.
  function applyToMinion(result: KnTurnResult, amount: number) {
    if (result.minion === undefined) return
    const name = character.value.run.minions?.[result.minion]?.name ?? 'Le sbire'
    const hit = knDamageMinion(character.value.run, result.minion, amount)
    character.value.run = hit.run
    log(`${result.name} (${result.action.name}) : ${name} subit ${amount}${hit.destroyed ? ', il est détruit' : ''}`)
    toast.add({ title: hit.destroyed ? `${name} est détruit` : `${name} subit ${amount} dégâts`, color: hit.destroyed ? 'warning' : 'neutral' })
    result.applied = true
    result.dealt = amount
  }

  function applyToSurvivor(result: KnTurnResult, amount: number) {
    damageSurvivor(amount, result.direct, `${result.name} (${result.action.name})`)
    result.applied = true
    result.dealt = amount
  }

  // Sacrifier l'arme ou le bouclier annule le Coup critique : tous les dégâts sont absorbés, l'objet est brisé.
  function sacrificeGear(result: KnTurnResult, id: string) {
    const item = knSacrificeChoices(character.value.inventory).find(entry => entry.id === id)
    if (!item || result.applied || result.minion !== undefined || !result.exchange?.criticalStrike) return
    character.value.inventory = knBreakItem(character.value.inventory, id)
    result.sacrificed = item.name
    result.amount = 0
    result.dealt = 0
    result.applied = true
    log(`${result.name} : ${item.name} sacrifié, le Coup critique est annulé`)
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

  return { combat, level, minions, minionSheetAt, addMinion, drawMinionAction, minionAttack, minionSpell, applySpell, creatureOf, engage, opposed, surpriseAutomatically, attack, attackWithAbilities, markCreature, reactAfterDodge, stripArmor, rerollDamage, setDual, setLamp, spillLamp, applyAttack, drawAction, takeTurn, applyToSurvivor, sacrificeGear, applyToMinion, applyReflect, applySelfEffect, moveText, survivorArmor, log }
}
