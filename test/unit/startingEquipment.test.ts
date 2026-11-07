import { describe, it, expect } from 'vitest'
import { CLASSES, BACKGROUNDS } from '../../app/data/character-builder'
import { itemsData } from '../../server/db/seeds/data/items'
import {
  ARCANE_FOCUS,
  DRUIDIC_FOCUS,
  EQUIPMENT_PACKS,
  HOLY_SYMBOL,
  MARTIAL_WEAPON,
  SIMPLE_MELEE_WEAPON,
  SIMPLE_WEAPON,
  candidatesFor,
  chosenOptionIndex,
  emptySelection,
  expandEquipment,
  groupKey,
  groupOptions,
  optionLabel,
  pickKey,
  resolveLines,
  type CatalogItem,
  type EquipmentGroup,
  type EquipmentSelection,
  type EquipmentSources,
  type ItemSelector,
  type StackRef,
} from '../../shared/rules/startingEquipment'

const catalog: CatalogItem[] = itemsData.map(i => ({ id: i.id, name: i.name, itemType: i.itemType, properties: i.properties, isCustom: false }))

const sourcesOf = (): [string, EquipmentGroup[]][] => [
  ...CLASSES.map(c => [`class:${c.id}`, c.equipment] as [string, EquipmentGroup[]]),
  ...BACKGROUNDS.map(b => [`background:${b.id}`, b.equipment] as [string, EquipmentGroup[]]),
]

const allRefs = () => sourcesOf().flatMap(([, groups]) => groups.flatMap(g => groupOptions(g).flatMap(o => o.refs)))

const withEveryPick = (sources: EquipmentSources): EquipmentSelection => {
  const selection = emptySelection()
  for (const [source, groups] of Object.entries(sources)) {
    groups.forEach((group, g) => groupOptions(group).forEach((option, o) => option.refs.forEach((ref, r) => {
      if ('pick' in ref) selection.picks[pickKey(source, g, o, r)] = candidatesFor(ref.pick, catalog)[0]!.name
    })))
  }
  return selection
}

describe('équipement de départ ↔ catalogue', () => {
  it('chaque objet cité (classes, historiques, sacs) existe une fois, et une seule, dans le catalogue seedé', () => {
    const stacks: StackRef[] = [
      ...allRefs().filter((r): r is StackRef => 'item' in r),
      ...Object.values(EQUIPMENT_PACKS).flatMap(p => p.items as readonly StackRef[]),
    ]
    expect(stacks.length).toBeGreaterThan(100)
    for (const ref of stacks) {
      const matches = catalog.filter(it => it.name === ref.item && (!ref.itemType || it.itemType === ref.itemType))
      expect(matches, ref.item).toHaveLength(1)
    }
  })

  it('chaque choix d\'objet offre au moins un candidat', () => {
    const selectors = allRefs().flatMap(r => ('pick' in r ? [r.pick] : []))
    expect(selectors.length).toBeGreaterThan(0)
    for (const selector of selectors) expect(candidatesFor(selector, catalog).length, JSON.stringify(selector)).toBeGreaterThan(0)
  })

  it('les variantes de focaliseurs et de symboles sacrés sont celles du catalogue', () => {
    expect(candidatesFor(ARCANE_FOCUS, catalog)).toHaveLength(5)
    expect(candidatesFor(DRUIDIC_FOCUS, catalog)).toHaveLength(4)
    expect(candidatesFor(HOLY_SYMBOL, catalog)).toHaveLength(3)
  })

  it('« arme courante » couvre mêlée et distance, « arme de guerre » les deux aussi', () => {
    const categories = (selector: ItemSelector) => new Set(candidatesFor(selector, catalog).map(c => (c.properties as { weapon_category: string }).weapon_category))
    expect(categories(SIMPLE_WEAPON)).toEqual(new Set(['simple_melee', 'simple_ranged']))
    expect(categories(SIMPLE_MELEE_WEAPON)).toEqual(new Set(['simple_melee']))
    expect(categories(MARTIAL_WEAPON)).toEqual(new Set(['martial_melee', 'martial_ranged']))
  })

  it('« autre instrument de musique » exclut le luth', () => {
    const bard = CLASSES.find(c => c.id === 'bard')!
    const other = groupOptions(bard.equipment[2]!)[1]!.refs[0]!
    if (!('pick' in other)) throw new Error('choix attendu')
    const names = candidatesFor(other.pick, catalog).map(c => c.name)
    expect(names).not.toContain('Luth')
    expect(names).toContain('Lyre')
  })

  it('toute option de toute classe et de tout historique, une fois ses choix faits, se résout en objets du catalogue', () => {
    for (const [source, groups] of sourcesOf()) {
      const sources = { [source]: groups }
      const picks = withEveryPick(sources).picks
      const widest = Math.max(1, ...groups.map(g => groupOptions(g).length))
      for (let o = 0; o < widest; o++) {
        const options = Object.fromEntries(groups.map((g, i) => [groupKey(source, i), Math.min(o, groupOptions(g).length - 1)]))
        const expanded = expandEquipment(sources, { options, picks })
        expect(expanded.missingPicks, `${source} option ${o}`).toEqual([])
        expect(resolveLines(expanded.lines, catalog).unresolved, `${source} option ${o}`).toEqual([])
      }
    }
  })
})

