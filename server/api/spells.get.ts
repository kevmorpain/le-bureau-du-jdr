export default defineEventHandler(async () => {
  return await useDrizzle().select().from(tables.spells).all()
})