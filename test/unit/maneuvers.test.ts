import { describe, it, expect } from 'vitest'
import { evaluate, type Formula, type FormulaContext } from '../../shared/utils/formula'
import { deriveClassTraits, resourceGroups, saveDcOf, type OwnerClass, type ResourceFeature } from '../../shared/rules/classResources'
import { featurePicksError } from '../../shared/rules/featurePicks'
import type { ResolvedChoice } from '../../shared/rules/resolve'
import { MANEUVERS_KNOWN, SUPERIORITY_DICE_COUNT, SUPERIORITY_DIE, maneuverFeatures } from '../../server/db/seeds/data/maneuvers'
import { guerrierSubclasses } from '../../server/db/seeds/data/guerrier'

// Maître de guerre : seize manœuvres au choix, payées par des dés de supériorité qui se regagnent au repos court.

const context = (level: number, prof = 2): FormulaContext =>
  ({ level, class_level: level, prof_bonus: prof, str_mod: 0, dex_mod: 0, con_mod: 0, int_mod: 0, wis_mod: 0, cha_mod: 0 })
const at = (formula: Formula, classLevel: number) => evaluate(formula, context(classLevel))

describe('Maître de guerre — données du seed', () => {
  const battleMaster = guerrierSubclasses.find(s => s.name === 'Maître de guerre')!
  const superiority = battleMaster.features.find(f => f.name === 'Supériorité martiale')!

  it('seize manœuvres, chacune une option taguée qui coûte un dé de supériorité', () => {
    expect(maneuverFeatures).toHaveLength(16)
    expect(new Set(maneuverFeatures.map(f => f.name)).size).toBe(16)
    for (const f of maneuverFeatures) {
      expect(f.tag).toBe('maneuver')
      expect(f.meta?.cost).toEqual({ resource: 'superiority_dice', amount: 1 })
      expect(f.featureType).toBe('subclass_feature')
    }
    expect(battleMaster.features.filter(f => f.tag === 'maneuver')).toHaveLength(16)
  })

  it('trois manœuvres au niveau 3, puis deux de plus aux niveaux 7, 10 et 15', () => {
    expect([2, 3, 6, 7, 9, 10, 14, 15, 20].map(l => at(MANEUVERS_KNOWN, l))).toEqual([0, 3, 3, 5, 5, 7, 7, 9, 9])
    expect(superiority.progression).toEqual({ kind: 'maneuvers', count: MANEUVERS_KNOWN, optionSource: { type: 'feature_group', group: 'maneuver' }, replaceable: true })
  })

  it('quatre dés de supériorité, cinq au niveau 7, six au niveau 15 ; d8, d10 au niveau 10, d12 au niveau 18', () => {
    expect([3, 6, 7, 14, 15, 20].map(l => at(SUPERIORITY_DICE_COUNT, l))).toEqual([4, 4, 5, 5, 6, 6])
    expect([3, 9, 10, 17, 18, 20].map(l => at(SUPERIORITY_DIE, l))).toEqual([8, 8, 10, 10, 12, 12])
  })

  it('Disciple martial offre une maîtrise d\'outil d\'artisan', () => {
    const disciple = battleMaster.features.find(f => f.name === 'Disciple martial')!
    expect(disciple.progression).toMatchObject({ kind: 'tool', count: { op: 'fixed', value: 1 }, optionSource: { type: 'tools' } })
    expect((disciple.progression!.optionSource as { from: string[] }).from).toContain('Outils de forgeron')
  })
})

