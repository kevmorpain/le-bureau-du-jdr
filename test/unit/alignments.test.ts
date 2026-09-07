import { describe, it, expect } from 'vitest'
import {
  ALIGNMENTS,
  ALIGNMENT_CODES,
  DEFAULT_ALIGNMENT,
  alignmentByCode,
  alignmentCodeFromBuilderId,
} from '../../shared/rules/alignments'
import { Alignment } from '../../server/db/schema/character_sheets'
import { ALIGNMENTS as BUILDER_ALIGNMENTS } from '../../app/data/character-builder'

// ─────────────────────────────────────────────────────────────────────────────
// Source canonique des alignements (shared/rules/alignments.ts). Elle a remplacé trois
// copies : l'enum du schéma, la table de conversion du serveur et la liste du builder.
// Ces tests gardent l'alignement de ces trois surfaces.
// ─────────────────────────────────────────────────────────────────────────────

describe('alignements — source canonique', () => {
  it('couvre exactement les 9 valeurs stockables en base (enum Drizzle)', () => {
    expect([...ALIGNMENT_CODES].sort()).toEqual(Object.values(Alignment).sort())
    expect(ALIGNMENTS.map(a => a.code)).toEqual([...ALIGNMENT_CODES])
  })

  it('expose un libellé et une abréviation pour chaque code', () => {
    for (const code of ALIGNMENT_CODES) {
      const info = alignmentByCode(code)
      expect(info?.name, code).toBeTruthy()
      expect(info?.short, code).toBeTruthy()
    }
    expect(alignmentByCode('XX')).toBeNull()
    expect(alignmentByCode(null)).toBeNull()
  })

  it('convertit l\'id du builder en code base (et reste idempotent sur un code)', () => {
    expect(alignmentCodeFromBuilderId('lg')).toBe('LG')
    // Piège historique : le builder nomme le Neutre « n », la base « TN ».
    expect(alignmentCodeFromBuilderId('n')).toBe('TN')
    expect(alignmentCodeFromBuilderId('LG')).toBe('LG')
    expect(alignmentCodeFromBuilderId('TN')).toBe('TN')
  })

  it('retombe sur le neutre par défaut pour une valeur absente ou inconnue', () => {
    expect(alignmentCodeFromBuilderId(undefined)).toBe(DEFAULT_ALIGNMENT)
    expect(alignmentCodeFromBuilderId('')).toBe(DEFAULT_ALIGNMENT)
    expect(alignmentCodeFromBuilderId('inconnu')).toBe(DEFAULT_ALIGNMENT)
    expect(DEFAULT_ALIGNMENT).toBe(Alignment.TrueNeutral)
  })

  it('le builder dérive ses libellés de la source canonique (aucune liste parallèle)', () => {
    expect(BUILDER_ALIGNMENTS.map(a => a.id)).toEqual(ALIGNMENTS.map(a => a.builderId))
    expect(BUILDER_ALIGNMENTS.map(a => a.name)).toEqual(ALIGNMENTS.map(a => a.name))
    expect(BUILDER_ALIGNMENTS.map(a => a.short)).toEqual(ALIGNMENTS.map(a => a.short))
  })
})
