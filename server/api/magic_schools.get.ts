import magicSchools from '../database/schema/magic_schools'

export default defineEventHandler(async () => {
  return await useDrizzle()
    .select()
    .from(magicSchools)
})
