import type { Ref } from 'vue'
import type { KnCharacter } from '~~/server/utils/drizzle'
import { KN_BOUNDS } from '~~/shared/ker-nethalas/character'
import type { KnDifficultyKey } from '~~/shared/ker-nethalas/difficulty'
import {
  KN_DEEP_SEARCH_DIE,
  KN_DEEP_SEARCH_EXHAUSTION,
  KN_DOOR_DIE,
  KN_ENCOUNTER_DIE,
  KN_LOCK_DIE,
  KN_TRAP_DIE,
  type KnObstacleAct,
  type KnVisitTable,
} from '~~/shared/ker-nethalas/exploration'
import type { KnResolvedSheet } from '~~/shared/ker-nethalas/resolve'
import {
  knAddDoorObstacle,
  knAddRoomTrap,
  knCurrentVisit,
  knFinishTrap,
  knMarkEventOutcome,
  knMarkScavengeApplied,
  knMarkScavengeOutcome,
  knObstacleState,
  knRecordDeepSearchContent,
  knRecordDescription,
  knRecordDoor,
  knRecordEncounter,
  knRecordEvent,
  knRecordExtraDarkness,
  knRecordExtraTension,
  knRecordLock,
  knRecordScavenge,
  knRecordTrap,
  knRecordTrapType,
  knResolveForce,
  knResolvePick,
  knResolveTrapAction,
  knRollDie,
  knSetPerception,
  knStartDeepSearch,
  knStartPick,
  knTriggerTrap,
  knDrawGrowingDarkness,
} from '~~/shared/ker-nethalas/run'
import {
  KN_EXPLORATION_TABLES,
  knApplyTableEffects,
  knOutcomeAvailable,
  knTableEntry,
  type KnExplorationTableName,
  type KnRollTable,
  type KnTableEffect,
} from '~~/shared/ker-nethalas/tables'

type Tables = Partial<Record<KnExplorationTableName, KnRollTable | null>>

const TABLE_RECORDS = {
  description: knRecordDescription,
  encounter: knRecordEncounter,
  event: knRecordEvent,
  door: knRecordDoor,
  scavenge: knRecordScavenge,
}

const OBSTACLE_RECORDS = { trap: knRecordTrap, trapType: knRecordTrapType, lock: knRecordLock }
const OBSTACLE_DICE = { trap: KN_TRAP_DIE, trapType: KN_EXPLORATION_TABLES.traps.die, lock: KN_LOCK_DIE }

