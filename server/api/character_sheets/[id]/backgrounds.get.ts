import { eq } from 'drizzle-orm'
import { db, schema } from '~~/server/utils/db'
import { loadBackgrounds } from '~~/server/utils/catalogSources'
import { isExtendedRequested } from '~~/server/utils/catalogRequest'

// Historiques globaux + homebrew de la fiche : non cachable, contrairement à `/api/catalog/backgrounds`.
export default defineEventHandler(async (event) => {
  const id = Number(getRouterParams(event).id)
  const sheet = await db.select({ ruleset: schema.characterSheets.ruleset }).from(schema.characterSheets).where(eq(schema.characterSheets.id, id)).get()
  if (!sheet) throw createError({ statusCode: 404, statusMessage: 'Character sheet not found' })
  return await loadBackgrounds(db, id, sheet.ruleset, isExtendedRequested(event))
})