describe('Maître de guerre — réserve de dés sur la fiche', () => {
  const SUBCLASS = 50
  const parade = maneuverFeatures.find(f => f.name === 'Parade')!
  const feature = (id: number, def: { name: string, meta?: ResourceFeature['meta'], maxUsesFormula?: ResourceFeature['maxUsesFormula'], effects?: ResourceFeature['effects'] }): ResourceFeature => ({
    id, name: def.name, featureType: 'subclass_feature', subclassId: SUBCLASS, levelRequired: 3, meta: def.meta ?? null,
    maxUsesFormula: def.maxUsesFormula ?? null, rechargeType: 'short_rest', currentUses: 1, effects: def.effects ?? [],
  })
  const features = [
    feature(1, {
      name: 'Supériorité martiale',
      meta: { resource: 'superiority_dice', saveDcAbility: ['str', 'dex'] },
      maxUsesFormula: SUPERIORITY_DICE_COUNT,
      effects: [{ type: 'resource_die', value: { sides: SUPERIORITY_DIE } }],
    }),
    feature(2, { name: 'Parade', meta: parade.meta }),
  ]
  const classes = (level: number): OwnerClass[] => [{ classId: 5, level, subclass: { id: SUBCLASS } }]
  const base = (level: number) => context(level, 3)

  it('un groupe de dés qui grandit avec le niveau, avec la manœuvre pour coût', () => {
    const [group] = resourceGroups(features, base(7), classes(7))
    expect(group).toMatchObject({ key: 'superiority_dice', max: 5, spent: 1, saveDcAbility: ['str', 'dex'] })
    expect(group!.costs).toEqual([{ featureId: 2, name: 'Parade', amount: 1 }])
    expect(resourceGroups(features, base(3), classes(3))[0]!.max).toBe(4)
    expect(resourceGroups(features, base(15), classes(15))[0]!.max).toBe(6)
  })

  it('un dé qui passe de d8 à d10 puis d12', () => {
    const dieAt = (level: number) => deriveClassTraits(features, base(level), classes(level)).resourceDie.superiority_dice
    expect([dieAt(3), dieAt(10), dieAt(18)]).toEqual([8, 10, 12])
  })

  it('DD de manœuvre : 8 + maîtrise + la meilleure de Force et de Dextérité', () => {
    expect(saveDcOf(['str', 'dex'], 3, { str: 1, dex: 4 })).toBe(15)
    expect(saveDcOf(['str', 'dex'], 3, { str: 5, dex: 2 })).toBe(16)
    expect(saveDcOf('wis', 3, { wis: 4 })).toBe(15)
    expect(saveDcOf(undefined, 3, { wis: 4 })).toBeNull()
  })
})

describe('featurePicksError — remplacer une manœuvre en en apprenant de nouvelles', () => {
  const choice = (over: Partial<ResolvedChoice> = {}): ResolvedChoice => ({
    progressionId: 9,
    ownerLevelRequired: 3,
    kind: 'maneuvers',
    classLevel: 7,
    count: 2,
    made: 0,
    remaining: 2,
    replaceable: true,
    optionSource: { type: 'feature_group', group: 'maneuver' },
    options: [1, 2, 3, 4, 5].map(featureId => ({ featureId })),
    ...over,
  })
  const pick = (featureId: number) => ({ progressionId: 9, featureId })
  const owned = new Set([1, 2, 3])

  it('un remplacement ajoute une manœuvre à apprendre', () => {
    expect(featurePicksError([pick(4), pick(5)], [choice()], owned)).toBeNull()
    expect(featurePicksError([pick(4), pick(5)], [choice({ count: 1, remaining: 1 })], owned)).toMatch(/Trop de choix/)
    expect(featurePicksError([pick(4), pick(5)], [choice({ count: 1, remaining: 1 })], owned, [pick(1)])).toBeNull()
  })

  it('refuse un remplacement sans manœuvre à apprendre, sans nouvelle manœuvre, d\'une manœuvre absente, double ou non remplaçable', () => {
    expect(featurePicksError([pick(4)], [choice({ remaining: 0 })], owned, [pick(1)])).toMatch(/rien à remplacer/)
    expect(featurePicksError([], [choice()], owned, [pick(1)])).toMatch(/exige une nouvelle option/)
    expect(featurePicksError([pick(4), pick(5)], [choice()], owned, [pick(9)])).toMatch(/n'est pas sur la fiche/)
    expect(featurePicksError([pick(4), pick(5)], [choice()], owned, [pick(1), pick(2)])).toMatch(/Un seul remplacement/)
    expect(featurePicksError([pick(4)], [choice({ replaceable: false })], owned, [pick(1)])).toMatch(/n'autorise pas de remplacement/)
  })

  it('la manœuvre remplacée ne se reprend pas', () => {
    expect(featurePicksError([pick(1), pick(4)], [choice()], owned, [pick(2)])).toMatch(/déjà prise/)
  })
})
