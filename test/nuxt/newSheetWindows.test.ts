import { describe, it, expect, vi, afterEach } from 'vitest'
import { nextTick, reactive, ref } from 'vue'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { readBody } from 'h3'
import { useState } from '#app'
import SheetHitPointsWindow from '../../app/components/sheet/SheetHitPointsWindow.vue'
import SheetConcentrationWindow from '../../app/components/sheet/SheetConcentrationWindow.vue'
import SheetDeathSavesWindow from '../../app/components/sheet/SheetDeathSavesWindow.vue'
import SheetRestWindow from '../../app/components/sheet/SheetRestWindow.vue'
import SheetEffectsWindow from '../../app/components/sheet/SheetEffectsWindow.vue'

const SHEET_ID = 9501
const URL = `/api/character_sheets/${SHEET_ID}`

registerEndpoint(`${URL}/inventory`, () => [])
registerEndpoint(`${URL}/backgrounds`, () => [])
registerEndpoint(`${URL}/spells`, () => [])
const restBodies: Record<string, unknown>[] = []
registerEndpoint(`${URL}/rest`, {
  method: 'POST',
  handler: async (event) => {
    restBodies.push(await readBody(event))
    return { success: true, rechargedItems: [] }
  },
})

// Niveau 3, CON 10 : 20 PV de base, aucun modificateur.
const sheet = (over: Record<string, unknown> = {}) => reactive({
  id: SHEET_ID,
  name: 'Ambroise',
  hpBase: 20,
  currentHp: 20,
  temporaryHp: 0,
  exhaustionLevel: 0,
  deathSaveSuccesses: 0,
  deathSaveFailures: 0,
  concentratingSpellId: null,
  concentratingOn: null,
  currentHitDie: null,
  baseAbilityScores: [],
  classes: [{ classId: 1, level: 3, isMain: true, class: { name: 'Occultiste', hitDice: '1d8' } }],
  features: [],
  proficiencyOverrides: [],
  abilityScoreImprovements: [],
  temporaryEffects: [],
  species: null,
  ...over,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any) as any

const body = () => document.body
const dialogText = () => body().querySelector('[role="dialog"]')?.textContent ?? ''
const visibleText = (b: HTMLElement) => Array.from(b.childNodes)
  .filter(n => n.nodeType === Node.TEXT_NODE || (n instanceof HTMLElement && n.getAttribute('aria-hidden') !== 'true'))
  .map(n => n.textContent).join('').trim()
const buttonOf = (label: string) =>
  Array.from(body().querySelectorAll('button')).find(b => b.getAttribute('aria-label') === label || visibleText(b) === label) as HTMLButtonElement | undefined
const inputOf = (label: string, index = 0) => body().querySelectorAll<HTMLInputElement | HTMLSelectElement>(`[aria-label="${label}"]`)[index]!
const type = (element: HTMLInputElement | HTMLSelectElement, value: string) => {
  element.value = value
  element.dispatchEvent(new Event(element instanceof HTMLSelectElement ? 'change' : 'input'))
}
const click = async (label: string) => {
  await vi.waitFor(() => expect(buttonOf(label)).toBeDefined())
  buttonOf(label)!.click()
  await nextTick()
}

const mounted: { unmount: () => void }[] = []
afterEach(() => {
  mounted.splice(0).forEach(w => w.unmount())
  useState(`concentration-checks-${SHEET_ID}`).value = []
  localStorage.clear()
})

const mount = async (component: unknown, props: Record<string, unknown>) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wrapper = await mountSuspended(component as any, {
    props,
    global: { provide: { spellSlots: ref({ spellcasting: {}, pact_magic: {} }) } },
  })
  mounted.push(wrapper)
  await vi.waitFor(() => expect(body().querySelector('[role="dialog"]')).not.toBeNull())
  return wrapper
}

