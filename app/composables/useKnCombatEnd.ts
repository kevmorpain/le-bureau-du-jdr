import type { Ref } from 'vue'
import type { KnCharacter } from '~~/server/utils/drizzle'
import { knMasteryEntries } from '~~/shared/ker-nethalas/amulets'
import { KN_BOUNDS } from '~~/shared/ker-nethalas/character'
import { knClearCombatEffects } from '~~/shared/ker-nethalas/combatEffects'
import { knRollIntegrity, type KnIntegrityResult } from '~~/shared/ker-nethalas/equipment'
import type { KnMastery } from '~~/shared/ker-nethalas/masteries'
import { KN_COMBAT_XP, knApplySelfEffects, knCombatWonEffects } from '~~/shared/ker-nethalas/masteryEffects'
import type { KnResolvedSheet } from '~~/shared/ker-nethalas/resolve'
import { knEndCombat, knHealMinions } from '~~/shared/ker-nethalas/run'
import { knResetUses } from '~~/shared/ker-nethalas/vitals'

// La fin d'un combat : le survivant récupère D4 Robustesse, les aptitudes « une fois par combat » se libèrent et l'état du
// combat disparaît. Une victoire donne en plus l'expérience du livre et les gains des Maîtrises.
export function useKnCombatEnd(character: Ref<KnCharacter>, resolved: () => KnResolvedSheet, masteries: () => KnMastery[] | null) {
  const toast = useToast()
  const { applyEffects } = useKnApplyEffects(character, resolved)

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

  function win(kind: keyof typeof KN_COMBAT_XP) {
    const c = character.value
    const maxVitals = resolved().maxVitals
    c.xp = Math.min(KN_BOUNDS.xp.max, c.xp + KN_COMBAT_XP[kind])

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
      description: `+${KN_COMBAT_XP[kind]} XP${effects.length ? ' · gains de Maîtrise appliqués' : ''}`,
      color: 'success',
    })
    endCombat()
  }

  return { win, endCombat, cancelCombat }
}
