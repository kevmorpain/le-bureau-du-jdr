import { db } from 'hub:db'

export default defineEventHandler(async () => {
  return await db
    .query
    .characterSheets
    .findMany({
      with: {
        species: {
          with: {
            speciesTraits: {
              with: {
                trait: {
                  with: {
                    traitEffects: {
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
