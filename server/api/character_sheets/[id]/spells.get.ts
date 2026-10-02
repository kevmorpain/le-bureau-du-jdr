import { db, schema } from '~~/server/utils/db'
import { loadAlwaysPreparedSpells } from '~~/server/utils/alwaysPreparedSpells'

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID parameter is required' })
  }

  const sheet = await db.query.characterSheets.findFirst({
    where: eq(schema.characterSheets.id, Number(id)),
    columns: { id: true },
  })
  if (!sheet) throw createError({ statusCode: 404, statusMessage: 'Character sheet not found' })

  const stored = await db
    .query
    .characterSpells
    .findMany({
      where: eq(schema.characterSpells.characterSheetId, Number(id)),
      with: { spell: { with: { school: true } } },
    })
  const rows = stored.map(row => ({ ...row, alwaysPrepared: false }))

  // Un sort de domaine ajouté aussi à la main n'apparaît qu'une fois, marqué toujours préparé.
  const byId = new Map(rows.map(row => [row.spellId, row]))
  for (const granted of await loadAlwaysPreparedSpells(db, Number(id))) {
    const existing = byId.get(granted.spellId)
    if (existing) Object.assign(existing, { alwaysPrepared: true, isPrepared: true })
    else rows.push(granted)
  }
  return rows
})
