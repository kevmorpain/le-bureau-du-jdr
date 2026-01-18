import { db, schema } from 'hub:db'

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID parameter is required' })
  }

  return await db
    .query
    .characterSheets
    .findFirst({
      where: eq(schema.characterSheets.id, Number(id)),
      with: {
        species: true,
        classes: {
          with: {
            class: true,
          },
        },
      },
    })
})