describe('fenêtre des points de vie', () => {
  it('dégâts par type : la résistance divise la ligne concernée', async () => {
    const s = sheet({
      temporaryEffects: [{ id: 1, name: 'Protection contre le poison', active: true, effects: [{ type: 'damage_resistance', value: { damageType: 'poison' } }] }],
    })
    await mount(SheetHitPointsWindow, { characterSheet: s, open: true })

    type(inputOf('Dégâts'), '9')
    await click('Autre type de dégâts, même coup')
    type(inputOf('Dégâts', 1), '7')
    type(inputOf('Type de dégâts', 1), 'poison')
    await vi.waitFor(() => expect(dialogText()).toContain('Résistance (poison) : 7 → 3'))
    await click('Appliquer')

    expect(s.currentHp).toBe(8)
  })

  it('deux sources : un jet de concentration par source, puis « Raté » rompt la concentration', async () => {
    const s = sheet({ concentratingOn: 'Ténèbres' })
    await mount(SheetHitPointsWindow, { characterSheet: s, open: true })

    type(inputOf('Dégâts'), '4')
    await click('Autre source de dégâts')
    type(inputOf('Dégâts', 1), '6')
    await vi.waitFor(() => expect(dialogText()).toContain('Source 2'))
    await click('Appliquer')
    expect(s.currentHp).toBe(10)

    mounted.splice(0).forEach(w => w.unmount())
    await mount(SheetConcentrationWindow, { characterSheet: s })
    expect(dialogText()).toContain('Les 4 dégâts reçus')
    await click('Réussi')
    await vi.waitFor(() => expect(dialogText()).toContain('Les 6 dégâts reçus'))
    await click('Raté')

    expect(s.concentratingOn).toBeNull()
  })

  it('soins : remettent les jets contre la mort à zéro', async () => {
    const s = sheet({ currentHp: 0, deathSaveFailures: 2 })
    await mount(SheetHitPointsWindow, { characterSheet: s, open: true, initialMode: 'heal' })

    type(inputOf('PV récupérés'), '5')
    await click('Appliquer')

    expect(s).toMatchObject({ currentHp: 5, deathSaveFailures: 0 })
  })
})

describe('fenêtre des jets contre la mort', () => {
  it('un 20 naturel saisi à la main ramène à 1 PV', async () => {
    const s = sheet({ currentHp: 0, deathSaveFailures: 1 })
    await mount(SheetDeathSavesWindow, { characterSheet: s, open: true })

    await click('Saisir le d20 à la main')
    type(inputOf('d20 obtenu'), '20')
    await click('Valider')

    expect(s).toMatchObject({ currentHp: 1, deathSaveFailures: 0 })
  })
})

describe('fenêtre de repos', () => {
  it('repos court : les dés de vie saisis soignent et quittent les dés restants', async () => {
    restBodies.length = 0
    const s = sheet({ currentHp: 6 })
    await mount(SheetRestWindow, { characterSheet: s, open: true })

    await click('Saisir les jets à la main')
    const dice = () => Array.from(body().querySelectorAll<HTMLButtonElement>('button[aria-label^="Dé de vie d8"]'))
    dice()[0]!.click()
    await nextTick()
    dice()[1]!.click()
    await nextTick()
    type(inputOf('Résultat du dé 1'), '5')
    type(inputOf('Résultat du dé 2'), '3')
    await vi.waitFor(() => expect(dialogText()).toContain('PV 6 → 14'))
    await click('Terminer le repos court')

    await vi.waitFor(() => expect(s.currentHp).toBe(14))
    expect(s.currentHitDie).toEqual([{ die: '8', count: 1 }])
    expect(restBodies[0]).toMatchObject({ type: 'short', hitDiceSpent: [{ die: '8', count: 1, healAmount: 5 }, { die: '8', count: 1, healAmount: 3 }] })
  })

  it('repos long : le récapitulatif annonce les dés de vie rendus', async () => {
    const s = sheet({ currentHp: 6, currentHitDie: [{ die: '8', count: 0 }] })
    await mount(SheetRestWindow, { characterSheet: s, open: true })

    await click('Repos long')
    await vi.waitFor(() => expect(dialogText()).toContain('Ce que le repos long rétablit'))
    expect(dialogText()).toContain('Dés de vie · d8')
    expect(dialogText()).toContain('PV 6 → 20')
  })
})

describe('fenêtre des états et effets', () => {
  it('un état touché s’active et se retire de la liste des actifs', async () => {
    const s = sheet()
    await mount(SheetEffectsWindow, { characterSheet: s, open: true })

    await click('Empoisonné')
    await vi.waitFor(() => expect(dialogText()).toContain('Empoisonné · ce qui s\'applique'))
    expect(dialogText()).toContain('La fiche applique d\'elle-même')
    await click('Retirer')
    await vi.waitFor(() => expect(dialogText()).toContain('Aucun état ni effet actif.'))
  })

  it('un effet chiffré s’ajoute à la fiche', async () => {
    const s = sheet()
    await mount(SheetEffectsWindow, { characterSheet: s, open: true })

    await click('Effet')
    type(inputOf('Nom'), 'Bouclier de la foi')
    await click('Bonus à la CA')
    type(inputOf('Bonus'), '2')
    await click('Ajouter l\'effet')

    expect(s.temporaryEffects).toMatchObject([{ name: 'Bouclier de la foi', active: true, effects: [{ type: 'armor_class_bonus', value: { amount: 2 } }] }])
  })
})
