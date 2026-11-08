import { describe, it, expect } from 'vitest'
import { evaluate, type FormulaContext } from '../../shared/utils/formula'
import { resourceGroups, type OwnerClass, type ResourceFeature } from '../../shared/rules/classResources'
import { ELEMENTAL_DISCIPLINES_KNOWN, elementalDisciplineFeatures } from '../../server/db/seeds/data/elemental_disciplines'
import { moineFeatures, moineSubclasses } from '../../server/db/seeds/data/moine'

// Voie des quatre éléments : seize disciplines au choix, payées en ki ; Perfection de l'être rend du ki quand il n'en reste plus.

const context = (level: number): FormulaContext =>
  ({ level, class_level: level, prof_bonus: 2, str_mod: 0, dex_mod: 0, con_mod: 0, int_mod: 0, wis_mod: 0, cha_mod: 0 })

describe('Voie des quatre éléments — données du seed', () => {
  const subclass = moineSubclasses.find(s => s.name === 'Voie des quatre éléments')!
  const disciple = subclass.features.find(f => f.name === 'Disciple des éléments')!

  it('seize disciplines, chacune une option taguée qui coûte du ki', () => {
    expect(elementalDisciplineFeatures).toHaveLength(16)
    expect(new Set(elementalDisciplineFeatures.map(f => f.name)).size).toBe(16)
    for (const f of elementalDisciplineFeatures) {
      expect(f.tag).toBe('elemental_discipline')
      expect(f.meta?.cost).toMatchObject({ resource: 'ki' })
      expect(f.meta!.cost!.amount).toBeGreaterThanOrEqual(1)
      expect(f.featureType).toBe('subclass_feature')
    }
    expect(subclass.features.filter(f => f.tag === 'elemental_discipline')).toHaveLength(16)
  })

  it('un prérequis de niveau 3 (aucun), 6, 11 ou 17', () => {
    const byLevel = (level: number) => elementalDisciplineFeatures.filter(f => f.levelRequired === level).length
    expect([3, 6, 11, 17].map(byLevel)).toEqual([7, 2, 3, 4])
  })

  it('une discipline au niveau 3, puis une aux niveaux 6, 11 et 17 (Lien élémentaire est acquise d\'office)', () => {
    expect([2, 3, 5, 6, 10, 11, 16, 17, 20].map(l => evaluate(ELEMENTAL_DISCIPLINES_KNOWN, context(l)))).toEqual([0, 1, 1, 2, 2, 3, 3, 4, 4])
    expect(disciple.progression).toEqual({
      kind: 'elemental_disciplines',
      count: ELEMENTAL_DISCIPLINES_KNOWN,
      optionSource: { type: 'feature_group', group: 'elemental_discipline' },
      replaceable: true,
    })
  })
})

describe('Ki — Perfection de l\'être', () => {
  const ki = moineFeatures.find(f => f.name === 'Ki')!
  const feature: ResourceFeature = {
    id: 1, name: ki.name, featureType: 'class_feature', classId: 7, levelRequired: ki.levelRequired, meta: ki.meta ?? null,
    maxUsesFormula: ki.maxUsesFormula ?? null, rechargeType: ki.rechargeType ?? null, currentUses: 0, effects: [],
  }
  const classes = (level: number): OwnerClass[] => [{ classId: 7, level }]
  const groupAt = (level: number) => resourceGroups([feature], context(level), classes(level))[0]!

  it('un regain de 4 ki, seulement à réserve vide, à partir du niveau 20', () => {
    expect(ki.meta?.regains).toEqual([{ label: 'Perfection de l\'être', amount: 4, minClassLevel: 20, whenEmpty: true }])
    expect(groupAt(20).regains).toEqual(ki.meta!.regains)
    expect(groupAt(19).regains).toEqual([])
  })

  it('les dépenses de ki du Moine suivent son niveau', () => {
    const labels = (level: number) => groupAt(level).spends.map(s => s.label)
    expect(labels(13)).not.toContain('Âme de diamant')
    expect(labels(14)).toContain('Âme de diamant')
    expect(labels(17)).not.toContain('Vide immaculé')
    expect(labels(18)).toEqual(expect.arrayContaining(['Vide immaculé', 'Projection astrale']))
  })
})
