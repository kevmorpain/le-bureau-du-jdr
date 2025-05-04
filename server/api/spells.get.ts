export default defineEventHandler(async () => {
  return await useDrizzle()
    .query
    .spells
    .findMany({
      with: {
        school: true,
      },
    })
})
