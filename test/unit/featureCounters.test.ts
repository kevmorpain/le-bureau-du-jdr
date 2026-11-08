import { describe, it, expect } from 'vitest'
import type { FeatureDef } from '../../server/db/seeds/lib/seedClass'
import { maneuverFeatures } from '../../server/db/seeds/data/maneuvers'
import { grandAncienFeatures } from '../../server/db/seeds/data/warlock'
import { warlockInvocationFeatures } from '../../server/db/seeds/data/warlock_invocations'
import { warlockPactBoonFeatures } from '../../server/db/seeds/data/warlock_progression'
import { SEED_CLASSES } from '../fixtures/featureCounterPatches'
import { RESOURCE_KEYS } from '~~/shared/rules/classResources'

const outsideClasses = (where: string, defs: FeatureDef[]) => defs.map(def => ({ where: `${where} / ${def.name}`, def }))

const seeded: { where: string, def: FeatureDef }[] = [
  ...SEED_CLASSES.flatMap(c => [
    ...outsideClasses(c.name, c.features),
    ...c.subclasses.flatMap(s => outsideClasses(`${c.name} / ${s.name}`, s.features)),
  ]),
  ...outsideClasses('Occultiste (Grand Ancien)', grandAncienFeatures),
  ...outsideClasses('Occultiste (pacte)', warlockPactBoonFeatures),
  ...outsideClasses('Occultiste (invocations)', warlockInvocationFeatures),
  ...outsideClasses('Guerrier (manœuvres)', maneuverFeatures),
]

// Une recharge sans compteur ni réserve ne fait rien : la fiche n'affiche rien et le repos remet à zéro un usage que
// personne ne compte (C10, #231).
describe('capacités de classe — recharge et compteur', () => {
  it('une capacité qui déclare une recharge porte un compteur ou paie une réserve', () => {
    const orphans = seeded
      .filter(({ def }) => def.rechargeType && def.maxUsesFormula == null && !def.meta?.resource && !def.meta?.cost)
      .map(({ where }) => where)
    expect(orphans).toEqual([])
  })

  it('une capacité qui paie une réserve nomme une réserve que porte une autre capacité, et n\'a pas de recharge propre', () => {
    const reserves = new Set(seeded.flatMap(({ def }) => (def.meta?.resource ? [def.meta.resource] : [])))
    for (const { where, def } of seeded.filter(({ def }) => def.meta?.cost)) {
      expect(RESOURCE_KEYS, where).toContain(def.meta!.cost!.resource)
      expect(reserves.has(def.meta!.cost!.resource), where).toBe(true)
      expect(def.rechargeType ?? null, where).toBeNull()
    }
  })
})
