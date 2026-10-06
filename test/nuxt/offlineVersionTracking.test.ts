import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getBaseVersion, setBaseVersion } from '../../app/composables/useOfflineSync'
import { SHEET_VERSION_HEADER } from '../../shared/utils/sheetVersion'

const CHAR_ID = 4242
const SHEET_URL = `/api/character_sheets/${CHAR_ID}`

let serverVersion = 'T0'
let counter = 0

type FetchOptions = { method?: string, onResponse?: (ctx: { response: { headers: Headers } }) => void }

// Même contrat qu'ofetch : l'écriture avance la version du serveur et l'annonce dans l'en-tête.
function stubServer() {
  vi.stubGlobal('$fetch', vi.fn(async (_url: string, opts?: FetchOptions) => {
    if (!opts?.method || opts.method === 'GET') return { updatedAt: serverVersion }
    serverVersion = `T${++counter}`
    opts.onResponse?.({ response: { headers: new Headers({ [SHEET_VERSION_HEADER]: serverVersion }) } })
    return [{ updatedAt: serverVersion }]
  }))
}

function setOnline(value: boolean) {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(value)
  window.dispatchEvent(new Event(value ? 'online' : 'offline'))
}

beforeEach(() => {
  localStorage.clear()
  serverVersion = 'T0'
  counter = 0
  stubServer()
  setOnline(true)
  setBaseVersion(CHAR_ID, 'T0')
  useOfflineSync().conflicts.value = []
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

async function sendDirect() {
  const { offlineMutate } = useOfflineMutation(CHAR_ID)
  expect(await offlineMutate({ endpoint: SHEET_URL, method: 'PUT', body: { notes: 'a' }, dedupeKey: 'sheet' })).toBe('sent')
}

async function queueOffline(endpoint = SHEET_URL, dedupeKey?: string) {
  setOnline(false)
  const { offlineMutate } = useOfflineMutation(CHAR_ID)
  expect(await offlineMutate({ endpoint, method: 'PUT', body: { notes: 'ab' }, dedupeKey })).toBe('queued')
}

describe('version de référence de la synchro hors-ligne', () => {
  it('avance avec chaque envoi direct réussi', async () => {
    await sendDirect()
    expect(getBaseVersion(CHAR_ID)).toBe('T1')
  })

  it('une modif hors-ligne faite après un envoi direct ne déclenche pas de conflit au rejeu', async () => {
    const sync = useOfflineSync()
    await sendDirect()
    await queueOffline(SHEET_URL, 'sheet')

    setOnline(true)
    await sync.flushAll()

    expect(sync.hasConflict.value).toBe(false)
    expect(sync.pendingCount.value).toBe(0)
  })

  it('avance avec chaque op rejouée', async () => {
    const sync = useOfflineSync()
    await queueOffline(`${SHEET_URL}/spells`)
    await queueOffline(`${SHEET_URL}/spell-slots`)

    setOnline(true)
    await sync.flushAll()

    expect(sync.pendingCount.value).toBe(0)
    expect(getBaseVersion(CHAR_ID)).toBe(serverVersion)
  })

  it('un changement venu d\'un autre appareil reste détecté comme un conflit', async () => {
    const sync = useOfflineSync()
    await sendDirect()
    serverVersion = 'ailleurs'
    await queueOffline(SHEET_URL, 'sheet')

    setOnline(true)
    await sync.flushAll()

    expect(sync.hasConflict.value).toBe(true)
    expect(sync.pendingCount.value).toBe(1)
  })
})
