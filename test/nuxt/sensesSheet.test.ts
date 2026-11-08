import { describe, it, expect } from 'vitest'
import type { Effect } from '../../server/db/schema/effects'
import { baseScores, classFeature, mountSheet as mount } from './fixtures/mountSheet'

// Les sens de la fiche : la vision dans le noir de l'espèce et les effets de vue des manifestations choisies.

const WARLOCK = 4

const darkvision: Effect[] = [{ type: 'darkvision', value: { range: 18 } }]
const devilsSight = classFeature(1, 'Vision du diable', WARLOCK, 1, [{ type: 'sight_modifier', value: { kind: 'magical_darkness_120' } }])

describe('fiche — sens', () => {
  it('liste la vision dans le noir de l\'espèce', async () => {
    const s = await mount({ scores: baseScores(10, 10, 10, 10), classes: [{ classId: WARLOCK, level: 2 }], speciesEffects: darkvision })
    expect(s.visionRange.value).toBe(18)
    expect(s.senses.value).toEqual(['Vision dans le noir 18 m'])
  })

  it('ajoute les sens que donnent les manifestations', async () => {
    const s = await mount({ scores: baseScores(10, 10, 10, 10), classes: [{ classId: WARLOCK, level: 2 }], speciesEffects: darkvision, features: [devilsSight] })
    expect(s.senses.value).toEqual(['Vision dans le noir 18 m', 'Voit dans les ténèbres, magiques ou non, jusqu\'à 36 m'])
  })

  it('n\'invente aucun sens', async () => {
    const s = await mount({ scores: baseScores(10, 10, 10, 10), classes: [{ classId: WARLOCK, level: 2 }] })
    expect(s.senses.value).toEqual([])
    expect(s.visionRange.value).toBe(0)
  })
})
