import { db } from 'hub:db'
import * as schema from '~~/server/db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { name } = getRouterParams(event)
  if (!name) throw createError({ statusCode: 400, statusMessage: 'Class name required' })

  const decodedName = decodeURIComponent(name)

  const [cls] = await db
    .select({ id: schema.classes.id })
    .from(schema.classes)
    .where(eq(schema.classes.name, decodedName))
    .limit(1)

  if (!cls) return []

  const subs = await db
    .select({
      id: schema.subclasses.id,
      name: schema.subclasses.name,
      description: schema.subclasses.description,
    })
    .from(schema.subclasses)
    .where(eq(schema.subclasses.classId, cls.id))

  return subs
})
