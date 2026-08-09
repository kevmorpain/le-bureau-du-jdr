import { describe, it, expect } from 'vitest'
import { dragonborn, DRAGONBORN_LINEAGE_BY_ANCESTRY } from '../../server/db/seeds/data/dragonborn'
import { characterSpecies } from '../../server/db/seeds/data/character_species'
import { dragonbornAncestryDamageType, allDragonbornAncestries } from '../../shared/utils/draconic_ancestry'

// Rollout lot 6 (chantier lignée, D17) — Drakéide : ÉQUIVALENCE au niveau RÉSOLU (D12). Contrairement
// au trio/Tieffelin (copie brute), l'ancienne fiche résolvait le type de dégâts depuis la COLONNE
// dragonbornAncestry via `dragonbornAncestryDamageType`. On prouve donc que, pour CHAQUE ascendance X,
// la lignée « Dragon <couleur> » porte le type de dégâts CONCRET que l'ancienne colonne=X résolvait —
// donc la même résistance affichée (et le même souffle). Et que la base porte tout le RESTE (les
// effets NON dépendants de l'ascendance) de l'ancienne espèce mono.

interface Eff { type: string, value: unknown }
function stable(v: unknown): string {
  if (v === null || typeof v !== 'object') return JSON.stringify(v)
  if (Array.isArray(v)) return `[${v.map(stable).join(',')}]`
  const o = v as Record<string, unknown>
  return `{${Object.keys(o).sort().map(k => `${JSON.stringify(k)}:${stable(o[k])}`).join(',')}}`
}
const setOf = (effs: Eff[]) => effs.map(e => stable({ type: e.type, value: e.value })).sort()

const legacyTraits = (characterSpecies.find(s => s.name === 'Drakéide (2014)') as { traits: { effects: Eff[] }[] }).traits
const legacyEffects = legacyTraits.flatMap(t => t.effects)
const baseEffects = dragonborn.baseTraits.flatMap(t => (t.effects ?? []) as Eff[])

describe('Drakéide base + lignées ≡ ancienne espèce (équivalence RÉSOLUE, D12)', () => {
  it('couvre exactement les 10 ascendances', () => {
    expect(dragonborn.lineages.length).toBe(10)
    expect(Object.keys(DRAGONBORN_LINEAGE_BY_ANCESTRY).sort()).toEqual([...allDragonbornAncestries].sort())
  })

  for (const key of allDragonbornAncestries) {
    it(`ascendance « ${key} » → lignée « ${DRAGONBORN_LINEAGE_BY_ANCESTRY[key]} » résout ${dragonbornAncestryDamageType[key]}`, () => {
      const lineage = dragonborn.lineages.find(l => l.name === DRAGONBORN_LINEAGE_BY_ANCESTRY[key])
      expect(lineage, `lignée pour ${key}`).toBeDefined()

      const expected = dragonbornAncestryDamageType[key]
      // Résistance concrète == ce que l'ancienne colonne résolvait.
      const resist = lineage!.traits.find(t => t.name === 'Résistance aux dégâts')!.effects![0] as { value: { damageType: string } }
      expect(resist.value.damageType).toBe(expected)
      // Souffle concret : même type de dégâts.
      const breath = lineage!.traits.find(t => t.name === 'Souffle')!.effects![0] as { value: { damage: { damageType: string } } }
      expect(breath.value.damage.damageType).toBe(expected)
    })
  }

  it('la base porte tous les effets NON dépendants de l\'ascendance de l\'ancienne espèce', () => {
    // Legacy privé des effets résolus par l'ascendance (choix / souffle / résistance placeholder).
    const ancestryDependent = new Set(['choice', 'action', 'damage_resistance'])
    const legacyCommon = setOf(legacyEffects.filter(e => !ancestryDependent.has(e.type)))
    expect(setOf(baseEffects)).toEqual(legacyCommon)
  })
})
