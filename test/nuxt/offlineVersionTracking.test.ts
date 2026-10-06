import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { registerEndpoint } from '@nuxt/test-utils/runtime'
import { setResponseHeader, type H3Event } from 'h3'
import { getBaseVersion, setBaseVersion } from '../../app/composables/useOfflineSync'
import { SHEET_VERSION_HEADER } from '../../shared/utils/sheetVersion'

const CHAR_ID = 4242
const OTHER_CHAR_ID = 9999
const sheetUrl = (id: number, sub = '') => `/api/character_sheets/${id}${sub}`

let serverVersion = 'T0'
let counter = 0

// Comme stampSheetVersion : l'écriture avance la version du serveur et l'annonce dans l'en-tête.
const write = (event: H3Event) => {
  serverVersion = `T${++counter}`
  setResponseHeader(event, SHEET_VERSION_HEADER, serverVersion)
  return { success: true }
}

registerEndpoint(sheetUrl(CHAR_ID), { method: 'GET', handler: () => ({ updatedAt: serverVersion }) })
for (const id of [CHAR_ID, OTHER_CHAR_ID]) {
  for (const sub of ['', '/spells', '/spell-slots', '/skills']) {
    registerEndpoint(sheetUrl(id, sub), { method: 'PUT', handler: write })
  }
}

function setOnline(value: boolean) {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(value)
  window.dispatchEvent(new Event(value ? 'online' : 'offline'))
}

beforeEach(() => {
  localStorage.clear()
  serverVersion = 'T0'
  counter = 0
  setOnline(true)
  setBaseVersion(CHAR_ID, 'T0')
  setBaseVersion(OTHER_CHAR_ID, 'T0')
  useOfflineSync().conflicts.value = []
})

afterEach(() => {
  vi.restoreAllMocks()
})

async function sendDirect() {
  const { offlineMutate } = useOfflineMutation(CHAR_ID)
  expect(await offlineMutate({ endpoint: sheetUrl(CHAR_ID), method: 'PUT', body: { notes: 'a' }, dedupeKey: 'sheet' })).toBe('sent')
}

async function queueOffline(endpoint = sheetUrl(CHAR_ID), dedupeKey?: string) {
  setOnline(false)
  const { offlineMutate } = useOfflineMutation(CHAR_ID)
  expect(await offlineMutate({ endpoint, method: 'PUT', body: { notes: 'ab' }, dedupeKey })).toBe('queued')
}

describe('version de référence de la synchro hors-ligne', () => {
  it('avance avec chaque envoi direct réussi', async () => {
    await sendDirect()
    expect(getBaseVersion(CHAR_ID)).toBe('T1')
  })

  it('avance aussi pour un $fetch direct, hors offlineMutate', async () => {
    await $fetch(sheetUrl(CHAR_ID, '/skills'), { method: 'PUT', body: [] })
    expect(getBaseVersion(CHAR_ID)).toBe('T1')
  })

  it('associe la version à la fiche de l\'URL, pas aux autres', async () => {
    await $fetch(sheetUrl(OTHER_CHAR_ID, '/skills'), { method: 'PUT', body: [] })
    expect(getBaseVersion(OTHER_CHAR_ID)).toBe('T1')
    expect(getBaseVersion(CHAR_ID)).toBe('T0')
  })

  it('ne bouge pas sur une réponse sans version (lecture)', async () => {
    serverVersion = 'T9'
    await $fetch(sheetUrl(CHAR_ID))
    expect(getBaseVersion(CHAR_ID)).toBe('T0')
  })

  it('une modif hors-ligne faite après un envoi direct ne déclenche pas de conflit au rejeu', async () => {
    const sync = useOfflineSync()
    await sendDirect()
    await queueOffline(sheetUrl(CHAR_ID), 'sheet')

    setOnline(true)
    await sync.flushAll()

    expect(sync.hasConflict.value).toBe(false)
    expect(sync.pendingCount.value).toBe(0)
  })

  it('avance avec chaque op rejouée', async () => {
    const sync = useOfflineSync()
    await queueOffline(sheetUrl(CHAR_ID, '/spells'))
    await queueOffline(sheetUrl(CHAR_ID, '/spell-slots'))

    setOnline(true)
    await sync.flushAll()

    expect(sync.pendingCount.value).toBe(0)
    expect(getBaseVersion(CHAR_ID)).toBe(serverVersion)
  })

  it('un changement venu d\'un autre appareil reste détecté comme un conflit', async () => {
    const sync = useOfflineSync()
    await sendDirect()
    serverVersion = 'ailleurs'
    await queueOffline(sheetUrl(CHAR_ID), 'sheet')

    setOnline(true)
    await sync.flushAll()

    expect(sync.hasConflict.value).toBe(true)
    expect(sync.pendingCount.value).toBe(1)
  })
})