export function useKnExploration(character: Ref<KnCharacter>, resolved: () => KnResolvedSheet, tables: () => Tables) {
  const toast = useToast()
  const { outcomeText } = useKnEffectText()

  function tableDie(name: KnVisitTable) {
    if (name === 'encounter') return KN_ENCOUNTER_DIE
    if (name === 'door') return KN_DOOR_DIE
    if (name === 'event') return KN_EXPLORATION_TABLES.events.die
    if (name === 'scavenge') return KN_EXPLORATION_TABLES.scavenging.die
    return knCurrentVisit(character.value.run)?.kind === 'corridor'
      ? KN_EXPLORATION_TABLES.corridorDescriptions.die
      : KN_EXPLORATION_TABLES.roomDescriptions.die
  }

  function tableRoll(name: KnVisitTable, manual?: number) {
    const roll = manual ?? knRollDie(tableDie(name))
    character.value.run = TABLE_RECORDS[name](character.value.run, roll)
  }

  // Applique des gains et des pertes à la fiche et le dit dans un message ; rend rien si la liste est vide.
  function applyEffects(effects: readonly KnTableEffect[], title: string) {
    if (!effects.length) return
    const c = character.value
    const maxVitals = resolved().maxVitals
    const before = c.healthCurrent
    const { state, outcomes } = knApplyTableEffects(effects, {
      coins: c.coins,
      xp: c.xp,
      provisions: c.provisions,
      health: c.healthCurrent,
      toughness: c.toughnessCurrent,
      sanity: c.sanityCurrent,
      aether: c.aetherCurrent,
      exhaustion: c.exhaustion,
      status: c.status,
      run: c.run,
    }, {
      health: maxVitals.health.effective,
      toughness: maxVitals.toughness.effective,
      sanity: maxVitals.sanity.effective,
      aether: maxVitals.aether.effective,
    })

    c.coins = state.coins
    c.xp = state.xp
    c.provisions = state.provisions
    c.healthCurrent = state.health
    c.toughnessCurrent = state.toughness
    c.sanityCurrent = state.sanity
    c.aetherCurrent = state.aether
    c.exhaustion = state.exhaustion
    c.status = state.status
    c.run = state.run

    const dies = before > 0 && state.health === 0
    toast.add({
      title,
      description: [...outcomes.map(outcomeText), ...(dies ? ['La Santé tombe à 0 : le survivant meurt.'] : [])].join(' · '),
      color: dies ? 'error' : 'success',
    })
  }

  function applyScavenge() {
    const c = character.value
    const visit = knCurrentVisit(c.run)
    const effects = knTableEntry(tables().scavenging ?? null, visit?.scavenge?.roll ?? 0)?.effects ?? []
    if (!visit?.scavenge || visit.scavenge.applied || !effects.length) return
    applyEffects(effects, 'Fouille appliquée')
    c.run = knMarkScavengeApplied(c.run)
  }

  // Un résultat (réussite, échec, choix) d'une entrée d'événement ou de fouille : appliqué une fois.
  function takeOutcome(target: 'event' | 'scavenge', index: number) {
    const c = character.value
    const visit = knCurrentVisit(c.run)
    const source = target === 'event' ? visit?.event : visit?.scavenge
    const entry = source ? knTableEntry(tables()[target === 'event' ? 'events' : 'scavenging'] ?? null, source.roll) : undefined
    const outcomes = entry?.outcomes ?? []
    if (!source || !knOutcomeAvailable(outcomes, source.taken ?? [], index)) return
    applyEffects(outcomes[index]!.effects, target === 'event' ? 'Événement appliqué' : 'Fouille appliquée')
    c.run = target === 'event' ? knMarkEventOutcome(c.run, index) : knMarkScavengeOutcome(c.run, index)
  }

  const addDoor = () => {
    character.value.run = knAddDoorObstacle(character.value.run)
  }

  const addRoomTrap = () => {
    character.value.run = knAddRoomTrap(character.value.run)
  }

  // La fouille approfondie coûte tout de suite un test de Dé de Tension et de l'Épuisement.
  function deepSearch(manual?: number) {
    const c = character.value
    const next = knStartDeepSearch(c.run, manual ?? knRollDie(c.run.tensionDie), manual !== undefined)
    if (next === c.run) return
    c.run = next
    c.exhaustion = Math.min(KN_BOUNDS.exhaustion.max, c.exhaustion + KN_DEEP_SEARCH_EXHAUSTION)
  }

  function deepSearchContent(manual?: number) {
    character.value.run = knRecordDeepSearchContent(character.value.run, manual ?? knRollDie(KN_DEEP_SEARCH_DIE))
  }

  function perception(index: number, result: 'passed' | 'failed') {
    character.value.run = knSetPerception(character.value.run, index, result)
  }

  function obstacleRoll(index: number, step: keyof typeof OBSTACLE_RECORDS, manual?: number) {
    character.value.run = OBSTACLE_RECORDS[step](character.value.run, index, manual ?? knRollDie(OBSTACLE_DICE[step]))
  }

  // Chaque tentative pour forcer un verrou fait du bruit.
  function noise(manual?: number) {
    const c = character.value
    const before = knCurrentVisit(c.run)?.extraTension?.length ?? 0
    c.run = knRecordExtraTension(c.run, manual ?? knRollDie(c.run.tensionDie), manual !== undefined, 'noise')
    const check = knCurrentVisit(c.run)?.extraTension?.at(-1)
    if ((knCurrentVisit(c.run)?.extraTension?.length ?? 0) === before || !check) return
    toast.add({
      title: 'Vacarme',
      description: check.triggered
        ? `Dé de Tension D${check.die} : déclenché. Un événement de l'Obscurité Grandissante est à tirer.`
        : `Dé de Tension D${check.die} → ${check.roll}${check.next === check.die ? ', inchangé' : `, descend à D${check.next}`}.`,
      color: check.triggered ? 'warning' : 'neutral',
    })
  }

  function extraDraw(index: number) {
    character.value.run = knRecordExtraDarkness(character.value.run, index, knDrawGrowingDarkness())
  }

  function sufferTrap(index: number) {
    const c = character.value
    const obstacle = knCurrentVisit(c.run)?.obstacles?.[index]
    if (!obstacle || obstacle.trapState !== 'triggering' || !obstacle.trapType) return
    const outcomes = knTableEntry(tables().traps ?? null, obstacle.trapType.roll)?.outcomes ?? []
    const taken = outcomes.flatMap((outcome, i) => outcome.when === 'failure' ? [i] : [])
    applyEffects(taken.flatMap(i => outcomes[i]!.effects), 'Piège subi')
    c.run = knFinishTrap(c.run, index, false, taken)
  }

  function obstacleAct(index: number, act: KnObstacleAct) {
    const c = character.value
    const obstacle = knCurrentVisit(c.run)?.obstacles?.[index]
    if (!obstacle) return
    if (act.startsWith('startPick:')) {
      c.run = knStartPick(c.run, index, act.slice('startPick:'.length) as KnDifficultyKey)
      return
    }

    if (act === 'disarmed' || act === 'disarmFailed') c.run = knResolveTrapAction(c.run, index, 'disarm', act === 'disarmed')
    else if (act === 'bypassed' || act === 'bypassFailed') c.run = knResolveTrapAction(c.run, index, 'bypass', act === 'bypassed')
    else if (act === 'trigger') c.run = knTriggerTrap(c.run, index)
    else if (act === 'avoided') c.run = knFinishTrap(c.run, index, true)
    else if (act === 'suffered') sufferTrap(index)
    else if (act === 'pickOpened') c.run = knResolvePick(c.run, index, true)
    else if (act === 'pickFailed') {
      const state = knObstacleState(obstacle)
      c.run = knResolvePick(c.run, index, false)
      if (state.canWorkLock && obstacle.pick) c.provisions = { ...c.provisions, lockpicks: Math.max(0, c.provisions.lockpicks - 1) }
    } else if (act === 'forceOpened' || act === 'forceFailed') {
      if (!knObstacleState(obstacle).canWorkLock) return
      c.run = knResolveForce(c.run, index, act === 'forceOpened')
      noise()
    }
  }

  return { tableRoll, applyScavenge, takeOutcome, addDoor, addRoomTrap, deepSearch, deepSearchContent, perception, obstacleRoll, noise, extraDraw, obstacleAct }
}
