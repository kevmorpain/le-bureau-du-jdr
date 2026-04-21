import { db, schema } from 'hub:db'
import { like, eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const type = query.type as string | undefined
  const search = query.search as string | undefined

  const conditions = []

  if (type) {
    conditions.push(eq(schema.items.itemType, type as 'weapon' | 'armor' | 'equipment' | 'tool'))
  }

  if (search) {
    conditions.push(like(schema.items.name, `%${search}%`))
  }

  return await db.query.items.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: (items, { asc }) => [asc(items.itemType), asc(items.name)],
  })
})
