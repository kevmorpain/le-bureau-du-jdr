import type { Ref } from 'vue'
import type { KnCharacter } from '~~/server/utils/drizzle'
import { knMasteryEntries } from '~~/shared/ker-nethalas/amulets'
import { KN_BOUNDS } from '~~/shared/ker-nethalas/character'
import type { KnMastery } from '~~/shared/ker-nethalas/masteries'
import { KN_COMBAT_XP, knApplySelfEffects, knCombatWonEffects } from '~~/shared/ker-nethalas/masteryEffects'
import type { KnResolvedSheet } from '~~/shared/ker-nethalas/resolve'
import { knEndCombat } from '~~/shared/ker-nethalas/run'
import { knResetUses } from '~~/shared/ker-nethalas/vitals'

// La fin d'un combat : les aptitudes « une fois par combat » se libèrent, l'état du combat disparaît, et une victoire donne
// l'expérience du livre et les gains des Maîtrises.
export function useKnCombatEnd(character: Ref<KnCharacter>, resolved: () => KnResolvedSheet, masteries: () => KnMastery[] | null) {
  const toast = useToast()

  function endCombat() {
    character.value.status = knResetUses(character.value.status, ['combat'])
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

    endCombat()
    toast.add({
      title: kind === 'combat' ? 'Combat remporté' : 'Overseer vaincu',
      description: `+${KN_COMBAT_XP[kind]} XP${effects.length ? ' · gains de Maîtrise appliqués' : ''}`,
      color: 'success',
    })
  }

  return { win, endCombat }
}
