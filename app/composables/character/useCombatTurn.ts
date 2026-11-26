import { useClassResources } from './useClassResources'
import { useCombatTracker, type InitiativeRecord } from './useCombatTracker'
import { idlePending, type RollEngine } from './useCharacterRolls'
import type { SlotsByType } from './useCharacterSpellcasting'

// A page that provides the roll engine and the slots cannot inject them in its own setup: it passes them.
export const useCombatTurn = (characterSheet: Ref<CharacterSheet>, options: { engine?: RollEngine, slots?: Ref<SlotsByType> } = {}) => {
  const tracker = useCombatTracker(characterSheet.value.id)
  const { initiativeBonus, resolvedFeatures, featuresLapsingWithoutCombat, elapseDurations } = useCharacterSheet(characterSheet)
  const { setActive } = useClassResources(characterSheet, options.slots ?? inject<Ref<SlotsByType> | undefined>('spellSlots', undefined))
  const { roll, engine, history, rollsEnabled } = useDiceRoller(options.engine)

  const rollInitiative = ({ silent = false } = {}): InitiativeRecord | null => {
    engine.pending.value = idlePending()
    if (!rollsEnabled.value) return null
    roll('Initiative', initiativeBonus.value, 20, 1, { d20: { type: 'initiative' }, silent })
    const entry = history.entries.value[0]!
    return { total: entry.result, natural: entry.natural }
  }

  const startCombat = (initiative: InitiativeRecord | null) => {
    engine.pending.value = idlePending()
    tracker.start(initiative)
  }

  const endCombat = () => {
    engine.pending.value = idlePending()
    tracker.reset()
  }

  // Chaque round qui passe fait aussi avancer les durées des sorts, effets et états suivis.
  const advanceRound = ({ announce = true } = {}) => {
    tracker.nextRound()
    return elapseDurations({ announce })
  }

  // La fiche ne sait ni qui est hostile ni ce qui a été frappé : c'est au joueur de dire si la capacité (Rage) a été entretenue.
  const lapseQuestion = computed(() => featuresLapsingWithoutCombat.value.filter(f => tracker.lapseAsked.value.includes(f.id)))

  const keepLapsed = () => {
    tracker.lapseAsked.value = []
  }

  const endLapsed = async () => {
    const lapsed = lapseQuestion.value
    tracker.lapseAsked.value = []
    for (const feature of lapsed) await setActive(feature.id, false, undefined)
  }

  const newTurn = ({ announce = true } = {}) => {
    tracker.resetTurn()
    const elapsed = advanceRound({ announce })
    for (const feature of resolvedFeatures.value) {
      if (feature.active && feature.meta?.endsOnNewTurn) setActive(feature.id, false, undefined)
    }
    tracker.lapseAsked.value = featuresLapsingWithoutCombat.value.map(f => f.id)
    return elapsed
  }

  return { ...tracker, rollInitiative, startCombat, endCombat, advanceRound, newTurn, lapseQuestion, keepLapsed, endLapsed }
}
