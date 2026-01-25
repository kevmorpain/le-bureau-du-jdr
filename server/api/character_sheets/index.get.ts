import { db } from 'hub:db'

export default defineEventHandler(async () => {
  return await db
    .query
    .characterSheets
    .findMany({
      with: {
        species: true,
        classes: {
          with: { class: true },
        },
        baseAbilityScores: true,
      },
    })
})
