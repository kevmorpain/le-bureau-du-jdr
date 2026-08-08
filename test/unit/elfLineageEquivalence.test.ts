import { describe, it, expect } from 'vitest'
import { elf } from '../../server/db/seeds/data/elf'
import { characterSpecies } from '../../server/db/seeds/data/character_species'

// Chantier lignée (D17), pilote Elfe — ÉQUIVALENCE AU NIVEAU DONNÉE (D12). Prouve, AVANT toute
// logique de seed ou de dérivation, que la restructuration « Elfe base + lignée » est fidèle :
// pour chaque lignée, l'ENSEMBLE des effets (traits de base ⊕ traits de lignée) est exactement
// celui de l'ancienne espèce séparée correspondante. C'est le filet qui garantit qu'un perso
// migré ne change pas de règles. Le split place vitesse/vision/armes sur les lignées (elles
// diffèrent) → l'équivalence est une UNION, sans effet qui en écrase un autre.

interface Trait { effects: unknown[] }

/** Sérialisation stable (clés triées récursivement) d'un effet, pour comparer des ENSEMBLES. */
function stable(v: unknown): string {
  if (v === null || typeof v !== 'object') return JSON.stringify(v)
  if (Array.isArray(v)) return `[${v.map(stable).join(',')}]`
  const o = v as Record<string, unknown>
  return `{${Object.keys(o).sort().map(k => `${JSON.stringify(k)}:${stable(o[k])}`).join(',')}}`
}

/** Multiset trié des effets d'une liste de traits. */
function effectSet(traits: Trait[]): string[] {
  return traits.flatMap(t => t.effects).map(stable).sort()
}

const CASES = [
  { lineage: 'Haut-elfe', species: 'Haut-elfe' },
  { lineage: 'Elfe des bois', species: 'Elfe des bois' },
  // La lignée « Drow » (renommée, lot 5c) correspond à l'ancienne espèce séparée « Elfe noir ».
  { lineage: 'Drow', species: 'Elfe noir' },
]

describe('Elfe base + lignée ≡ anciennes espèces (équivalence donnée, D12)', () => {
  for (const { lineage, species } of CASES) {
    it(`${lineage} : base ⊕ lignée == ancienne espèce « ${species} »`, () => {
      const lin = elf.lineages.find(l => l.name === lineage)!
      const rebuilt = effectSet([...elf.baseTraits, ...lin.traits] as Trait[])

      const old = characterSpecies.find(s => s.name === species) as { traits: Trait[] } | undefined
      expect(old, `ancienne espèce ${species}`).toBeDefined()
      const original = effectSet(old!.traits)

      expect(rebuilt).toEqual(original)
    })
  }

  it('la base ne contient QUE des effets communs aux trois lignées (aucun effet variable)', () => {
    // Un effet de base doit apparaître à l'identique dans les 3 anciennes espèces.
    const base = effectSet(elf.baseTraits as Trait[])
    const olds = CASES.map(c => new Set(effectSet(
      (characterSpecies.find(s => s.name === c.species) as { traits: Trait[] }).traits,
    )))
    for (const e of base) {
      for (const set of olds) expect(set.has(e), `effet de base absent d'une lignée : ${e}`).toBe(true)
    }
  })
})
