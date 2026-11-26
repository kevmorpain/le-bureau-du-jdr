import { describe, it, expect, vi, afterEach } from 'vitest'
import { nextTick, ref } from 'vue'
import { flushPromises } from '@vue/test-utils'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { useState, useToast } from '#imports'
import SheetCombatStartWindow from '../../app/components/sheet/SheetCombatStartWindow.vue'
import SheetCombatBar from '../../app/components/sheet/SheetCombatBar.vue'
import SheetTurnBlock from '../../app/components/sheet/SheetTurnBlock.vue'
import SheetRail from '../../app/components/sheet/SheetRail.vue'
import { useCombatTracker } from '../../app/composables/character/useCombatTracker'
import { barbareFeatures } from '../../server/db/seeds/data/barbare'
import { abilityScores, classSheet, featureRow, named } from '../fixtures/classSheet'

const BARBARIAN = 1

// `useFetch` met l'inventaire en cache par URL : une fiche (donc des endpoints) par montage.
let sheetSeq = 9600
const nextSheetId = () => {
  const id = ++sheetSeq
  registerEndpoint(`/api/character_sheets/${id}/inventory`, () => [])
  registerEndpoint(`/api/character_sheets/${id}/backgrounds`, () => [])
  registerEndpoint(`/api/character_sheets/${id}/spells`, () => [])
  registerEndpoint(`/api/character_sheets/${id}/features`, { method: 'PUT', handler: () => ({ success: true }) })
  return id
}

// DEX 14 : initiative +2.
const barbarian = (isRaging = false) =>
  classSheet(nextSheetId(), 'Barbare', BARBARIAN, 5, [featureRow(named(barbareFeatures, 'Rage'), BARBARIAN, { active: isRaging })], {
    name: 'Brannoc', currentHp: 30, temporaryHp: 0, deathSaveSuccesses: 0, deathSaveFailures: 0, exhaustionLevel: 0,
    baseAbilityScores: abilityScores({ dex: 14 }),
    species: { name: 'Humain', speed: 9, speciesFeatures: [] },
  })

const body = () => document.body
const dialog = () => body().querySelector('[role="dialog"]')
const visibleText = (b: HTMLElement) => Array.from(b.childNodes)
  .filter(n => n.nodeType === Node.TEXT_NODE || (n instanceof HTMLElement && n.getAttribute('aria-hidden') !== 'true'))
  .map(n => n.textContent).join('').trim()
const buttonOf = (label: string) =>
  Array.from(body().querySelectorAll('button')).find(b => b.getAttribute('aria-label') === label || visibleText(b) === label) as HTMLButtonElement | undefined
const click = async (label: string) => {
  await vi.waitFor(() => expect(buttonOf(label)).toBeDefined())
  buttonOf(label)!.click()
  await nextTick()
}
const tick = () => new Promise(r => setTimeout(r, 30))

const mounted: { unmount: () => void }[] = []
afterEach(() => {
  mounted.splice(0).forEach(w => w.unmount())
  localStorage.clear()
  useState('dice-toasts').value = []
  useToast().clear()
  vi.restoreAllMocks()
})

const mount = async (component: unknown, props: Record<string, unknown>) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wrapper = await mountSuspended(component as any, {
    props,
    attachTo: document.body,
    global: { provide: { spellSlots: ref({ spellcasting: {}, pact_magic: {} }) } },
  })
  mounted.push(wrapper)
  await tick()
  return wrapper
}

// d20 = floor(random × 20) + 1
const rollD20 = (natural: number) => vi.spyOn(Math, 'random').mockReturnValue((natural - 1) / 20)

