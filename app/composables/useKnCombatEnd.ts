import type { Ref } from 'vue'
import type { KnCharacter } from '~~/server/utils/drizzle'
import { knMasteryEntries } from '~~/shared/ker-nethalas/amulets'
import { KN_BOUNDS } from '~~/shared/ker-nethalas/character'
import { knClearCombatEffects } from '~~/shared/ker-nethalas/combatEffects'
import { knRollIntegrity, type KnIntegrityResult } from '~~/shared/ker-nethalas/equipment'
import { knFindCreature, type KnCreature } from '~~/shared/ker-nethalas/creatures'
import type { KnGoalEvent } from '~~/shared/ker-nethalas/goalCounts'
import type { KnMastery } from '~~/shared/ker-nethalas/masteries'
import { KN_XP } from '~~/shared/ker-nethalas/experience'
import { knApplySelfEffects, knCombatWonEffects } from '~~/shared/ker-nethalas/masteryEffects'
import type { KnResolvedSheet } from '~~/shared/ker-nethalas/resolve'
import { knDefeatOverseer, knEndCombat, knHealMinions } from '~~/shared/ker-nethalas/run'
import { knResetUses } from '~~/shared/ker-nethalas/vitals'

// La fin d'un combat : le survivant récupère D4 Robustesse, les aptitudes « une fois par combat » se libèrent et l'état du
// combat disparaît. Une victoire donne en plus l'expérience du livre et les gains des Maîtrises.
export function useKnCombatEnd(
  character: Ref<KnCharacter>,
  resolved: () => KnResolvedSheet,
  masteries: () => KnMastery[] | null,
  bestiary: () => KnCreature[] | null = () => null,
) {
  const toast = useToast()
  const { applyEffects } = useKnApplyEffects(character, resolved)
  const { record } = useKnGoalProgress(character)

  // Chaque adversaire vaincu fait avancer les objectifs, avec son type, la compétence du coup fatal et son rang d'Overseer.
  // Une créature éphémère qui a disparu après son action n'a pas été vaincue.
  function recordDefeats() {
    const combat = character.value.run.combat
    if (!combat) return
    record(...combat.creatures.flatMap<KnGoalEvent>((creature, index) => creature.health > 0 || creature.spent
      ? []
      : [{
          kind: 'defeat',
          types: knFindCreature(bestiary(), creature.ref)?.types ?? [],
          ...(creature.slainBy ? { skill: creature.slainBy } : {}),
          ...(combat.overseer && index === 0 ? { overseer: true } : {}),
        }]))
  }

  // Les pièces d'équipement qui ont servi (armure qui a encaissé, bouclier qui a paré) jouent leur dé d'Intégrité.
  function rollIntegrity() {
    const used = character.value.run.combat?.gearUsed ?? []
    const results: KnIntegrityResult[] = []
    let items = character.value.inventory
    for (const id of used) {
      const rolled = knRollIntegrity(items, id)
      items = rolled.items
      if (rolled.result) results.push(rolled.result)
    }
    if (!results.length) return
    character.value.inventory = items
    const line = (r: KnIntegrityResult) => `${r.name} : D${r.die} → ${r.roll}${r.outcome === 'held' ? '' : r.outcome === 'down' ? `, Intégrité D${r.to}` : ', perdu'}`
    toast.add({
      title: 'Intégrité de l\'équipement',
      description: results.map(line).join(' · '),
      color: results.some(r => r.outcome !== 'held') ? 'warning' : 'neutral',
    })
  }

  function endCombat() {
    recordDefeats()
    rollIntegrity()
    applyEffects([{ kind: 'vital', vital: 'toughness', dice: { count: 1, sides: 4, bonus: 0 }, sign: 'gain' }], 'Fin du combat')
    character.value.status = knClearCombatEffects(knResetUses(character.value.status, ['combat']))
    character.value.run = knHealMinions(knEndCombat(character.value.run))
  }

  // Un combat engagé par erreur : on retire l'état, sans rien récupérer ni libérer.
  function cancelCombat() {
    character.value.status = knClearCombatEffects(character.value.status)
    character.value.run = knEndCombat(character.value.run)
  }

  function win(kind: 'combat' | 'overseer') {
    const c = character.value
    const maxVitals = resolved().maxVitals
    c.xp = Math.min(KN_BOUNDS.xp.max, c.xp + KN_XP[kind])
    if (kind === 'overseer') {
      applyEffects([{ kind: 'vital', vital: 'sanity', dice: { count: 1, sides: 4, bonus: 0 }, sign: 'gain' }], 'Overseer vaincu')
      c.run = knDefeatOverseer(c.run)
    }

    const known = masteries()
    const effects = known ? knCombatWonEffects(known, knMasteryEntries(c.masteryPicks, c.amulets)) : []
    if (effects.length) {
      const { state } = knApplySelfEffects(effects, {
        toughness: c.toughnessCurrent,
        toughnessMax: maxVitals.toughness.effective,
        health: c.healthCurrent,
        healthMax: maxVitals.health.effective,
        sanity: c.sanityCurrent,
        sanityMax: maxVitals.sanity.effective,
        aether: c.aetherCurrent,
        aetherMax: maxVitals.aether.effective,
        status: c.status,
      })
      c.toughnessCurrent = state.toughness
      c.healthCurrent = state.health
      c.sanityCurrent = state.sanity
      c.aetherCurrent = state.aether
      c.status = state.status
    }

    toast.add({
      title: kind === 'combat' ? 'Combat remporté' : 'Overseer vaincu',
      description: `+${KN_XP[kind]} XP${kind === 'overseer' ? ' · +D4 Santé mentale · ses influences cessent' : ''}${effects.length ? ' · gains de Maîtrise appliqués' : ''}`,
      color: 'success',
    })
    endCombat()
  }

  return { win, endCombat, cancelCombat }
}
