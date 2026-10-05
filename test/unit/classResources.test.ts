import { describe, it, expect } from 'vitest'
import type { FormulaContext } from '../../shared/utils/formula'
import {
  deriveClassTraits, featureUses, resourceGroups, restRecovery, slotDamageDiceCount, damageDiceAppliesToWeapon,
  type OwnerClass, type ResourceFeature,
} from '../../shared/rules/classResources'
import type { FeatureDef } from '../../server/db/seeds/lib/seedClass'
import { barbareFeatures } from '../../server/db/seeds/data/barbare'
import { bardeFeatures, bardeSubclasses } from '../../server/db/seeds/data/barde'
import { clercFeatures } from '../../server/db/seeds/data/clerc'
import { druideFeatures, druideSubclasses } from '../../server/db/seeds/data/druide'
import { ensorceleurFeatures } from '../../server/db/seeds/data/ensorceleur'
import { ensorceleurMetamagicFeatures } from '../../server/db/seeds/data/ensorceleur_metamagic'
import { guerrierFeatures } from '../../server/db/seeds/data/guerrier'
import { moineFeatures } from '../../server/db/seeds/data/moine'
import { paladinFeatures } from '../../server/db/seeds/data/paladin'
import { roublardFeatures } from '../../server/db/seeds/data/roublard'
import { SORCERY_SLOT_COST, SORCERY_MAX_CREATED_SLOT_LEVEL, metamagicCost, pointsAfterSlotConversion, slotCreationCost } from '../../shared/rules/sorcery'

// Les valeurs attendues viennent des tableaux de classe d'AideDD (aidedd.org/regles/classes/<classe>/), relevés dans le HTML
// brut : pas de la mémoire. Les features sont celles des seeds, pour garder le test et la donnée solidaires.

const CLASS_IDS = { barbare: 1, barde: 2, clerc: 3, druide: 4, ensorceleur: 5, guerrier: 6, moine: 7, paladin: 8, roublard: 9 } as const

let nextId = 1
const resource = (
  def: FeatureDef,
  owner: { classId: number, subclassId?: number },
  patch: Partial<ResourceFeature> = {},
): ResourceFeature => ({
  id: nextId++,
  name: def.name,
  featureType: owner.subclassId ? 'subclass_feature' : 'class_feature',
  classId: owner.subclassId ? null : owner.classId,
  subclassId: owner.subclassId ?? null,
  levelRequired: def.levelRequired,
  maxUsesFormula: def.maxUsesFormula ?? null,
  rechargeType: def.rechargeType ?? null,
  meta: def.meta ?? null,
  currentUses: 0,
  active: false,
  effects: def.effects ?? [],
  ...patch,
})

const named = (defs: FeatureDef[], name: string, level?: number) =>
  defs.find(f => f.name === name && (level === undefined || f.levelRequired === level))!

const ctx = (patch: Partial<FormulaContext> = {}): FormulaContext => ({
  level: 1, class_level: 1, prof_bonus: 2, str_mod: 0, dex_mod: 0, con_mod: 0, int_mod: 0, wis_mod: 0, cha_mod: 0, ...patch,
})

const cls = (classId: number, level: number, subclassId?: number): OwnerClass => ({ classId, level, subclass: subclassId ? { id: subclassId } : null })

