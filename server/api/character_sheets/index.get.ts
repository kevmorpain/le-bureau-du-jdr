import { db } from 'hub:db'

export default defineEventHandler(async () => {
  return await db
    .query
    .characterSheets
    .findMany({
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