describe('listes de départ des classes', () => {
  const shapes: Record<string, number[]> = {
    barbarian: [2, 2, 1],
    bard: [3, 2, 2, 1],
    cleric: [2, 3, 2, 2, 1],
    druid: [2, 2, 1],
    fighter: [2, 2, 2, 2],
    monk: [2, 2, 1],
    paladin: [2, 2, 2, 1],
    ranger: [2, 2, 2, 1],
    rogue: [2, 2, 3, 1],
    sorcerer: [2, 2, 2, 1],
    warlock: [2, 2, 2, 1],
    wizard: [2, 2, 2, 1],
  }

  it('reprennent le nombre de choix et d\'options de chaque classe', () => {
    for (const cls of CLASSES) {
      expect(cls.equipment.map(g => groupOptions(g).length), cls.id).toEqual(shapes[cls.id])
    }
  })

  it('le Rôdeur reçoit son arc long, son carquois et 20 flèches quel que soit son choix', () => {
    const ranger = CLASSES.find(c => c.id === 'ranger')!
    const { lines } = expandEquipment({ 'class:ranger': ranger.equipment }, withEveryPick({ 'class:ranger': ranger.equipment }))
    expect(lines).toEqual(expect.arrayContaining([
      { name: 'Arc long', quantity: 1 },
      { name: 'Carquois', quantity: 1 },
      { name: 'Flèche', quantity: 20 },
    ]))
  })

  it('une option se lit comme la liste de ses objets', () => {
    const fighter = CLASSES.find(c => c.id === 'fighter')!
    expect(optionLabel(groupOptions(fighter.equipment[0]!)[1]!)).toBe('Armure de cuir + Arc long + Flèche ×20')
    expect(optionLabel(groupOptions(fighter.equipment[3]!)[0]!)).toBe('Sac d\'exploration souterraine')
  })
})

describe('expandEquipment', () => {
  const groups: EquipmentGroup[] = [
    { options: [{ refs: [{ item: 'Hachette', quantity: 2 }] }, { refs: [{ pick: SIMPLE_WEAPON }] }] },
    { fixed: [{ pack: 'explorer' }, { item: 'Javeline', quantity: 4 }] },
    { fixed: [{ po: 15 }, { po: 5 }] },
  ]
  const sources = { 'class:x': groups }

  it('choisit la première option par défaut et additionne l\'or', () => {
    const { lines, po, missingPicks } = expandEquipment(sources, emptySelection())
    expect(lines).toContainEqual({ name: 'Hachette', quantity: 2 })
    expect(po).toBe(20)
    expect(missingPicks).toEqual([])
  })

  it('déplie un sac en ses objets, avec leurs quantités', () => {
    const { lines } = expandEquipment(sources, emptySelection())
    expect(lines).toContainEqual({ name: 'Torche', quantity: 10 })
    expect(lines).toContainEqual({ name: 'Rations (1 jour)', quantity: 10 })
    expect(lines).not.toContainEqual(expect.objectContaining({ name: 'Sac d\'explorateur' }))
  })

  it('signale un choix d\'objet non fait, puis le retient une fois fait', () => {
    const selection: EquipmentSelection = { options: { [groupKey('class:x', 0)]: 1 }, picks: {} }
    expect(expandEquipment(sources, selection).missingPicks).toEqual([{ key: pickKey('class:x', 0, 1, 0), selector: SIMPLE_WEAPON }])
    selection.picks[pickKey('class:x', 0, 1, 0)] = 'Dague'
    const done = expandEquipment(sources, selection)
    expect(done.missingPicks).toEqual([])
    expect(done.lines).toContainEqual({ name: 'Dague', quantity: 1 })
    expect(done.lines).not.toContainEqual(expect.objectContaining({ name: 'Hachette' }))
  })

  it('additionne les quantités d\'un même objet venu de plusieurs sources', () => {
    const { lines } = expandEquipment(
      { 'class:x': [{ fixed: [{ item: 'Dague', quantity: 2 }] }], 'background:y': [{ fixed: [{ item: 'Dague' }] }] },
      emptySelection(),
    )
    expect(lines).toEqual([{ name: 'Dague', quantity: 3 }])
  })

  it('ignore les choix faits pour une autre classe', () => {
    const selection: EquipmentSelection = { options: {}, picks: { [pickKey('class:y', 0, 1, 0)]: 'Dague' } }
    const other: EquipmentSources = { 'class:x': [{ options: [{ refs: [{ pick: SIMPLE_WEAPON }] }] }] }
    expect(expandEquipment(other, selection).missingPicks).toHaveLength(1)
  })

  it('retombe sur la première option quand l\'indice mémorisé n\'existe plus', () => {
    const selection: EquipmentSelection = { options: { [groupKey('class:x', 0)]: 9 }, picks: {} }
    expect(chosenOptionIndex(groups[0]!, selection, 'class:x', 0)).toBe(0)
  })
})

describe('resolveLines', () => {
  it('lève l\'ambiguïté entre deux objets de même nom par leur type', () => {
    const items: CatalogItem[] = [
      { id: 1, name: 'Outils de voleur', itemType: 'equipment', properties: {}, isCustom: false },
      { id: 2, name: 'Outils de voleur', itemType: 'tool', properties: {}, isCustom: false },
    ]
    expect(resolveLines([{ name: 'Outils de voleur', quantity: 1, itemType: 'tool' }], items).entries).toEqual([{ itemId: 2, quantity: 1 }])
  })

  it('range à part ce que le catalogue ne connaît pas, objets sur mesure compris', () => {
    const items: CatalogItem[] = [{ id: 1, name: 'Dague', itemType: 'weapon', properties: {}, isCustom: true }]
    expect(resolveLines([{ name: 'Dague', quantity: 1 }, { name: 'Épée vorpale', quantity: 1 }], items)).toEqual({ entries: [], unresolved: ['Dague', 'Épée vorpale'] })
  })
})
