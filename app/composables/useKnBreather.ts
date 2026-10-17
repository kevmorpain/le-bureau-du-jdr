import type { Ref } from 'vue'
import type { KnCharacter } from '~~/server/utils/drizzle'
import { knTakeBreather } from '~~/shared/ker-nethalas/camp'
import type { KnResolvedSheet } from '~~/shared/ker-nethalas/resolve'
import { knCurrentDomain, knMarkRest } from '~~/shared/ker-nethalas/run'
import { knRest } from '~~/shared/ker-nethalas/vitals'

// Prendre son souffle : les gains et les coûts s'appliquent à la fiche, le repos s'inscrit sur la pièce où l'on est, et ce qui change
// se dit en quelques lignes.
export function useKnBreather(character: Ref<KnCharacter>, resolved: () => KnResolvedSheet) {
  const { signed } = useKnLabels()
  const lines = ref<string[]>([])

  function takeBreather() {
    const c = character.value
    const before = {
      toughness: c.toughnessCurrent,
      health: c.healthCurrent,
      exhaustion: c.exhaustion,
      light: c.run.lightRemaining,
      tensionDie: c.run.tensionDie,
    }
    const result = knTakeBreather({
      toughness: before.toughness,
      toughnessMax: resolved().maxVitals.toughness.effective,
      health: before.health,
      healthMax: resolved().maxVitals.health.effective,
      exhaustion: before.exhaustion,
      lightRemaining: before.light,
      tensionDie: before.tensionDie,
    })

    c.toughnessCurrent = result.toughness
    c.healthCurrent = result.health
    c.exhaustion = result.exhaustion
    c.run.lightRemaining = result.lightRemaining
    c.run.tensionDie = result.tensionDie
    c.run = knMarkRest(c.run, 'breather')
    c.status = knRest(c.status, 'breather')

    const text = [
      [
        `Robustesse ${signed(result.toughness - before.toughness)} (D10 : ${result.toughnessRoll} + 2)`,
        `Santé ${signed(result.health - before.health)}`,
        `Épuisement ${signed(result.exhaustion - before.exhaustion)}`,
        `lumière ${signed(result.lightRemaining - before.light)}`,
        result.tensionDie === before.tensionDie ? `Dé de Tension : reste à D${before.tensionDie}` : `Dé de Tension : D${before.tensionDie} → D${result.tensionDie}`,
      ].join(' · '),
    ]
    if (knCurrentDomain(c.run).growingDarkness.some(event => event.key === 'gd_15_16')) {
      text.push('Un événement de l\'Obscurité Grandissante demande aussi un test de Dé de Tension tout de suite.')
    }
    if (c.status.rotStage >= 1) text.push('Pourriture : test d\'Endurance, sinon elle avance d\'un stade.')
    lines.value = text
    return text
  }

  return { takeBreather, lines }
}
