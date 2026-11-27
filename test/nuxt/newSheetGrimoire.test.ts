import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mockNuxtImport, mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { getQuery, readBody } from 'h3'
import { clearNuxtData } from '#app'
import NewSheetPage from '../../app/pages/characters/[id]/nouvelle.vue'
import { spells as spellSeeds } from '../../server/db/seeds/data/spells'
import { abilityScores } from '../fixtures/classSheet'

mockNuxtImport('navigateTo', () => vi.fn())

const SHEET_ID = 9406
const URL = `/api/character_sheets/${SHEET_ID}`
const CLERIC_ID = 2

const catalogSpell = (name: string, id: number) => ({ ...spellSeeds.find(spell => spell.name === name)!, id, school: { name: 'Evocation' } })

const BLESS = catalogSpell('Bénédiction', 901)
const DETECT = catalogSpell('Détection de la magie', 902)
const SACRED_FLAME = catalogSpell('Flamme sacrée', 903)
const CURE = catalogSpell('Soins', 904)
const GUIDANCE = catalogSpell('Assistance', 905)
const MAGIC_MISSILE = catalogSpell('Projectile magique', 906)

const characterSpell = (spell: ReturnType<typeof catalogSpell>, over: Record<string, unknown> = {}) => ({
  characterSheetId: SHEET_ID,
  spellId: spell.id,
  classId: CLERIC_ID,
  isKnown: true,
  isPrepared: false,
  alwaysPrepared: false,
  source: null,
  spell,
  ...over,
})

let ownedSpells: ReturnType<typeof characterSpell>[]
const spellPuts: unknown[] = []
const spellDeletes: unknown[] = []

registerEndpoint(URL, () => ({
  id: SHEET_ID,
  name: 'Ambroise',
  ruleset: '5',
  updatedAt: '2026-11-27T10:00:00.000Z',
  hpBase: 24,
  currentHp: 24,
  temporaryHp: 0,
  exhaustionLevel: 0,
  deathSaveSuccesses: 0,
  deathSaveFailures: 0,
  concentratingSpellId: null,
  concentratingOn: null,
  baseAbilityScores: abilityScores({ wis: 16 }),
  classes: [{ classId: CLERIC_ID, level: 3, isMain: true, class: { name: 'Clerc', hitDice: '1d8', spellcastingAbility: 'wis' }, subclass: null }],
  features: [],
  spellSlots: [{ slotType: 'spellcasting', slotLevel: 1, total: 4, used: 1, created: 0 }],
  proficiencyOverrides: [],
  abilityScoreImprovements: [],
  temporaryEffects: [],
  species: null,
  preferences: null,
  owner: { id: 1, name: 'PM', preferences: null },
}))
registerEndpoint(URL, { method: 'PUT', handler: async event => readBody(event) })
registerEndpoint(`${URL}/spells`, () => ownedSpells)
registerEndpoint(`${URL}/spells`, {
  method: 'PUT',
  handler: async (event) => {
    const body = await readBody(event) as { spellId: number }[]
    spellPuts.push(body)
    for (const { spellId } of body) {
      if (!ownedSpells.some(cs => cs.spellId === spellId)) {
        const spell = [GUIDANCE, MAGIC_MISSILE].find(candidate => candidate.id === spellId)!
        ownedSpells = [...ownedSpells, characterSpell(spell)]
      }
    }
    return { ok: true }
  },
})
registerEndpoint(`${URL}/spells`, {
  method: 'DELETE',
  handler: async (event) => {
    const body = await readBody(event) as { spellId: number }
    spellDeletes.push(body)
    ownedSpells = ownedSpells.filter(cs => cs.spellId !== body.spellId)
    return { ok: true }
  },
})
// The catalogue answers a class's spells when asked for one class.
registerEndpoint('/api/spells', (event) => {
  const { className } = getQuery(event)
  const all = [BLESS, DETECT, SACRED_FLAME, CURE, GUIDANCE, MAGIC_MISSILE]
  return className === 'Clerc' ? all.filter(spell => spell !== MAGIC_MISSILE) : className ? [MAGIC_MISSILE] : all
})
for (const part of ['inventory', 'backgrounds', 'spell_slots']) registerEndpoint(`${URL}/${part}`, () => [])
registerEndpoint(`${URL}/spell-slots`, { method: 'PUT', handler: async event => readBody(event) })
registerEndpoint('/api/items', () => [])

const mounted: { unmount: () => void }[] = []

beforeEach(() => {
  clearNuxtData()
  ownedSpells = [
    characterSpell(BLESS, { isPrepared: true }),
    characterSpell(DETECT, { isPrepared: true }),
    characterSpell(SACRED_FLAME),
    characterSpell(CURE, { alwaysPrepared: true, isPrepared: true, source: 'feat' }),
  ]
  spellPuts.length = 0
  spellDeletes.length = 0
})

afterEach(() => {
  mounted.splice(0).forEach(wrapper => wrapper.unmount())
})

const mountGrimoire = async () => {
  const wrapper = await mountSuspended(NewSheetPage, { route: `/characters/${SHEET_ID}/nouvelle?view=grimoire` })
  mounted.push(wrapper)
  await flushPromises()
  return wrapper
}

type Wrapper = Awaited<ReturnType<typeof mountGrimoire>>

