import { describe, it, expect } from 'vitest'
import { defaultKnResistances, defaultKnSkills, KN_BOUNDS } from '../../shared/ker-nethalas/character'
import { KN_UNARMED_OPTION, knAttackOptions } from '../../shared/ker-nethalas/equipment'
import type { KnItem } from '../../shared/ker-nethalas/inventory'
import { knLevelBenefitSources, knLevelUp, type KnLevelSheet } from '../../shared/ker-nethalas/levelUp'
import { KN_LEVEL_XP, knCanLevelUp, knLevelAttackDice, knLevelBenefitsSchema, knLevelChoiceIssues } from '../../shared/ker-nethalas/progression'

// Le résultat voulu d'un dé à `sides` faces.
const die = (sides: number, result: number) => () => (result - 0.5) / sides

const sheet = (over: Partial<KnLevelSheet> = {}): KnLevelSheet => ({
  level: 3,
  xp: 1200,
  healthMax: 12,
  healthCurrent: 9,
  toughnessMax: 25,
  toughnessCurrent: 25,
  aetherMax: 10,
  aetherCurrent: 4,
  sanityMax: 11,
  sanityCurrent: 11,
  resistances: { ...defaultKnResistances(), endurance: 78 },
  skills: defaultKnSkills(),
  levelBenefits: [],
  ...over,
})

const ok = (result: ReturnType<typeof knLevelUp>) => {
  if ('error' in result) throw new Error(`erreur : ${result.error}`)
  return result
}

describe('passage de niveau', () => {
  it('il faut 1 000 XP', () => {
    expect([999, 1000, 2500].map(knCanLevelUp)).toEqual([false, true, true])
    expect(KN_LEVEL_XP).toBe(1000)
  })

  it('le niveau monte, 1 000 XP partent et l\'excédent se garde', () => {
    const { patch } = ok(knLevelUp(sheet(), { benefit: 'health' }, die(4, 3)))

    expect(patch).toMatchObject({ level: 4, xp: 200 })
  })

  it('un avantage de jauge élève le maximum et la valeur actuelle du dé tiré', () => {
    const health = ok(knLevelUp(sheet(), { benefit: 'health' }, die(4, 3))).patch
    const aether = ok(knLevelUp(sheet(), { benefit: 'aether' }, die(6, 5))).patch

    expect(health).toMatchObject({ healthMax: 15, healthCurrent: 12 })
    expect(aether).toMatchObject({ aetherMax: 15, aetherCurrent: 9 })
    expect(ok(knLevelUp(sheet(), { benefit: 'toughness' }, die(6, 6))).patch).toMatchObject({ toughnessMax: 31, toughnessCurrent: 31 })
    expect(ok(knLevelUp(sheet(), { benefit: 'sanity' }, die(4, 1))).patch).toMatchObject({ sanityMax: 12, sanityCurrent: 12 })
  })

  it('+5 à une compétence, plafonné', () => {
    const { patch } = ok(knLevelUp(sheet(), { benefit: 'skill', skill: 'stealth' }))

    expect(patch.skills!.stealth.score).toBe(sheet().skills.stealth.score + 5)
    expect(patch.skills!.athletics).toEqual(sheet().skills.athletics)
    const capped = sheet({ skills: { ...defaultKnSkills(), stealth: { score: KN_BOUNDS.skill.max - 2, marked: true } } })
    expect(ok(knLevelUp(capped, { benefit: 'skill', skill: 'stealth' })).patch.skills!.stealth).toEqual({ score: KN_BOUNDS.skill.max, marked: true })
  })

  it('+5 aux trois Résistances, plafonnées à 80', () => {
    const { patch } = ok(knLevelUp(sheet(), { benefit: 'resistances' }))

    expect(patch.resistances).toEqual({ endurance: 80, resolve: 25, spellward: 25 })
  })

  it('les avantages de dégâts n\'ont pas d\'effet immédiat : ils se gardent dans l\'historique', () => {
    const physical = ok(knLevelUp(sheet(), { benefit: 'physicalDamage', damageType: 'slashing' })).patch
    const ability = ok(knLevelUp(sheet({ levelBenefits: physical.levelBenefits! }), { benefit: 'abilityDamage', ability: 'arcanist:2' })).patch

    expect(physical.levelBenefits).toEqual([{ benefit: 'physicalDamage', damageType: 'slashing', level: 4 }])
    expect(ability.levelBenefits).toEqual([
      { benefit: 'physicalDamage', damageType: 'slashing', level: 4 },
      { benefit: 'abilityDamage', ability: 'arcanist:2', level: 4 },
    ])
    expect(physical.healthMax).toBeUndefined()
    expect(knLevelBenefitsSchema.safeParse(ability.levelBenefits).success).toBe(true)
  })

  it('refuse sans 1 000 XP, au niveau maximal ou avec un choix incomplet', () => {
    expect(knLevelUp(sheet({ xp: 999 }), { benefit: 'health' })).toEqual({ error: 'xp' })
    expect(knLevelUp(sheet({ level: KN_BOUNDS.level.max }), { benefit: 'health' })).toEqual({ error: 'level' })
    expect(knLevelUp(sheet(), { benefit: 'skill' })).toEqual({ error: 'choice' })
    expect(knLevelChoiceIssues({})).toHaveLength(1)
    expect(knLevelChoiceIssues({ benefit: 'physicalDamage' })).toHaveLength(1)
    expect(knLevelChoiceIssues({ benefit: 'physicalDamage', damageType: 'piercing' })).toEqual([])
    expect(knLevelChoiceIssues({ benefit: 'abilityDamage' })).toHaveLength(1)
  })
})

