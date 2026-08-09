import { describe, it, expect } from 'vitest'
import { dwarf } from '../../server/db/seeds/data/dwarf'
import { halfling } from '../../server/db/seeds/data/halfling'
import { gnome } from '../../server/db/seeds/data/gnome'
import { tiefling } from '../../server/db/seeds/data/tiefling'
import { characterSpecies } from '../../server/db/seeds/data/character_species'
import type { LineageSpeciesData } from '../../server/db/seeds/lib/seedLineages'

// Chantier lignée (D17), rollout lot 6 — ÉQUIVALENCE AU NIVEAU DONNÉE (D12), généralisée au trio
// Nain/Halfelin/Gnome (l'elfe a son propre `elfLineageEquivalence.test.ts`). Prouve, AVANT toute
// logique de seed ou de dérivation, que « base + lignée » est fidèle : pour chaque lignée,
// l'ENSEMBLE des effets (base ⊕ lignée) est exactement celui de l'ancienne espèce séparée. C'est le
// filet qui garantit qu'un perso migré ne change pas de règles.

interface Trait { effects?: unknown[] }

/** Sérialisation stable (clés triées récursivement) d'un effet, pour comparer des ENSEMBLES. */
function stable(v: unknown): string {
  if (v === null || typeof v !== 'object') return JSON.stringify(v)
  if (Array.isArray(v)) return `[${v.map(stable).join(',')}]`
  const o = v as Record<string, unknown>
  return `{${Object.keys(o).sort().map(k => `${JSON.stringify(k)}:${stable(o[k])}`).join(',')}}`
}

/** Multiset trié des effets d'une liste de traits. */
function effectSet(traits: Trait[]): string[] {
  return traits.flatMap(t => t.effects ?? []).map(stable).sort()
}

/**
 * Alias nom de LIGNÉE → nom de l'ancienne ESPÈCE séparée (quand ils diffèrent). Le trio est
 * homonyme (« Nain des collines » … == l'ancienne espèce) ; le Tieffelin a la base homonyme de
 * l'ancienne espèce mono → celle-ci est renommée « Tieffelin (Asmodée) ».
 */
const LEGACY_ALIAS: Record<string, string> = { 'Asmodée': 'Tieffelin (Asmodée)' }

const SPECIES: LineageSpeciesData[] = [dwarf, halfling, gnome, tiefling]

describe('Trio base + lignée ≡ anciennes espèces (équivalence donnée, D12)', () => {
  for (const sp of SPECIES) {
    for (const lin of sp.lineages) {
      const speciesName = LEGACY_ALIAS[lin.name] ?? lin.name
      it(`${sp.name} / ${lin.name} : base ⊕ lignée == ancienne espèce « ${speciesName} »`, () => {
        const rebuilt = effectSet([...sp.baseTraits, ...lin.traits])
        const old = characterSpecies.find(s => s.name === speciesName) as { traits: Trait[] } | undefined
        expect(old, `ancienne espèce ${speciesName}`).toBeDefined()
        expect(rebuilt).toEqual(effectSet(old!.traits))
      })
    }

    it(`${sp.name} : la base ne contient QUE des effets communs à toutes ses lignées`, () => {
      const base = effectSet(sp.baseTraits)
      const olds = sp.lineages.map(l => new Set(effectSet(
        (characterSpecies.find(s => s.name === (LEGACY_ALIAS[l.name] ?? l.name)) as { traits: Trait[] }).traits,
      )))
      for (const e of base) {
        for (const set of olds) expect(set.has(e), `effet de base absent d'une lignée : ${e}`).toBe(true)
      }
    })
  }
})