describe('fenêtre « Début du combat »', () => {
  it('lance l\'initiative à l\'ouverture et commence le combat au round 1', async () => {
    const cs = barbarian()
    const tracker = useCombatTracker(cs.id)
    tracker.round.value = 6
    tracker.usedActions.value = { action: true, bonus_action: true, reaction: false }
    tracker.movementUsed.value = 4.5
    rollD20(15)

    await mount(SheetCombatStartWindow, { characterSheet: cs, open: true })
    await vi.waitFor(() => expect(dialog()).not.toBeNull())

    expect(dialog()!.textContent).toContain('Initiative · d20 +2')
    expect(dialog()!.querySelector('[role="status"]')!.textContent).toBe('17')
    expect(dialog()!.textContent).toContain('Jet : 15 +2')
    expect(useState('dice-toasts').value).toEqual([])

    await click('Commencer le combat')
    await nextTick()

    expect(tracker.isActive.value).toBe(true)
    expect(tracker.initiative.value).toEqual({ total: 17, natural: 15 })
    expect(tracker.round.value).toBe(1)
    expect(tracker.movementUsed.value).toBe(0)
    expect(tracker.usedActions.value).toEqual({ action: false, bonus_action: false, reaction: false })
  })

  it('le d20 se saisit à la main : le total ajoute l\'initiative', async () => {
    const cs = barbarian()
    const tracker = useCombatTracker(cs.id)
    await mount(SheetCombatStartWindow, { characterSheet: cs, open: true })

    await click('Saisir le d20 à la main')
    expect(buttonOf('Commencer le combat')!.disabled).toBe(true)
    const input = body().querySelector<HTMLInputElement>('[aria-label="d20 obtenu"]')!
    input.value = '12'
    input.dispatchEvent(new Event('input'))
    await nextTick()
    expect(dialog()!.textContent).toContain('+2 = 14')

    await click('Commencer le combat')
    expect(tracker.initiative.value).toEqual({ total: 14, natural: 12 })
    expect(tracker.isActive.value).toBe(true)
  })

  it('« Annuler » remet l\'initiative d\'avant et ne commence rien', async () => {
    const cs = barbarian()
    const tracker = useCombatTracker(cs.id)
    tracker.initiative.value = { total: 9, natural: 7 }
    rollD20(18)
    await mount(SheetCombatStartWindow, { characterSheet: cs, open: true })

    await click('Annuler')
    await tick()

    expect(tracker.isActive.value).toBe(false)
    expect(tracker.initiative.value).toEqual({ total: 9, natural: 7 })
  })
})

