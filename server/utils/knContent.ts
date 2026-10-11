import { eq } from 'drizzle-orm'
import * as schema from '~~/server/db/schema'
import type { Db } from '~~/server/utils/db'
import {
  KN_CONTENT_MAX_BYTES,
  KN_CONTENT_NAME_RE,
  KN_CONTENT_SCHEMAS,
  type KnContentRegistry,
} from '~~/shared/ker-nethalas/content'

const { knContent } = schema

// `hasOwn` : un nom comme `constructor` passe la regex et trouverait sinon une propriété du prototype du registre.
const schemaFor = (registry: KnContentRegistry, name: string) =>
  KN_CONTENT_NAME_RE.test(name) && Object.hasOwn(registry, name) ? registry[name] : undefined

export type SaveKnContentResult
  = | { status: 'saved', name: string, updatedAt: string }
    | { status: 'unknown' }
    | { status: 'tooLarge', bytes: number }
    | { status: 'invalid', issues: { path: string, message: string }[] }

export async function saveKnContent(
  db: Db,
  name: string,
  payload: unknown,
  registry: KnContentRegistry = KN_CONTENT_SCHEMAS,
): Promise<SaveKnContentResult> {
  const contentSchema = schemaFor(registry, name)
  if (!contentSchema) return { status: 'unknown' }

  const bytes = new TextEncoder().encode(JSON.stringify(payload) ?? '').length
  if (bytes > KN_CONTENT_MAX_BYTES) return { status: 'tooLarge', bytes }

  const parsed = contentSchema.safeParse(payload)
  if (!parsed.success) {
    return {
      status: 'invalid',
      issues: parsed.error.issues.slice(0, 20).map(issue => ({ path: issue.path.join('.'), message: issue.message })),
    }
  }

  const updatedAt = new Date().toISOString()
  await db
    .insert(knContent)
    .values({ name, data: parsed.data, updatedAt })
    .onConflictDoUpdate({ target: knContent.name, set: { data: parsed.data, updatedAt } })

  return { status: 'saved', name, updatedAt }
}

// Un jeu de données qui ne respecte plus son schéma (schéma modifié depuis le chargement) est absent pour
// l'application, et signalé `valid: false` par `listKnContent`, plutôt que servi tel quel à l'interface.
export async function getKnContent(db: Db, name: string, registry: KnContentRegistry = KN_CONTENT_SCHEMAS): Promise<unknown | null> {
  const contentSchema = schemaFor(registry, name)
  if (!contentSchema) return null

  const [row] = await db.select().from(knContent).where(eq(knContent.name, name)).limit(1)
  if (!row) return null

  const parsed = contentSchema.safeParse(row.data)
  return parsed.success ? parsed.data : null
}

export interface KnContentStatus {
  name: string
  loaded: boolean
  valid: boolean
  updatedAt: string | null
}

export async function listKnContent(db: Db, registry: KnContentRegistry = KN_CONTENT_SCHEMAS): Promise<KnContentStatus[]> {
  const rows = await db.select().from(knContent)
  const byName = new Map(rows.map(row => [row.name, row]))

  return Object.entries(registry).map(([name, contentSchema]) => {
    const row = byName.get(name)
    return {
      name,
      loaded: !!row,
      valid: !!row && contentSchema.safeParse(row.data).success,
      updatedAt: row?.updatedAt ?? null,
    }
  })
}