const labelOf = (text: string | null) => (text ?? '').replace(/\s+/g, ' ').trim().replace(/^\+ ?/, '')
const dialog = () => document.body.querySelector('[role="dialog"]')!
const listedSpells = (wrapper: Wrapper) =>
  Object.fromEntries(wrapper.findAll('section.group').map(group => [group.attributes('aria-label'), group.findAll('.spell-row b').map(name => name.text())]))
const openSpell = async (wrapper: Wrapper, name: string) => {
  await wrapper.findAll('.spell-row').find(row => row.text().includes(name))!.trigger('click')
  await flushPromises()
  return wrapper.get('aside.drawer')
}
const clickAction = async (wrapper: Wrapper, label: string) => {
  await wrapper.get('aside.drawer').findAll('button').find(button => labelOf(button.text()).startsWith(label))!.trigger('click')
  await flushPromises()
}

describe('nouvelle fiche — vue Grimoire', () => {
  it('montre la classe lanceuse, les sorts préparés et les sorts groupés par niveau', async () => {
    const wrapper = await mountGrimoire()

    const casters = wrapper.get('.casters')
    expect(casters.text()).toContain('Clerc')
    expect(casters.text()).toContain('Sagesse')
    expect(casters.get('tbody').text()).toMatch(/13\s*\+5/)
    expect(casters.text()).toMatch(/Sorts préparés : 2 sur \d/)
    expect(listedSpells(wrapper)).toEqual({
      'Tours de magie': ['Flamme sacrée'],
      'Niveau 1': ['Bénédiction', 'Détection de la magie', 'Soins'],
    })
  })

  it('les filtres Concentration et Rituel se cumulent', async () => {
    const wrapper = await mountGrimoire()

    const chip = (label: string) => wrapper.findAll('button').find(button => button.text() === label)!
    await chip('Rituel').trigger('click')
    expect(listedSpells(wrapper)).toEqual({ 'Niveau 1': ['Détection de la magie'] })
    await chip('Rituel').trigger('click')
    await chip('Concentration').trigger('click')
    expect(listedSpells(wrapper)['Niveau 1']).toEqual(['Bénédiction', 'Détection de la magie'])
  })

  it('le tiroir montre la source et le statut, et ne plus préparer met à jour le compte', async () => {
    const wrapper = await mountGrimoire()

    let drawer = await openSpell(wrapper, 'Détection de la magie')
    expect(drawer.text()).toContain('Préparé')
    expect(drawer.text()).toContain('Lancer en rituel')
    await clickAction(wrapper, 'Ne plus préparer')

    await vi.waitFor(() => expect(spellPuts).toEqual([[{ spellId: 902, isKnown: true, isPrepared: false }]]))
    drawer = wrapper.get('aside.drawer')
    expect(drawer.text()).toContain('Non préparé')
    expect(wrapper.get('.casters').text()).toContain('Sorts préparés : 1 sur')

    drawer = await openSpell(wrapper, 'Soins')
    expect(drawer.text()).toContain('Don')
    expect(drawer.text()).toContain('Toujours préparé')
    expect(drawer.findAll('button').map(button => labelOf(button.text()))).not.toContain('Retirer du grimoire')
  })

  it('retirer un sort passe par une confirmation et l\'efface de la liste', async () => {
    const wrapper = await mountGrimoire()

    await openSpell(wrapper, 'Bénédiction')
    await clickAction(wrapper, 'Retirer du grimoire')
    await vi.waitFor(() => expect(dialog().textContent).toContain('Bénédiction quitte le grimoire.'))
    expect(spellDeletes).toEqual([])

    Array.from(dialog().querySelectorAll('button')).find(button => labelOf(button.textContent) === 'Retirer')!.click()
    await vi.waitFor(() => expect(spellDeletes).toEqual([{ spellId: 901 }]))
    expect(listedSpells(wrapper)['Niveau 1']).toEqual(['Détection de la magie', 'Soins'])
  })

  it('l\'ajout de sort filtre d\'abord sur la classe du personnage, et un sort ajouté se reprend', async () => {
    const wrapper = await mountGrimoire()

    await wrapper.findAll('button').find(button => labelOf(button.text()) === 'Ajouter un sort')!.trigger('click')
    await vi.waitFor(() => expect(dialog().querySelectorAll('.result').length).toBe(5))
    const names = () => Array.from(dialog().querySelectorAll('.result__name')).map(name => labelOf(name.textContent).replace(/^[ABR] /, ''))
    expect(names()).not.toContain('Projectile magique')
    expect(dialog().querySelectorAll('.result--owned')).toHaveLength(4)

    const guidance = () => Array.from(dialog().querySelectorAll('.result')).find(row => row.textContent?.includes('Assistance'))!
    guidance().querySelector('input')!.click()
    await vi.waitFor(() => expect(dialog().textContent).toContain('1 sort ajouté pendant cette visite'))
    expect(spellPuts).toEqual([[{ spellId: 905, classId: CLERIC_ID, isKnown: true, isPrepared: false }]])
    await vi.waitFor(() => expect(listedSpells(wrapper)['Tours de magie']).toContain('Assistance'))

    guidance().querySelector('input')!.click()
    await vi.waitFor(() => expect(spellDeletes).toEqual([{ spellId: 905 }]))
    await vi.waitFor(() => expect(listedSpells(wrapper)['Tours de magie']).not.toContain('Assistance'))

    Array.from(dialog().querySelectorAll<HTMLButtonElement>('[aria-label="Classe"] button')).find(button => button.textContent?.trim() === 'Clerc')!.click()
    await vi.waitFor(() => expect(names()).toContain('Projectile magique'))
  })
})
