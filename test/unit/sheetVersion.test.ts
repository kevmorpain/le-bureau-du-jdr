import { IncomingMessage, ServerResponse } from 'node:http'
import { Socket } from 'node:net'
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { createEvent } from 'h3'
import { describe, expect, it, vi } from 'vitest'
import { SHEET_VERSION_HEADER } from '../../shared/utils/sheetVersion'

const written: Array<Record<string, unknown>> = []

vi.mock('~~/server/utils/db', () => ({
  db: {
    update: () => ({
      set: (values: Record<string, unknown>) => {
        written.push(values)
        return { where: async () => undefined }
      },
    }),
  },
  schema: { characterSheets: { id: 'id' } },
}))

const { stampSheetVersion, touchCharacterSheet } = await import('../../server/utils/touchCharacter')

const newEvent = () => createEvent(new IncomingMessage(new Socket()), new ServerResponse(new IncomingMessage(new Socket())))

describe('stampSheetVersion', () => {
  it('annonce dans la réponse la valeur qu\'il renvoie pour updated_at', () => {
    const event = newEvent()
    const version = stampSheetVersion(event)
    expect(event.node.res.getHeader(SHEET_VERSION_HEADER)).toBe(version)
    expect(new Date(version).toISOString()).toBe(version)
  })
})

describe('touchCharacterSheet', () => {
  it('écrit en base la version qu\'il annonce dans la réponse', async () => {
    written.length = 0
    const event = newEvent()
    await touchCharacterSheet(event, 7)
    expect(written).toHaveLength(1)
    expect(written[0]!.updatedAt).toBe(event.node.res.getHeader(SHEET_VERSION_HEADER))
  })

  it('ne touche rien (ni base ni en-tête) pour un identifiant invalide', async () => {
    written.length = 0
    const event = newEvent()
    await touchCharacterSheet(event, Number.NaN)
    expect(written).toHaveLength(0)
    expect(event.node.res.getHeader(SHEET_VERSION_HEADER)).toBeUndefined()
  })
})

// Une écriture d'updated_at qui contourne l'utilitaire laisse le client avec une base périmée : le
// rejeu hors-ligne y verrait un conflit que personne n'a provoqué.
describe('contrat — toute écriture d\'updated_at annonce sa version', () => {
  async function sourceFiles(dir: string): Promise<string[]> {
    const entries = await readdir(dir, { withFileTypes: true })
    const nested = await Promise.all(entries.map(async (e) => {
      const path = join(dir, e.name)
      return e.isDirectory() ? sourceFiles(path) : path.endsWith('.ts') ? [path] : []
    }))
    return nested.flat()
  }

  const relative = (file: string) => file.slice(process.cwd().length + 1).replaceAll('\\', '/')

  it('rien dans server/api ni server/utils ne pose updatedAt sans passer par stampSheetVersion', async () => {
    const offenders: string[] = []
    for (const dir of ['api', 'utils']) {
      for (const file of await sourceFiles(join(process.cwd(), 'server', dir))) {
        const source = await readFile(file, 'utf8')
        if (/updatedAt\s*:(?!\s*stampSheetVersion\(event\))/.test(source)) offenders.push(relative(file))
      }
    }
    expect(offenders).toEqual([])
  })

  // La suppression de la fiche est la seule écriture qui n'a plus de version à annoncer.
  const EXEMPT_HANDLERS = ['server/api/character_sheets/[id]/index.delete.ts']

  it('chaque handler d\'écriture de la fiche annonce sa version', async () => {
    const offenders: string[] = []
    for (const file of await sourceFiles(join(process.cwd(), 'server', 'api', 'character_sheets', '[id]'))) {
      const path = relative(file)
      if (!/\.(put|post|delete)\.ts$/.test(path) || EXEMPT_HANDLERS.includes(path)) continue
      const source = await readFile(file, 'utf8')
      if (!/touchCharacterSheet\(event\b|stampSheetVersion\(event\)/.test(source)) offenders.push(path)
    }
    expect(offenders).toEqual([])
  })

  it('chaque appel à touchCharacterSheet passe l\'événement de la requête', async () => {
    const offenders: string[] = []
    for (const file of await sourceFiles(join(process.cwd(), 'server', 'api'))) {
      const source = await readFile(file, 'utf8')
      if (/touchCharacterSheet\((?!event\b)/.test(source)) offenders.push(file)
    }
    expect(offenders).toEqual([])
  })
})