describe('compteurs de ressources', () => {
  const rage = resource(named(barbareFeatures, 'Rage'), { classId: CLASS_IDS.barbare })

  it('Rage : 2 / 3 / 4 / 5 / 6 utilisations puis illimitées au niveau 20', () => {
    const at = (level: number) => featureUses(rage, ctx(), [cls(CLASS_IDS.barbare, level)])
    expect([1, 2].map(l => at(l).maxUses)).toEqual([2, 2])
    expect([3, 4, 5].map(l => at(l).maxUses)).toEqual([3, 3, 3])
    expect([6, 11].map(l => at(l).maxUses)).toEqual([4, 4])
    expect([12, 16].map(l => at(l).maxUses)).toEqual([5, 5])
    expect([17, 19].map(l => at(l).maxUses)).toEqual([6, 6])
    expect(at(19).unlimited).toBe(false)
    expect(at(20)).toEqual({ maxUses: null, unlimited: true })
  })

  it('multiclasse : la Rage compte sur le niveau de barbare, pas sur celui de la classe principale', () => {
    // Moine 5 (principale) / Barbare 3 : `class_level` du contexte vaut 5, la Rage doit lire 3
    const uses = featureUses(rage, ctx({ class_level: 5, level: 8 }), [cls(CLASS_IDS.moine, 5), cls(CLASS_IDS.barbare, 3)])
    expect(uses.maxUses).toBe(3)
  })

  it('Ki : un point par niveau de moine', () => {
    const ki = resource(named(moineFeatures, 'Ki'), { classId: CLASS_IDS.moine })
    expect([2, 3, 10, 20].map(l => featureUses(ki, ctx(), [cls(CLASS_IDS.moine, l)]).maxUses)).toEqual([2, 3, 10, 20])
  })

  it('Points de sorcellerie : un point par niveau d\'ensorceleur', () => {
    const pts = resource(named(ensorceleurFeatures, 'Source de magie'), { classId: CLASS_IDS.ensorceleur })
    expect([2, 5, 20].map(l => featureUses(pts, ctx(), [cls(CLASS_IDS.ensorceleur, l)]).maxUses)).toEqual([2, 5, 20])
  })

  it('Imposition des mains : cinq fois le niveau de paladin', () => {
    const lay = resource(named(paladinFeatures, 'Imposition des mains'), { classId: CLASS_IDS.paladin })
    expect([1, 4, 20].map(l => featureUses(lay, ctx(), [cls(CLASS_IDS.paladin, l)]).maxUses)).toEqual([5, 20, 100])
  })

  it('Inspiration bardique : modificateur de Charisme, minimum une utilisation', () => {
    const insp = resource(named(bardeFeatures, 'Inspiration bardique'), { classId: CLASS_IDS.barde })
    const uses = (cha: number) => featureUses(insp, ctx({ cha_mod: cha }), [cls(CLASS_IDS.barde, 1)]).maxUses
    expect([-1, 0, 1, 3, 5].map(uses)).toEqual([1, 1, 1, 3, 5])
  })

  it('Conduit divin du Clerc : 1, puis 2 au niveau 6, 3 au niveau 18 ; Paladin : 1', () => {
    const cleric = resource(named(clercFeatures, 'Conduit divin'), { classId: CLASS_IDS.clerc })
    const paladin = resource(named(paladinFeatures, 'Conduit divin'), { classId: CLASS_IDS.paladin })
    expect([2, 5, 6, 17, 18, 20].map(l => featureUses(cleric, ctx(), [cls(CLASS_IDS.clerc, l)]).maxUses)).toEqual([1, 1, 2, 2, 3, 3])
    expect([3, 20].map(l => featureUses(paladin, ctx(), [cls(CLASS_IDS.paladin, l)]).maxUses)).toEqual([1, 1])
  })

  it('Forme sauvage : deux utilisations', () => {
    const wild = resource(named(druideFeatures, 'Forme sauvage'), { classId: CLASS_IDS.druide })
    expect(featureUses(wild, ctx(), [cls(CLASS_IDS.druide, 2)]).maxUses).toBe(2)
  })

  it('Guerrier : Fougue 1 puis 2 au niveau 17, Inflexible 1 / 2 / 3 aux niveaux 9 / 13 / 17', () => {
    const surge = resource(named(guerrierFeatures, 'Fougue'), { classId: CLASS_IDS.guerrier })
    const indomitable = resource(named(guerrierFeatures, 'Inflexible'), { classId: CLASS_IDS.guerrier })
    const at = (f: ResourceFeature, l: number) => featureUses(f, ctx(), [cls(CLASS_IDS.guerrier, l)]).maxUses
    expect([2, 16, 17, 20].map(l => at(surge, l))).toEqual([1, 1, 2, 2])
    expect([9, 12, 13, 16, 17, 20].map(l => at(indomitable, l))).toEqual([1, 1, 2, 2, 3, 3])
  })
})

