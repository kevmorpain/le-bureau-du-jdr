import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { readBody } from 'h3'
import SheetConflictWindow from '../../app/components/sheet/SheetConflictWindow.vue'
import { useOfflineSync } from '../../app/composables/useOfflineSync'
import { readQueue, writeQueue, writeSnapshot } from '../../app/utils/offlineQueue'

const SHEET_ID = 9408
const URL = `/api/character_sheets/${SHEET_ID}`

const base = { id: SHEET_ID, name: 'Ambroise', updatedAt: 'v1', currentHp: 30, notes: 'Session 1', po: 10, exhaustionLevel: 0, spellSlots: [{ used: 1 }] }
let server: Record<string, unknown>
const sheetPuts: Record<string, unknown>[] = []
const slotPuts: unknown[] = []

registerEndpoint(URL, () => server)
registerEndpoint(URL, {
  method: 'PUT',
  handler: async (event) => {
    sheetPuts.push(await readBody(event))
    return { ok: true }
  },
})
registerEndpoint(`${URL}/spell-slots`, {
  method: 'PUT',
  handler: async (event) => {
    slotPuts.push(await readBody(event))
    return { ok: true }
  },
})

const queueSheet = (local: Record<string, unknown>, { withSlots = false } = {}) => {
  writeSnapshot(SHEET_ID, base, 'base')
  writeSnapshot(SHEET_ID, local)
  writeQueue(SHEET_ID, [
    { id: 'a', ts: Date.UTC(2026, 10, 26, 12), characterId: SHEET_ID, endpoint: URL, method: 'PUT', body: local, dedupeKey: 'sheet', baseVersion: 'v1' },
    ...(withSlots
      ? [{ id: 'b', ts: 2, characterId: SHEET_ID, endpoint: `${URL}/spell-slots`, method: 'PUT' as const, body: [{ slotType: 'spellcasting', slotLevel: 1, used: 3 }], dedupeKey: 'spell-slots', baseVersion: 'v1' }]
      : []),
  ])
  if (withSlots) writeSnapshot(SHEET_ID, { spellcasting: { 1: { current: 1, max: 4 } } }, 'slots')
}

const mounted: { unmount: () => void }[] = []

beforeEach(() => {
  localStorage.clear()
  sheetPuts.length = 0
  slotPuts.length = 0
  useOfflineSync().conflicts.value = []
})

afterEach(() => {
  mounted.splice(0).forEach(wrapper => wrapper.unmount())
})

const mountWindow = async () => {
  const resolved = vi.fn()
  const wrapper = await mountSuspended(SheetConflictWindow, { props: { characterSheetId: SHEET_ID, onResolved: resolved } })
  mounted.push(wrapper)
  useOfflineSync().conflicts.value = [SHEET_ID]
  await flushPromises()
  return { wrapper, resolved }
}

const dialog = () => document.body.querySelector('[role="dialog"]')
const rowLabels = () => Array.from(dialog()?.querySelectorAll('tbody th') ?? []).map(cell => cell.textContent?.trim())
const pick = (row: string, side: 'Cet appareil' | 'Serveur') =>
  dialog()!.querySelector<HTMLButtonElement>(`[aria-label="${row} : ${side}"]`)!.click()
const clickFooter = (label: string) =>
  Array.from(dialog()!.querySelectorAll<HTMLButtonElement>('button')).find(button => button.textContent?.trim() === label)!.click()

describe('nouvelle fiche — conflit de synchronisation', () => {
  it('ne liste que les champs modifiés des deux côtés, puis envoie la fiche fusionnée selon les choix', async () => {
    server = { ...base, updatedAt: '2026-11-27T12:00:00.000Z', currentHp: 25, notes: 'Session 2 (là-bas)', exhaustionLevel: 1 }
    queueSheet({ ...base, currentHp: 22, notes: 'Session 2 (ici)', po: 15 })
    const { resolved } = await mountWindow()

    await vi.waitFor(() => expect(rowLabels()).toEqual(['Points de vie', 'Notes']))
    expect(dialog()!.textContent).toContain('Session 2 (ici)')
    expect(dialog()!.textContent).toContain('Session 2 (là-bas)')
    // Noon UTC stays on the same calendar day in any time zone.
    expect(dialog()!.textContent).toContain('modifiée le 26 nov.')
    expect(dialog()!.textContent).toContain('enregistrée le 27 nov.')

    pick('Points de vie', 'Serveur')
    await flushPromises()
    clickFooter('Garder cette version')

    await vi.waitFor(() => expect(sheetPuts).toHaveLength(1))
    expect(sheetPuts[0]).toMatchObject({ currentHp: 25, notes: 'Session 2 (ici)', po: 15, exhaustionLevel: 1 })
    expect(readQueue(SHEET_ID)).toEqual([])
    await vi.waitFor(() => expect(resolved).toHaveBeenCalled())
    expect(useOfflineSync().conflicts.value).toEqual([])
  })

  it('les ressources en attente se gardent ou s\'abandonnent par groupe', async () => {
    server = { ...base, updatedAt: 'v2', currentHp: 25 }
    queueSheet({ ...base, currentHp: 22 }, { withSlots: true })
    await mountWindow()

    await vi.waitFor(() => expect(rowLabels()).toEqual(['Points de vie', 'Emplacements de sorts']))
    expect(dialog()!.textContent).toContain('3 dépensé(s)')
    expect(dialog()!.textContent).toContain('1 dépensé(s)')

    clickFooter('Tout le serveur')
    await flushPromises()
    clickFooter('Garder cette version')

    await vi.waitFor(() => expect(sheetPuts).toHaveLength(1))
    expect(sheetPuts[0]).toMatchObject({ currentHp: 25 })
    expect(slotPuts).toEqual([])
  })

  it('rien de modifié des deux côtés : la fusion part toute seule, sans fenêtre', async () => {
    server = { ...base, updatedAt: 'v2', exhaustionLevel: 1 }
    queueSheet({ ...base, po: 15 })
    const { resolved } = await mountWindow()

    await vi.waitFor(() => expect(sheetPuts).toHaveLength(1))
    expect(sheetPuts[0]).toMatchObject({ po: 15, exhaustionLevel: 1 })
    expect(dialog()).toBeNull()
    expect(resolved).toHaveBeenCalled()
  })
})
