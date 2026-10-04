import { describe, it, expect, afterEach, vi } from 'vitest'
import { computed, defineComponent, h, nextTick, reactive, ref } from 'vue'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import DashboardHeaderSection from '../../app/components/character_sheet/DashboardHeaderSection.vue'
import DeathSavingThrowSection from '../../app/components/character_sheet/DeathSavingThrowSection.vue'
import DiceRollerSection from '../../app/components/character_sheet/DiceRollerSection.vue'
import HitPointsSection from '../../app/components/character_sheet/HitPointsSection.vue'
import QuickStatsSection from '../../app/components/character_sheet/QuickStatsSection.vue'
import RollButton from '../../app/components/character_sheet/RollButton.vue'
import RollTablePanel from '../../app/components/character_sheet/RollTablePanel.vue'
import { idlePending, rollEngineKey, type RollEngine } from '../../app/composables/character/useCharacterRolls'
import { useDiceRoller } from '../../app/composables/useDiceRoller'
import { classSheet } from '../fixtures/classSheet'
import { baseScores, mountSheet } from './fixtures/mountSheet'

// Préférence « lancer les dés dans l'application » (D18 : fiche ?? compte ?? défaut) : désactivée, plus aucun jet ni toast, et les
// jets qui écrivent un état (jets contre la mort, table aléatoire, initiative) acceptent le résultat lancé à la table.

afterEach(() => vi.restoreAllMocks())

let sheetSeq = 9800

registerEndpoint('/api/backgrounds', () => [])

// Le moteur que la page fournit : seul `rollsEnabled` varie.
const engineOf = (enabled: boolean): RollEngine => ({
  characterId: undefined,
  policy: () => ({ sources: [], rerollOn: null, minimum: null, critFrom: 20, autoFail: [] }),
  situations: computed(() => []),
  criticalExtraDice: computed(() => 0),
  pending: ref(idlePending()),
  rollsEnabled: computed(() => enabled),
})
const rollsOff = { provide: { [rollEngineKey as symbol]: engineOf(false) } }
const rollsOn = { provide: { [rollEngineKey as symbol]: engineOf(true) } }

const registerSheet = (id: number) => {
  registerEndpoint(`/api/character_sheets/${id}/inventory`, () => [])
  registerEndpoint(`/api/character_sheets/${id}/proficiency-overrides`, () => [])
  registerEndpoint(`/api/character_sheets/${id}/spells`, () => [])
}

