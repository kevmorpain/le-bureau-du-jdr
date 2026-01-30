import { db } from 'hub:db'

export default defineEventHandler(async () => {
  return await db.query.characterSpecies.findMany({
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
  })
})
