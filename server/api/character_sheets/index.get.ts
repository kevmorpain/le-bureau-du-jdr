import { db } from 'hub:db'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  return await db
    .query
    .characterSheets
    .findMany({
      where: (sheets, { eq }) => eq(sheets.ownerId, user.id),
      with: {
        species: {
          with: {
            speciesFeatures: {
              with: {
                feature: {
                  with: {
                    featureEffects: {
                      with: {
                        effect: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        classes: {
          with: { class: true },
        },
        baseAbilityScores: true,
      },
    })
})