const dyingSheet = (over: Record<string, unknown> = {}) => {
  const id = ++sheetSeq
  registerSheet(id)
  return reactive({
    id,
    hpBase: 20,
    currentHp: 0,
    temporaryHp: 0,
    exhaustionLevel: 0,
    deathSaveSuccesses: 0,
    deathSaveFailures: 0,
    concentratingSpellId: null,
    concentratingOn: null,
    baseAbilityScores: [],
    classes: [{ classId: 1, level: 1 }],
    features: [],
    skills: [],
    abilityScoreImprovements: [],
    species: null,
    ...over,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any) as any
}

const buttonWith = (wrapper: Awaited<ReturnType<typeof mountSuspended>>, text: string) =>
  wrapper.findAll('button').find(b => b.text().includes(text))

describe('préférence de la fiche — fiche ?? compte ?? défaut codé', () => {
  const scores = baseScores(10, 10, 10, 10)
  const rollsEnabled = async (scenario: { preferences?: { diceRolls?: boolean } | null, ownerPreferences?: { diceRolls?: boolean } | null }) =>
    (await mountSheet({ scores, ...scenario })).rollEngine.rollsEnabled.value

  it('activés par défaut', async () => {
    expect(await rollsEnabled({})).toBe(true)
  })

  it('une fiche qui n\'a rien tranché suit le compte', async () => {
    expect(await rollsEnabled({ ownerPreferences: { diceRolls: false } })).toBe(false)
    expect(await rollsEnabled({ ownerPreferences: { diceRolls: true } })).toBe(true)
  })

  it('la fiche l\'emporte sur le compte, dans les deux sens', async () => {
    expect(await rollsEnabled({ preferences: { diceRolls: true }, ownerPreferences: { diceRolls: false } })).toBe(true)
    expect(await rollsEnabled({ preferences: { diceRolls: false }, ownerPreferences: { diceRolls: true } })).toBe(false)
  })

  it('basculer écrit sur la fiche, « défaut du compte » efface la clé et rend la main au compte', async () => {
    const s = await mountSheet({ scores, ownerPreferences: { diceRolls: true } })

    s.setPreference('diceRolls', false)
    expect(s.ownPreferences.value).toEqual({ diceRolls: false })
    expect(s.rollEngine.rollsEnabled.value).toBe(false)

    s.setPreference('diceRolls', null)
    expect(s.ownPreferences.value).toBeNull()
    expect(s.rollEngine.rollsEnabled.value).toBe(true)
  })
})

describe('useDiceRoller — jets désactivés', () => {
  const mountRoller = async (engine: RollEngine) => {
    let api!: ReturnType<typeof useDiceRoller>
    await mountSuspended(defineComponent({
      setup() {
        api = useDiceRoller(engine)
        return () => h('div')
      },
    }))
    api.toasts.value = []
    return api
  }

  it('ne lance aucun dé, n\'affiche rien et ne garde rien', async () => {
    const random = vi.spyOn(Math, 'random')
    const api = await mountRoller(engineOf(false))
    const before = api.history.entries.value.length

    expect(api.roll('Sagesse', 3, 20, 1, { d20: { type: 'check', ability: 'wis' } })).toBe(0)
    expect(random).not.toHaveBeenCalled()
    expect(api.toasts.value).toEqual([])
    expect(api.history.entries.value).toHaveLength(before)
  })

  it('activés, le jet se fait', async () => {
    const api = await mountRoller(engineOf(true))
    expect(api.roll('d6', 0, 6)).toBeGreaterThan(0)
    expect(api.toasts.value).toHaveLength(1)
  })
})

describe('en-tête — réglage par fiche et panneau de jets', () => {
  const mountHeader = (over: Record<string, unknown> = {}) =>
    mountSuspended(DashboardHeaderSection, {
      props: { characterSheet: dyingSheet({ currentHp: 20, preferences: null, owner: { id: 1, name: 'Testeur', preferences: null }, ...over }), isResting: false, combatMode: false, roll: () => 0 },
    })
  const openPreferences = async (wrapper: Awaited<ReturnType<typeof mountSuspended>>) => {
    await wrapper.find('button[aria-label="Préférences"]').trigger('click')
    await vi.waitFor(() => expect(document.body.textContent).toContain('Préférences de cette fiche'))
  }

  it('propose le réglage, et dit ce que le compte donne quand la fiche n\'a rien tranché', async () => {
    const wrapper = await mountHeader({ owner: { id: 1, name: 'Testeur', preferences: { diceRolls: false } } })
    await openPreferences(wrapper)
    expect(document.body.textContent).toContain('Lancer les dés dans l\'application')
    expect(document.body.textContent).toContain('Défaut du compte (non)')
    wrapper.unmount()
  })

  it('une fiche qui a tranché l\'affiche : « Non » reste « Non » même si le compte dit oui', async () => {
    const wrapper = await mountHeader({ preferences: { diceRolls: false }, owner: { id: 1, name: 'Testeur', preferences: { diceRolls: true } } })
    await openPreferences(wrapper)
    expect(document.body.querySelector('button[role="combobox"]')!.textContent).toContain('Non')
    wrapper.unmount()
  })

  it('le panneau de jets (toasts, historique) n\'est affiché que jets activés', async () => {
    const jetsButton = () => document.body.querySelector('button[aria-label^="Jets"]')

    const enabled = await mountSuspended(DiceRollerSection, { global: rollsOn })
    expect(jetsButton()).not.toBeNull()
    enabled.unmount()

    const disabled = await mountSuspended(DiceRollerSection, { global: rollsOff })
    expect(jetsButton()).toBeNull()
    disabled.unmount()
  })
})

describe('RollButton', () => {
  const mountButton = (clicked: () => void, global: typeof rollsOn) =>
    mountSuspended(RollButton, { props: { onClick: clicked }, slots: { default: () => 'Attaque +5' }, global })

  it('actif : un vrai bouton', async () => {
    const clicked = vi.fn()
    const wrapper = await mountButton(clicked, rollsOn)
    await wrapper.find('button').trigger('click')
    expect(clicked).toHaveBeenCalledOnce()
  })

  it('hors d\'une fiche, aucun moteur : les jets restent actifs', async () => {
    const wrapper = await mountSuspended(RollButton, { slots: { default: () => 'd6' } })
    expect(wrapper.find('button').exists()).toBe(true)
  })

  it('jets désactivés : une étiquette qui garde le modificateur lisible, sans bouton', async () => {
    const wrapper = await mountButton(vi.fn(), rollsOff)
    expect(wrapper.find('button').exists()).toBe(false)
    const label = wrapper.find('span.pointer-events-none')
    expect(label.exists()).toBe(true)
    expect(label.text()).toBe('Attaque +5')
  })
})

describe('jets contre la mort sans jet de l\'application', () => {
  const mountDying = async (over: Record<string, unknown> = {}, global = rollsOff) => {
    const roll = vi.fn(() => 12)
    const s = dyingSheet(over)
    const wrapper = await mountSuspended(DeathSavingThrowSection, { props: { characterSheet: s, roll }, global })
    return { s, wrapper, roll }
  }
  const field = 'input[aria-label="Résultat du d20 du jet de mort"]'
  const enter = async (wrapper: Awaited<ReturnType<typeof mountSuspended>>, value: number) => {
    await wrapper.find(field).setValue(String(value))
    await buttonWith(wrapper, 'Valider')!.trigger('click')
  }

  it('remplace le bouton de jet par une saisie du d20, sans jamais lancer', async () => {
    const { wrapper, roll } = await mountDying()
    expect(buttonWith(wrapper, 'Lancer un jet de mort')).toBeUndefined()
    expect(wrapper.find(field).exists()).toBe(true)
    expect(roll).not.toHaveBeenCalled()
  })

  it('10 ou plus : un succès ; moins de 10 : un échec', async () => {
    const { s, wrapper } = await mountDying()
    await enter(wrapper, 14)
    expect(s).toMatchObject({ deathSaveSuccesses: 1, deathSaveFailures: 0 })
    await enter(wrapper, 6)
    expect(s).toMatchObject({ deathSaveSuccesses: 1, deathSaveFailures: 1 })
  })

  it('1 naturel : deux échecs ; 20 naturel : retour à 1 PV, jets remis à zéro', async () => {
    const failing = await mountDying({ deathSaveSuccesses: 1 })
    await enter(failing.wrapper, 1)
    expect(failing.s).toMatchObject({ deathSaveSuccesses: 1, deathSaveFailures: 2 })

    const lucky = await mountDying({ deathSaveFailures: 2 })
    await enter(lucky.wrapper, 20)
    expect(lucky.s).toMatchObject({ currentHp: 1, deathSaveSuccesses: 0, deathSaveFailures: 0 })
  })

  it('une valeur qui n\'est pas un d20 ne se valide pas', async () => {
    const { s, wrapper } = await mountDying()
    for (const value of ['0', '21', '']) {
      await wrapper.find(field).setValue(value)
      expect(buttonWith(wrapper, 'Valider')!.attributes('disabled')).toBeDefined()
    }
    expect(s).toMatchObject({ deathSaveSuccesses: 0, deathSaveFailures: 0 })
  })

  it('jets activés, le bouton de jet reste et la saisie n\'existe pas', async () => {
    const { wrapper } = await mountDying({}, rollsOn)
    expect(buttonWith(wrapper, 'Lancer un jet de mort')).toBeDefined()
    expect(wrapper.find(field).exists()).toBe(false)
  })
})

describe('concentration sans jet de l\'application', () => {
  const damaged = async (global: typeof rollsOn) => {
    const s = dyingSheet({ currentHp: 20, concentratingOn: 'Ténèbres' })
    const wrapper = await mountSuspended(HitPointsSection, { props: { characterSheet: s }, global })
    await buttonWith(wrapper, 'Dégâts')!.trigger('click')
    await wrapper.find('input[placeholder="Dégâts bruts"]').setValue('4')
    await buttonWith(wrapper, 'OK')!.trigger('click')
  }
  const modalButtons = () => [...document.body.querySelectorAll('button')].map(b => b.textContent ?? '')

  it('le jet de Constitution se tranche à la main : « Réussi » et « Raté » restent, « Lancer le jet » disparaît', async () => {
    await damaged(rollsOff)
    expect(document.body.textContent).toContain('Vérification de concentration')
    expect(modalButtons().some(t => t.includes('Réussi'))).toBe(true)
    expect(modalButtons().some(t => t.includes('Raté'))).toBe(true)
    expect(modalButtons().some(t => t.includes('Lancer le jet'))).toBe(false)
  })
})

describe('RollTablePanel sans jet de l\'application', () => {
  const table = {
    name: 'Table test',
    die: 4,
    entries: [
      { min: 1, max: 2, text: 'Effet bas' },
      { min: 3, max: 4, text: 'Effet haut' },
    ],
  }
  const highlighted = (wrapper: Awaited<ReturnType<typeof mountSuspended>>) =>
    wrapper.findAll('li').filter(li => li.attributes('aria-current') === 'true').map(li => li.text())

  it('le résultat saisi surligne la ligne, comme un jet', async () => {
    const wrapper = await mountSuspended(RollTablePanel, { props: { table }, global: rollsOff })
    expect(buttonWith(wrapper, 'Lancer le d4')).toBeUndefined()

    await wrapper.find('input[aria-label="Résultat du d4"]').setValue('3')
    await buttonWith(wrapper, 'Voir le résultat')!.trigger('click')
    expect(highlighted(wrapper)).toEqual(['3-4Effet haut'])

    await wrapper.find('input[aria-label="Résultat du d4"]').setValue('1')
    await buttonWith(wrapper, 'Voir le résultat')!.trigger('click')
    expect(highlighted(wrapper)).toEqual(['1-2Effet bas'])
    expect(wrapper.findAll('li')[1]!.classes()).toContain('bg-elevated')
  })

  it('un résultat hors du dé ne se valide pas', async () => {
    const wrapper = await mountSuspended(RollTablePanel, { props: { table }, global: rollsOff })
    await wrapper.find('input[aria-label="Résultat du d4"]').setValue('5')
    expect(buttonWith(wrapper, 'Voir le résultat')!.attributes('disabled')).toBeDefined()
  })
})

describe('initiative sans jet de l\'application', () => {
  const mountStats = async (global: typeof rollsOn) => {
    const id = ++sheetSeq
    registerSheet(id)
    const wrapper = await mountSuspended(QuickStatsSection, {
      props: { characterSheet: classSheet(id, 'Guerrier', 6, 5, []), roll: vi.fn() },
      global: { ...global, stubs: { UTooltip: { template: '<div><slot /></div>' } } },
    })
    await new Promise(r => setTimeout(r, 50))
    return { id, wrapper }
  }

  it('actif : la carte est un bouton qui lance l\'initiative', async () => {
    const { wrapper } = await mountStats(rollsOn)
    expect(wrapper.find('input[aria-label="Initiative obtenue"]').exists()).toBe(false)
    expect(buttonWith(wrapper, 'Initiative')).toBeDefined()
  })

  it('désactivé : le total annoncé se saisit et se conserve pour le combat, le dé naturel s\'en déduit', async () => {
    const { id, wrapper } = await mountStats(rollsOff)
    expect(buttonWith(wrapper, 'Initiative')).toBeUndefined()

    await wrapper.find('input[aria-label="Initiative obtenue"]').setValue('17')
    await nextTick()
    expect(JSON.parse(localStorage.getItem(`char:${id}:initiative`)!)).toEqual({ total: 17, natural: 17 })

    await wrapper.find('input[aria-label="Initiative obtenue"]').setValue('')
    await nextTick()
    expect(localStorage.getItem(`char:${id}:initiative`)).toBeNull()
  })
})