describe('traits dérivés', () => {
  const attack = (defs: FeatureDef[], classId: number) => resource(named(defs, 'Attaque supplémentaire'), { classId })

  it('Guerrier : 2 attaques au niveau 5, 3 au 11, 4 au 20 ; 1 avant le 5', () => {
    const fighter = attack(guerrierFeatures, CLASS_IDS.guerrier)
    const at = (l: number) => deriveClassTraits([fighter], ctx(), [cls(CLASS_IDS.guerrier, l)]).attacksPerAction
    expect([4, 5, 10, 11, 19, 20].map(at)).toEqual([1, 2, 2, 3, 3, 4])
  })

  it('Attaque supplémentaire ne se cumule pas entre classes', () => {
    const features = [attack(guerrierFeatures, CLASS_IDS.guerrier), attack(barbareFeatures, CLASS_IDS.barbare)]
    const traits = deriveClassTraits(features, ctx(), [cls(CLASS_IDS.guerrier, 5), cls(CLASS_IDS.barbare, 5)])
    expect(traits.attacksPerAction).toBe(2)
  })

  it('Guerrier 11 / Barbare 5 garde les 3 attaques du Guerrier', () => {
    const features = [attack(guerrierFeatures, CLASS_IDS.guerrier), attack(barbareFeatures, CLASS_IDS.barbare)]
    expect(deriveClassTraits(features, ctx(), [cls(CLASS_IDS.guerrier, 11), cls(CLASS_IDS.barbare, 5)]).attacksPerAction).toBe(3)
  })

  it('Barbare, Moine, Paladin, Rôdeur, Collège de la vaillance : 2 attaques dès leur niveau', () => {
    const valor = bardeSubclasses.find(s => s.name === 'Collège de la vaillance')!.features.find(f => f.name === 'Attaque supplémentaire')!
    const cases: [ResourceFeature, OwnerClass[]][] = [
      [attack(barbareFeatures, CLASS_IDS.barbare), [cls(CLASS_IDS.barbare, 5)]],
      [attack(moineFeatures, CLASS_IDS.moine), [cls(CLASS_IDS.moine, 5)]],
      [attack(paladinFeatures, CLASS_IDS.paladin), [cls(CLASS_IDS.paladin, 5)]],
      [resource(valor, { classId: CLASS_IDS.barde, subclassId: 77 }), [cls(CLASS_IDS.barde, 6, 77)]],
    ]
    for (const [feature, classes] of cases) expect(deriveClassTraits([feature], ctx(), classes).attacksPerAction).toBe(2)
  })

  it('une feature au-dessus du niveau de sa classe ne produit rien', () => {
    const traits = deriveClassTraits([attack(barbareFeatures, CLASS_IDS.barbare)], ctx(), [cls(CLASS_IDS.barbare, 4)])
    expect(traits.attacksPerAction).toBe(1)
  })

  it('Attaque sournoise : 1d6 au niveau 1, +1d6 tous les deux niveaux, 10d6 au niveau 19', () => {
    const sneak = resource(named(roublardFeatures, 'Attaque sournoise'), { classId: CLASS_IDS.roublard })
    const dice = (l: number) => deriveClassTraits([sneak], ctx(), [cls(CLASS_IDS.roublard, l)]).weaponDamageDice[0]!
    const expected = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10]
    expect(expected.map((_, i) => dice(i + 1).count)).toEqual(expected)
    expect(dice(5)).toMatchObject({ name: 'Attaque sournoise', sides: 6, weapons: 'finesse_or_ranged', limit: 'once_per_turn' })
  })

  it('les dés d\'Attaque sournoise ne valent que pour une arme à finesse ou à distance', () => {
    expect(damageDiceAppliesToWeapon('finesse_or_ranged', { isRanged: false, isFinesse: true })).toBe(true)
    expect(damageDiceAppliesToWeapon('finesse_or_ranged', { isRanged: true, isFinesse: false })).toBe(true)
    expect(damageDiceAppliesToWeapon('finesse_or_ranged', { isRanged: false, isFinesse: false })).toBe(false)
    expect(damageDiceAppliesToWeapon('melee', { isRanged: true, isFinesse: true })).toBe(false)
  })

  describe('Rage', () => {
    const rageDef = named(barbareFeatures, 'Rage')
    const raging = (level: number, active: boolean, heavyArmor = false) =>
      deriveClassTraits([resource(rageDef, { classId: CLASS_IDS.barbare }, { active })], ctx(), [cls(CLASS_IDS.barbare, level)], { heavyArmor })

    it('bonus de dégâts +2 jusqu\'au niveau 8, +3 aux niveaux 9-15, +4 à partir du 16', () => {
      expect([1, 8, 9, 15, 16, 20].map(l => raging(l, true).meleeStrengthDamageBonus)).toEqual([2, 2, 3, 3, 4, 4])
    })

    it('aucun bonus tant que la rage n\'est pas active', () => {
      expect(raging(9, false).meleeStrengthDamageBonus).toBe(0)
    })

    it('une armure lourde suspend le bonus (« si vous ne portez pas d\'armure lourde »)', () => {
      expect(raging(9, true, true).meleeStrengthDamageBonus).toBe(0)
    })
  })

  it('Châtiment divin amélioré : 1d8 radiant à chaque attaque de corps à corps, dès le niveau 11', () => {
    const improved = resource(named(paladinFeatures, 'Châtiment divin amélioré'), { classId: CLASS_IDS.paladin })
    expect(deriveClassTraits([improved], ctx(), [cls(CLASS_IDS.paladin, 10)]).weaponDamageDice).toEqual([])
    expect(deriveClassTraits([improved], ctx(), [cls(CLASS_IDS.paladin, 11)]).weaponDamageDice[0]).toMatchObject({
      count: 1, sides: 8, damageType: 'radiant', weapons: 'melee', limit: 'each_hit',
    })
  })

  it('dé d\'Inspiration bardique : d6, d8 au niveau 5, d10 au 10, d12 au 15', () => {
    const insp = resource(named(bardeFeatures, 'Inspiration bardique'), { classId: CLASS_IDS.barde })
    const die = (l: number) => deriveClassTraits([insp], ctx(), [cls(CLASS_IDS.barde, l)]).resourceDie.bardic_inspiration
    expect([1, 4, 5, 9, 10, 14, 15, 20].map(die)).toEqual([6, 6, 8, 8, 10, 10, 12, 12])
  })

  describe('Forme sauvage', () => {
    const wild = resource(named(druideFeatures, 'Forme sauvage'), { classId: CLASS_IDS.druide })
    const shape = (level: number) => deriveClassTraits([wild], ctx(), [cls(CLASS_IDS.druide, level)]).beastShape

    it('paliers de FP et restrictions ; durée = la moitié du niveau, arrondie', () => {
      expect(shape(2)).toEqual({ maxChallenge: 0.25, flying: false, swimming: false, hours: 1 })
      expect(shape(4)).toEqual({ maxChallenge: 0.5, flying: false, swimming: true, hours: 2 })
      expect(shape(7)).toEqual({ maxChallenge: 0.5, flying: false, swimming: true, hours: 3 })
      expect(shape(8)).toEqual({ maxChallenge: 1, flying: true, swimming: true, hours: 4 })
    })

    it('Cercle de la lune : FP 1 dès le niveau 2, puis niveau ÷ 3 ; les autres restrictions demeurent', () => {
      const moon = druideSubclasses.find(s => s.name === 'Cercle de la lune')!.features.find(f => f.name === 'Formes du cercle')!
      const circle = resource(moon, { classId: CLASS_IDS.druide, subclassId: 55 })
      const moonShape = (level: number) => deriveClassTraits([wild, circle], ctx(), [cls(CLASS_IDS.druide, level, 55)]).beastShape
      expect(moonShape(2)).toEqual({ maxChallenge: 1, flying: false, swimming: false, hours: 1 })
      expect(moonShape(5)).toMatchObject({ maxChallenge: 1, flying: false, swimming: true })
      expect(moonShape(6)).toMatchObject({ maxChallenge: 2, swimming: true })
      expect(moonShape(12)).toMatchObject({ maxChallenge: 4, flying: true })
      expect(moonShape(18)).toMatchObject({ maxChallenge: 6 })
    })
  })
})

