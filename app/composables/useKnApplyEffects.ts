import type { Ref } from 'vue'
import type { KnCharacter } from '~~/server/utils/drizzle'
import type { KnResolvedSheet } from '~~/shared/ker-nethalas/resolve'
import { knMagicDefenses } from '~~/shared/ker-nethalas/magicEffects'
import { knApplyTableEffects, type KnEffectScale, type KnTableEffect } from '~~/shared/ker-nethalas/tables'

// Applique à la fiche des gains et des pertes (pièces, provisions, XP, jauges, dégâts, états…) et le dit dans un message.
export function useKnApplyEffects(character: Ref<KnCharacter>, resolved: () => KnResolvedSheet) {
  const toast = useToast()
  const { outcomeText } = useKnEffectText()
  const { record } = useKnGoalProgress(character)

  function applyEffects(effects: readonly KnTableEffect[], title: string, options: { creature?: boolean, scale?: KnEffectScale } = {}) {
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
    }, undefined, { ...options, immune: knMagicDefenses(c.inventory).immune })

    const earned = state.coins - c.coins
    c.coins = state.coins
    if (earned > 0) record({ kind: 'coins', amount: earned })
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

  return { applyEffects }
}
