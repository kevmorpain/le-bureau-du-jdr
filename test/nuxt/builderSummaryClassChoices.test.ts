import { describe, it, expect, vi } from 'vitest'
import { getQuery } from 'h3'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import BuilderSummary from '../../app/components/character_builder/BuilderSummary.vue'
import { useCharacterBuilder, type BuilderState } from '../../app/composables/useCharacterBuilder'
import type { Catalog } from '../../shared/rules/resolve'
import { FAVORED_ENEMIES, FAVORED_TERRAINS } from '../../shared/rules/rangerFavorites'
import { FAVORED_ENEMY_COUNT, FAVORED_TERRAIN_COUNT } from '../../server/db/seeds/data/rodeur'
import { guerrierSubclasses } from '../../server/db/seeds/data/guerrier'
import { maneuverFeatures } from '../../server/db/seeds/data/maneuvers'
import { catalogClasses } from '../fixtures/catalogClasses'

// Le récapitulatif affiche les choix de classe que la fiche affichera : ennemis jurés et terrains du Rôdeur, 2ᵉ style de combat
// du Champion, manœuvres du Maître de guerre.

const RODEUR = 8
const GUERRIER = 5
const CHASSEUR = 30
const CHAMPION = 13
const MAITRE = 15
const STYLES = [{ id: 31, name: 'Archerie' }, { id: 32, name: 'Défense' }, { id: 33, name: 'Duel' }]
const MANEUVERS = maneuverFeatures.map((f, i) => ({ id: 100 + i, name: f.name }))
const OPTIONS = [...STYLES, ...MANEUVERS]

const classEntry = (name: string, id: number, subclasses: Array<{ id: number, name: string }>) => ({
  id,
  name,
  subclassLevel: 3,
  subclasses,
  proficiencies: catalogClasses().find(c => c.name === name)!.proficiencies,
})

registerEndpoint('/api/catalog/classes', () => [
  classEntry('Rôdeur', RODEUR, [{ id: CHASSEUR, name: 'Chasseur' }]),
  classEntry('Guerrier', GUERRIER, [{ id: CHAMPION, name: 'Champion' }, { id: MAITRE, name: 'Maître de guerre' }]),
])
registerEndpoint('/api/catalog/progressions', (): Catalog => ({
  progressions: [
    { progressionId: 1, ownerClassId: RODEUR, ownerLevelRequired: 1, kind: 'favored_enemy', count: FAVORED_ENEMY_COUNT, optionSource: { type: 'enum', values: [...FAVORED_ENEMIES] }, replaceable: false, options: FAVORED_ENEMIES.map(value => ({ value })) },
    { progressionId: 2, ownerClassId: RODEUR, ownerLevelRequired: 1, kind: 'terrain', count: FAVORED_TERRAIN_COUNT, optionSource: { type: 'enum', values: [...FAVORED_TERRAINS] }, replaceable: false, options: FAVORED_TERRAINS.map(value => ({ value })) },
    { progressionId: 7, ownerClassId: GUERRIER, ownerSubclassId: CHAMPION, ownerLevelRequired: 10, kind: 'additional_fighting_style', count: { op: 'fixed', value: 1 }, optionSource: { type: 'feature_group', group: 'fighting_style' }, replaceable: false, options: STYLES.map(s => ({ featureId: s.id })) },
    {
      progressionId: 8,
      ownerClassId: GUERRIER,
      ownerSubclassId: MAITRE,
      ownerLevelRequired: 3,
      ...guerrierSubclasses.find(s => s.name === 'Maître de guerre')!.features.find(f => f.name === 'Supériorité martiale')!.progression!,
      replaceable: true,
      options: MANEUVERS.map(m => ({ featureId: m.id })),
    },
  ],
}))
registerEndpoint('/api/catalog/feature-options', (event) => {
  const ids = String(getQuery(event).ids ?? '').split(',').map(Number)
  return OPTIONS.filter(o => ids.includes(o.id))
})
registerEndpoint('/api/invocations', () => [])
registerEndpoint('/api/feats', () => [])

async function summaryOf(partial: Partial<BuilderState>) {
  const { state, resetBuilder } = useCharacterBuilder()
  resetBuilder()
  Object.assign(state.value, { name: 'Test', backgroundId: 'acolyte', alignment: 'N', raceId: 'human', ...partial })
  const wrapper = await mountSuspended(BuilderSummary)
  // Les badges se suivent sans espace : le texte est lu sans blancs.
  return { wrapper, text: () => wrapper.text().replace(/\s+/g, '') }
}

// Le builder partage son état entre les montages : chaque cas se lit avant le suivant.
describe('Récapitulatif du builder — choix de classe', () => {
  it('Rôdeur 6 : ennemis jurés et terrains choisis', async () => {
    const { text } = await summaryOf({ classId: 'ranger', level: 6, choicePicks: { 1: ['Dragons', 'Fées'], 2: ['Forêt', 'Marais'] } })

    await vi.waitFor(() => expect(text()).toContain('Choixdeclasse'))
    expect(text()).toContain('EnnemijuréDragonsFées')
    expect(text()).toContain('TerrainfavoriForêtMarais')
  })

  it('Champion 10 : le deuxième style de combat', async () => {
    const { text } = await summaryOf({ classId: 'fighter', level: 10, subclass: 'Champion', fightingStyle: 'Duel', featurePicks: { 7: [32] } })

    await vi.waitFor(() => expect(text()).toContain('StyledecombatsupplémentaireDéfense'))
  })

  it('Maître de guerre 7 : les manœuvres choisies', async () => {
    const names = ['Parade', 'Riposte', 'Feinte', 'Balayage', 'Fente']
    const ids = names.map(n => MANEUVERS.find(m => m.name === n)!.id)
    const { text } = await summaryOf({ classId: 'fighter', level: 7, subclass: 'Maître de guerre', fightingStyle: 'Duel', featurePicks: { 8: ids } })

    await vi.waitFor(() => expect(text()).toContain('Manœuvres'))
    for (const name of names) expect(text()).toContain(name)
    expect(text()).not.toContain('Regain')
  })

  it('un Guerrier de niveau 1 n\'affiche aucun choix de classe', async () => {
    const { text } = await summaryOf({ classId: 'fighter', level: 1, fightingStyle: 'Duel' })
    await new Promise(r => setTimeout(r, 300))

    expect(text()).toContain('Récapitulatif')
    expect(text()).not.toContain('Choixdeclasse')
  })
})