describe('Châtiment divin', () => {
  const smite = deriveClassTraits(
    [resource(named(paladinFeatures, 'Châtiment divin'), { classId: CLASS_IDS.paladin })],
    ctx(),
    [cls(CLASS_IDS.paladin, 2)],
  ).slotDamage[0]!

  it('2d8 au niveau 1, +1d8 par niveau, plafonné à 5d8', () => {
    expect([1, 2, 3, 4, 5].map(l => slotDamageDiceCount(smite, l, false))).toEqual([2, 3, 4, 5, 5])
  })

  it('+1d8 contre un mort-vivant ou un fiélon, plafonné à 6d8', () => {
    expect([1, 2, 3, 4, 5].map(l => slotDamageDiceCount(smite, l, true))).toEqual([3, 4, 5, 6, 6])
  })
})

describe('groupes de réserves', () => {
  it('Conduit divin du Clerc et du Paladin : une seule réserve, au maximum le plus haut', () => {
    const cleric = resource(named(clercFeatures, 'Conduit divin'), { classId: CLASS_IDS.clerc }, { currentUses: 1 })
    const paladin = resource(named(paladinFeatures, 'Conduit divin'), { classId: CLASS_IDS.paladin }, { currentUses: 0 })
    const groups = resourceGroups([cleric, paladin], ctx(), [cls(CLASS_IDS.clerc, 6), cls(CLASS_IDS.paladin, 4)])
    expect(groups).toHaveLength(1)
    expect(groups[0]).toMatchObject({ key: 'channel_divinity', max: 2, spent: 1, primaryId: cleric.id })
    expect(groups[0]!.featureIds.sort()).toEqual([cleric.id, paladin.id].sort())
  })

  it('Clerc 1 / Paladin 3 : un seul Conduit divin (« pas d\'utilisation supplémentaire »)', () => {
    const cleric = resource(named(clercFeatures, 'Conduit divin'), { classId: CLASS_IDS.clerc })
    const paladin = resource(named(paladinFeatures, 'Conduit divin'), { classId: CLASS_IDS.paladin })
    const [group] = resourceGroups([cleric, paladin], ctx(), [cls(CLASS_IDS.clerc, 2), cls(CLASS_IDS.paladin, 3)])
    expect(group!.max).toBe(1)
  })

  it('Ki : dépenses proposées selon le niveau de moine, DD sur la Sagesse', () => {
    const ki = resource(named(moineFeatures, 'Ki'), { classId: CLASS_IDS.moine })
    const labels = (level: number) => resourceGroups([ki], ctx(), [cls(CLASS_IDS.moine, level)])[0]!.spends.map(s => s.label)
    expect(labels(2)).toEqual(['Défense patiente', 'Déluge de coups', 'Déplacement aérien'])
    expect(labels(5)).toContain('Frappe étourdissante')
    expect(labels(3)).toContain('Parade de projectiles (renvoi)')
    expect(resourceGroups([ki], ctx(), [cls(CLASS_IDS.moine, 5)])[0]!.saveDcAbility).toBe('wis')
  })

  it('Inspiration bardique : se recharge au repos court à partir du niveau 5 (Source d\'inspiration)', () => {
    const insp = resource(named(bardeFeatures, 'Inspiration bardique'), { classId: CLASS_IDS.barde })
    const source = resource(named(bardeFeatures, 'Source d\'inspiration'), { classId: CLASS_IDS.barde })
    expect(resourceGroups([insp, source], ctx(), [cls(CLASS_IDS.barde, 4)])[0]!.rechargeType).toBe('long_rest')
    expect(resourceGroups([insp, source], ctx(), [cls(CLASS_IDS.barde, 5)])[0]!.rechargeType).toBe('short_rest')
  })

  it('Métamagie : les options choisies sont proposées avec leur coût', () => {
    const pool = resource(named(ensorceleurFeatures, 'Source de magie'), { classId: CLASS_IDS.ensorceleur })
    const options = ensorceleurMetamagicFeatures.map(def => resource(def, { classId: CLASS_IDS.ensorceleur }))
    const [group] = resourceGroups([pool, ...options.slice(0, 2)], ctx(), [cls(CLASS_IDS.ensorceleur, 3)])
    expect(group!.costs.map(c => [c.name, c.amount])).toEqual([['Sort accéléré', 2], ['Sort ample', 1]])
  })

  it('Métamagie : coûts des huit options — accéléré 2, intensifié 3, jumeau = niveau du sort, les autres 1', () => {
    const costOf = Object.fromEntries(ensorceleurMetamagicFeatures.map(f => [f.name, f.meta?.cost?.amount]))
    expect(costOf).toEqual({
      'Sort accéléré': 2, 'Sort ample': 1, 'Sort étendu': 1, 'Sort intensifié': 3,
      'Sort jumeau': 'spell_level', 'Sort prévenant': 1, 'Sort renforcé': 1, 'Sort subtil': 1,
    })
  })

  it('une réserve illimitée (Rage 20) est signalée comme telle', () => {
    const rage = resource(named(barbareFeatures, 'Rage'), { classId: CLASS_IDS.barbare })
    expect(resourceGroups([rage], ctx(), [cls(CLASS_IDS.barbare, 20)])[0]).toMatchObject({ unlimited: true, max: null })
  })
})

