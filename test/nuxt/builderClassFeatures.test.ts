import { describe, it, expect, vi } from 'vitest'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import BuilderSummary from '../../app/components/character_builder/BuilderSummary.vue'
import { useCharacterBuilder, type BuilderState } from '../../app/composables/useCharacterBuilder'
import { barbareFeatures } from '../../server/db/seeds/data/barbare'
import { bardeFeatures } from '../../server/db/seeds/data/barde'
import { guerrierSubclasses } from '../../server/db/seeds/data/guerrier'
import type { CatalogClassFeature } from '../../server/utils/catalogSources'
import { catalogClasses } from '../fixtures/catalogClasses'

// Le récapitulatif doit afficher ce que la fiche créée affichera : les capacités de classe et de sous-classe acquises
// au niveau choisi (Champion primitif, Touche-à-tout, Athlète accompli) comptent dans les scores, les PV et l'initiative.
// Effets recopiés du seed.

const classes = catalogClasses()
const classId = (name: string) => classes.find(c => c.name === name)!.id
const CHAMPION = 601

const effectsOf = (features: { name: string, effects?: unknown[] }[], name: string) =>
  features.find(f => f.name === name)!.effects as CatalogClassFeature['effects']
const athlete = guerrierSubclasses.find(s => s.name === 'Champion')!.features.find(f => f.name === 'Athlète accompli')!

registerEndpoint('/api/catalog/classes', () => classes.map(c => c.name === 'Guerrier'
  ? { ...c, subclasses: [{ id: CHAMPION, name: 'Champion', description: null }] }
  : c))
registerEndpoint('/api/catalog/class-features', (): CatalogClassFeature[] => [
  { featureType: 'class_feature', classId: classId('Barbare'), subclassId: null, levelRequired: 20, effects: effectsOf(barbareFeatures, 'Champion primitif') },
  { featureType: 'class_feature', classId: classId('Barde'), subclassId: null, levelRequired: 2, effects: effectsOf(bardeFeatures, 'Touche-à-tout') },
  { featureType: 'subclass_feature', classId: classId('Guerrier'), subclassId: CHAMPION, levelRequired: athlete.levelRequired!, effects: athlete.effects as CatalogClassFeature['effects'] },
])
registerEndpoint('/api/catalog/progressions', () => ({ progressions: [] }))
registerEndpoint('/api/catalog/feats', () => [])
registerEndpoint('/api/catalog/invocations', () => [])
registerEndpoint('/api/catalog/feature-options', () => [])
registerEndpoint('/api/catalog/species', () => [])

type Wrapper = { findAll: (selector: string) => Array<{ text: () => string }> }

const compact = (s: string) => s.replace(/\s+/g, '')
const statText = (wrapper: Wrapper, label: string) => wrapper.findAll('div.rounded-xl.p-3.text-center')
  .map(r => compact(r.text()))
  .find(t => t.endsWith(compact(label)))

function buildCharacter(partial: Partial<BuilderState>) {
  const builder = useCharacterBuilder()
  builder.resetBuilder()
  Object.assign(builder.state.value, { name: 'Test', level: 1, backgroundId: 'acolyte', alignment: 'N', raceId: 'human', ...partial })
  return builder
}

describe('builder — Champion primitif (Barbare 20)', () => {
  // Humain : +1 partout → FOR 21 · CON 19 avant la capacité.
  const barbarian = (level: number) => buildCharacter({
    classId: 'barbarian',
    level,
    abilities: { str: 20, dex: 10, con: 18, int: 8, wis: 10, cha: 8 },
  })

  it('niveau 20 : +4 en FOR et CON, maximum relevé à 24', async () => {
    const builder = barbarian(20)
    await mountSuspended(BuilderSummary)
    await vi.waitFor(() => expect(builder.finalAbilities.value.str).toBe(24)) // 21 + 4 = 25, plafonné à 24
    expect(builder.finalAbilities.value.con).toBe(23) // 19 + 4
    expect(builder.finalAbilities.value.dex).toBe(11)
  })

  it('niveau 19 : plafond de 20, aucune capacité', async () => {
    const builder = barbarian(19)
    await mountSuspended(BuilderSummary)
    await vi.waitFor(() => expect(builder.classFeatureEffects.value).toEqual([]))
    expect(builder.finalAbilities.value.str).toBe(20)
    expect(builder.finalAbilities.value.con).toBe(19)
  })

  it('les PV du récapitulatif suivent la CON de la fiche (d12 : 12 + 19 × 7, CON 23 → +6 par niveau)', async () => {
    barbarian(20)
    const wrapper = await mountSuspended(BuilderSummary)
    await vi.waitFor(() => expect(statText(wrapper, 'PV max')).toBe('265PVmax')) // 145 + 6 × 20
  })
})

describe('builder — Touche-à-tout (Barde 2)', () => {
  // Humain : DEX 14 + 1 = 15 → +2.
  const bard = (level: number) => buildCharacter({
    classId: 'bard',
    level,
    abilities: { str: 8, dex: 14, con: 12, int: 10, wis: 10, cha: 15 },
  })

  it('niveau 1 : l\'initiative n\'ajoute rien', async () => {
    bard(1)
    const wrapper = await mountSuspended(BuilderSummary)
    await vi.waitFor(() => expect(statText(wrapper, 'Initiative')).toBe('+2Initiative'))
  })

  it('niveau 2 : la moitié du bonus de maîtrise (arrondi à l\'inférieur) s\'ajoute à l\'initiative', async () => {
    bard(2)
    const wrapper = await mountSuspended(BuilderSummary)
    await vi.waitFor(() => expect(statText(wrapper, 'Initiative')).toBe('+3Initiative')) // +2 + 2 / 2
  })
})

describe('builder — Athlète accompli (sous-classe Champion du Guerrier)', () => {
  // Humain : DEX 13 + 1 = 14 → +2.
  const fighter = (level: number, subclass: string | null) => buildCharacter({
    classId: 'fighter',
    level,
    subclass,
    abilities: { str: 15, dex: 13, con: 14, int: 10, wis: 12, cha: 8 },
  })

  it('niveau 7 avec la sous-classe : la moitié du bonus de maîtrise (arrondi au supérieur) s\'ajoute à l\'initiative', async () => {
    fighter(7, 'Champion')
    const wrapper = await mountSuspended(BuilderSummary)
    await vi.waitFor(() => expect(statText(wrapper, 'Initiative')).toBe('+4Initiative')) // +2 + ⌈3 / 2⌉
  })

  it('sans la sous-classe, ou avant le niveau 7 : rien', async () => {
    fighter(7, null)
    const without = await mountSuspended(BuilderSummary)
    await vi.waitFor(() => expect(statText(without, 'Initiative')).toBe('+2Initiative'))

    fighter(6, 'Champion')
    const early = await mountSuspended(BuilderSummary)
    await vi.waitFor(() => expect(statText(early, 'Initiative')).toBe('+2Initiative'))
  })
})