describe('bandeau de combat', () => {
  const startCombat = (cs: { id: number }) => {
    const tracker = useCombatTracker(cs.id)
    tracker.start({ total: 17, natural: 15 })
    return tracker
  }
  const barValue = (group: string) => body().querySelector(`[role="group"][aria-label="${group}"] .combat__value`)!.textContent!.trim()

  it('affiche round et initiative ; « Nouveau tour » passe au round suivant et remet le tour à zéro', async () => {
    const cs = barbarian()
    const tracker = startCombat(cs)
    tracker.usedActions.value = { action: true, bonus_action: false, reaction: true }
    await mount(SheetCombatBar, { characterSheet: cs })

    expect(barValue('Round')).toBe('1')
    expect(barValue('Initiative')).toBe('17')

    await click('Plus 1,5 m')
    await click('Plus 1,5 m')
    expect(body().textContent).toContain('3 / 9 m')
    expect(body().querySelector('[role="meter"]')!.getAttribute('aria-valuenow')).toBe('3')

    await click('Nouveau tour')
    await tick()

    expect(barValue('Round')).toBe('2')
    expect(tracker.usedActions.value).toEqual({ action: false, bonus_action: false, reaction: false })
    expect(body().textContent).toContain('0 / 9 m')
    expect(body().querySelector('[role="status"]')).toBeNull()
  })

  it('le compte rendu détaille les durées décomptées, sans notification', async () => {
    const cs = barbarian()
    cs.temporaryEffects = [
      { id: 1, name: 'Bénédiction', active: true, effects: [], countdown: { rounds: 10, remaining: 3 } },
      { id: 2, name: 'Maléfice', active: true, effects: [], countdown: { rounds: 10, remaining: 1 } },
      { id: 3, name: 'Armure du mage', active: true, effects: [], durationLabel: '8 heures' },
    ]
    startCombat(cs)
    await mount(SheetCombatBar, { characterSheet: cs })

    await click('Nouveau tour')
    await tick()
    expect(body().querySelector('[role="status"]')!.textContent!.trim()).toBe('Bénédiction 3 → 2, Maléfice prend fin')
    expect(useToast().toasts.value).toEqual([])

    await click('Round suivant')
    await tick()
    expect(barValue('Round')).toBe('3')
    expect(body().querySelector('[role="status"]')!.textContent!.trim()).toBe('Bénédiction 2 → 1')
    expect(useToast().toasts.value).toEqual([])
  })

  it('le déplacement va jusqu\'au double de la vitesse (Foncer) et pas sous zéro', async () => {
    const cs = barbarian()
    const tracker = startCombat(cs)
    await mount(SheetCombatBar, { characterSheet: cs })

    await click('Moins 1,5 m')
    expect(tracker.movementUsed.value).toBe(0)
    for (let i = 0; i < 14; i++) await click('Plus 1,5 m')
    expect(tracker.movementUsed.value).toBe(18)
    expect(body().querySelector<HTMLElement>('[role="meter"] i')!.style.width).toBe('100%')
  })

  it('en rage, « Nouveau tour » demande si elle continue ; « Elle prend fin » y met fin', async () => {
    const cs = barbarian(true)
    startCombat(cs)
    await mount(SheetCombatBar, { characterSheet: cs })
    expect(body().querySelector('[role="alert"]')).toBeNull()

    await click('Nouveau tour')
    await tick()
    const alert = body().querySelector('[role="alert"]')!
    expect(alert.textContent).toContain('Rage toujours en cours ?')
    expect(alert.textContent).toContain('Attaque ou dégâts subis depuis ton tour précédent')

    await click('Elle prend fin')
    await flushPromises()
    await tick()

    expect(cs.features[0].active).toBe(false)
    expect(body().querySelector('[role="alert"]')).toBeNull()
    expect(body().querySelector('[role="status"]')!.textContent).toContain('Rage prend fin.')
  })

  it('« Elle continue » garde la rage', async () => {
    const cs = barbarian(true)
    startCombat(cs)
    await mount(SheetCombatBar, { characterSheet: cs })

    await click('Nouveau tour')
    await click('Elle continue')
    await tick()

    expect(cs.features[0].active).toBe(true)
    expect(body().querySelector('[role="alert"]')).toBeNull()
    expect(body().querySelector('[role="status"]')!.textContent).toContain('Rage continue.')
  })
})

describe('bloc « Ce tour »', () => {
  it('une case touchée marque l\'action dépensée', async () => {
    const cs = barbarian()
    const tracker = useCombatTracker(cs.id)
    await mount(SheetTurnBlock, { characterId: cs.id })

    const bonus = buttonOf('Action bonus disponible')!
    expect(bonus.getAttribute('aria-pressed')).toBe('false')
    bonus.click()
    await tick()

    expect(tracker.usedActions.value.bonus_action).toBe(true)
    expect(buttonOf('Action bonus dépensée')!.getAttribute('aria-pressed')).toBe('true')
    expect(buttonOf('Action disponible')).toBeDefined()
  })
})

describe('rail : bouton Combat', () => {
  it('ouvre la fenêtre de début ; en combat, « Fin du combat » y met fin', async () => {
    const cs = barbarian()
    const tracker = useCombatTracker(cs.id)
    rollD20(10)
    await mount(SheetRail, { characterSheet: cs })

    await click('Combat')
    await vi.waitFor(() => expect(dialog()?.textContent).toContain('Début du combat'))
    await click('Commencer le combat')
    await tick()
    expect(tracker.isActive.value).toBe(true)

    await click('Fin du combat')
    await tick()
    expect(tracker.isActive.value).toBe(false)
    expect(tracker.initiative.value).toBeNull()
    expect(buttonOf('Combat')).toBeDefined()
  })
})
