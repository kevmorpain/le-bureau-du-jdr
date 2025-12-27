import { db } from 'hub:db'

export default defineEventHandler(async () => {
  return await db
    .query
    .spells
    .findMany({
      with: {
        school: true,
      },
    })
})