describe('repos', () => {
  const ki = resource(named(moineFeatures, 'Ki'), { classId: CLASS_IDS.moine })
  const rage = resource(named(barbareFeatures, 'Rage'), { classId: CLASS_IDS.barbare })
  const insp = resource(named(bardeFeatures, 'Inspiration bardique'), { classId: CLASS_IDS.barde })
  const source = resource(named(bardeFeatures, 'Source d\'inspiration'), { classId: CLASS_IDS.barde })
  const sorcery = resource(named(ensorceleurFeatures, 'Source de magie'), { classId: CLASS_IDS.ensorceleur })
  const restoration = resource(named(ensorceleurFeatures, 'Restauration ensorcelée'), { classId: CLASS_IDS.ensorceleur })

  it('repos court : le ki revient, pas la Rage', () => {
    const r = restRecovery([ki, rage], [cls(CLASS_IDS.moine, 5), cls(CLASS_IDS.barbare, 3)], 'short')
    expect(r.reset).toEqual([ki.id])
  })

  it('repos long : le ki et la Rage reviennent', () => {
    const r = restRecovery([ki, rage], [cls(CLASS_IDS.moine, 5), cls(CLASS_IDS.barbare, 3)], 'long')
    expect(r.reset.sort()).toEqual([ki.id, rage.id].sort())
  })

  it('Inspiration bardique revient au repos court seulement avec Source d\'inspiration (niveau 5)', () => {
    expect(restRecovery([insp, source], [cls(CLASS_IDS.barde, 4)], 'short').reset).not.toContain(insp.id)
    expect(restRecovery([insp, source], [cls(CLASS_IDS.barde, 5)], 'short').reset).toContain(insp.id)
  })

  it('niveau 20 de l\'ensorceleur : 4 points regagnés à chaque repos court, jamais tous', () => {
    const r = restRecovery([sorcery, restoration], [cls(CLASS_IDS.ensorceleur, 20)], 'short')
    expect(r.reset).not.toContain(sorcery.id)
    expect(r.regain).toEqual([{ featureId: sorcery.id, amount: 4 }])
  })

  it('niveau 19 : pas de regain au repos court', () => {
    expect(restRecovery([sorcery, restoration], [cls(CLASS_IDS.ensorceleur, 19)], 'short').regain).toEqual([])
  })

  it('repos long : tout revient, le regain partiel s\'efface devant la remise à zéro', () => {
    const r = restRecovery([sorcery, restoration], [cls(CLASS_IDS.ensorceleur, 20)], 'long')
    expect(r.reset).toContain(sorcery.id)
    expect(r.regain).toEqual([])
  })
})

describe('points de sorcellerie', () => {
  it('coût de création d\'un emplacement : 2, 3, 5, 6, 7 points, jusqu\'au niveau 5', () => {
    expect(SORCERY_SLOT_COST).toEqual({ 1: 2, 2: 3, 3: 5, 4: 6, 5: 7 })
    expect(SORCERY_MAX_CREATED_SLOT_LEVEL).toBe(5)
    expect(slotCreationCost(3)).toBe(5)
    expect(slotCreationCost(6)).toBeNull()
  })

  it('convertir un emplacement rend autant de points que son niveau, sans repasser sous zéro dépensé', () => {
    expect(pointsAfterSlotConversion(5, 3)).toBe(2)
    expect(pointsAfterSlotConversion(1, 3)).toBe(0)
  })

  it('Sort jumeau : le niveau du sort, 1 point pour un sort mineur', () => {
    expect(metamagicCost('spell_level', 0)).toBe(1)
    expect(metamagicCost('spell_level', 4)).toBe(4)
    expect(metamagicCost(3, 9)).toBe(3)
  })
})