describe('effets durables des avantages', () => {
  const sword: KnItem = { id: 'i1', name: 'Épée', kind: 'weapon', weight: 'normal', quantity: 1, place: 'mainHand', weapon: { skill: 'bladedWeapons', speed: 0, damageType: 'slashing', traits: [] } }
  const benefits = [
    { benefit: 'physicalDamage' as const, damageType: 'piercing' as const, level: 2 },
    { benefit: 'health' as const, level: 3 },
    { benefit: 'physicalDamage' as const, damageType: 'slashing' as const, level: 4 },
  ]

  it('un D6 par avantage de dégâts physiques, du type choisi', () => {
    expect(knLevelAttackDice(benefits)).toEqual([
      { dice: { count: 1, sides: 6, bonus: 0 }, type: 'piercing' },
      { dice: { count: 1, sides: 6, bonus: 0 }, type: 'slashing' },
    ])
    expect(knLevelAttackDice([])).toEqual([])
  })

  it('ils s\'ajoutent à la réserve de chaque attaque, mains nues comprises', () => {
    const [weapon, unarmed] = knAttackOptions([sword], benefits)

    const typed = [{ count: 1, sides: 6, bonus: 0, type: 'piercing' }, { count: 1, sides: 6, bonus: 0, type: 'slashing' }]

    expect(weapon).toMatchObject({ pool: 'D6', typed })
    expect(weapon!.magic!.dice).toHaveLength(2)
    expect(unarmed).toMatchObject({ id: 'unarmed', pool: 'D4', typed })
    expect(knAttackOptions([sword]).at(-1)).toBe(KN_UNARMED_OPTION)
  })

  it('le +1 aux dégâts d\'une Aptitude est rappelé avec son nom', () => {
    const sources = knLevelBenefitSources([{ benefit: 'abilityDamage', ability: 'arcanist:2', level: 4 }], key => key === 'arcanist:2' ? 'Éclair' : undefined)

    expect(sources).toEqual([{ id: 'levelBenefits', label: { text: 'Montées de niveau' }, effects: [], reminders: [{ label: { text: 'Éclair : +1 dégât (niveau 4)' }, severity: 'info' }] }])
    expect(knLevelBenefitSources([{ benefit: 'health', level: 2 }], () => undefined)).toEqual([])
  })
})
