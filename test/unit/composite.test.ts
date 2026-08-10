import { describe, it, expect } from 'vitest'
import {
  ASI_DISTRIBUTIONS,
  isValidAbilityDistribution,
  isValidAsiDistribution,
  isValidAsiOrFeat,
  describeCompositeChoice,
} from '../../shared/rules/composite'
import type { AbilityKey } from '../../shared/rules/abilities'

// ─────────────────────────────────────────────────────────────────────────────
// C1 — contrat PUR des choix composites (triade d'origine 2024, ASI/don). Aucune donnée
// seedée n'utilise encore ces kinds → ces validateurs sont le socle que C3 (autorité serveur)
// et l'UI câbleront. Test node pur (pas de DB, pas d'alias ~~).
// ─────────────────────────────────────────────────────────────────────────────

const TRIAD_SOURCE = {
  from: ['str', 'dex', 'con', 'int', 'wis', 'cha'] as AbilityKey[],
  distributions: ['2+1', '1+1+1'] as const,
}

describe('isValidAbilityDistribution (triade 2024)', () => {
  it('accepte 2+1 sur deux carac. autorisées', () => {
    expect(isValidAbilityDistribution({ str: 2, dex: 1 }, TRIAD_SOURCE).ok).toBe(true)
  })
  it('accepte 1+1+1 sur trois', () => {
    expect(isValidAbilityDistribution({ str: 1, dex: 1, con: 1 }, TRIAD_SOURCE).ok).toBe(true)
  })
  it('rejette 3 sur une seule (signature « 3 » absente)', () => {
    const r = isValidAbilityDistribution({ str: 3 }, TRIAD_SOURCE)
    expect(r.ok).toBe(false)
    expect(r.reason).toMatch(/non autorisée/i)
  })
  it('rejette 2+2 (signature « 2+2 » absente des distributions)', () => {
    expect(isValidAbilityDistribution({ str: 2, dex: 2 }, TRIAD_SOURCE).ok).toBe(false)
  })
  it('rejette une carac. hors de `from`', () => {
    const src = { from: ['str', 'dex'] as AbilityKey[], distributions: ['2+1'] as const }
    const r = isValidAbilityDistribution({ str: 2, con: 1 }, src)
    expect(r.ok).toBe(false)
    expect(r.reason).toMatch(/hors des choix/i)
  })
  it('rejette un montant non positif', () => {
    expect(isValidAbilityDistribution({ str: 2, dex: 0 }, TRIAD_SOURCE).ok).toBe(false)
  })
  it('rejette un payload vide', () => {
    expect(isValidAbilityDistribution({}, TRIAD_SOURCE).ok).toBe(false)
  })
})

describe('isValidAsiDistribution (+2 sur une, ou +1 sur deux)', () => {
  it('accepte +2 sur une', () => {
    expect(isValidAsiDistribution({ str: 2 }).ok).toBe(true)
  })
  it('accepte +1 sur deux', () => {
    expect(isValidAsiDistribution({ str: 1, dex: 1 }).ok).toBe(true)
  })
  it('rejette +1 sur trois (règle d\'ASI, distincte de la triade)', () => {
    expect(isValidAsiDistribution({ str: 1, dex: 1, con: 1 }).ok).toBe(false)
  })
  it('rejette +3 sur une', () => {
    expect(isValidAsiDistribution({ str: 3 }).ok).toBe(false)
  })
  it('ASI_DISTRIBUTIONS = le contrat 2014', () => {
    expect([...ASI_DISTRIBUTIONS]).toEqual(['2', '1+1'])
  })
})

describe('isValidAsiOrFeat (branche asi | feat)', () => {
  it('branche asi : délègue à la validation de répartition', () => {
    expect(isValidAsiOrFeat({ branch: 'asi', payload: { str: 2 } }).ok).toBe(true)
    expect(isValidAsiOrFeat({ branch: 'asi', payload: { str: 3 } }).ok).toBe(false)
  })
  it('branche feat : exige un featureId', () => {
    expect(isValidAsiOrFeat({ branch: 'feat', featureId: 42 }).ok).toBe(true)
    // featureId absent (requête forgée) → rejeté par la garde runtime.
    expect(isValidAsiOrFeat({ branch: 'feat', featureId: undefined as unknown as number }).ok).toBe(false)
  })
})

describe('describeCompositeChoice', () => {
  it('ability_scores → forme {abilities, distributions}', () => {
    const shape = describeCompositeChoice('ability_scores', { type: 'abilities', from: ['str', 'dex'], distributions: ['2+1'] })
    expect(shape).toEqual({ kind: 'ability_scores', abilities: ['str', 'dex'], distributions: ['2+1'] })
  })
  it('asi_or_feat → forme {asiDistributions, featCategory}', () => {
    const shape = describeCompositeChoice('asi_or_feat', { type: 'feats', category: 'general' })
    expect(shape).toEqual({ kind: 'asi_or_feat', asiDistributions: ['2', '1+1'], featCategory: 'general' })
  })
  it('kind à liste discrète (subclass) → null', () => {
    expect(describeCompositeChoice('subclass', { type: 'subclasses' })).toBeNull()
  })
})
