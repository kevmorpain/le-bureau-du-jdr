import { db, schema } from 'hub:db'

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID parameter is required' })
  }

  return await db.query.characterFeatures.findMany({
    where: eq(schema.characterFeatures.characterSheetId, Number(id)),
    with: {
      feature: {
        with: {
          featureEffects: {
            with: { effect: true },
          },
        },
      },
    },
  })
})
