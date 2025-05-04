import magicSchools from './data/magic_schools.json'

export default async function seed() {
  await useDrizzle().insert(tables.magicSchools).values(magicSchools)
}
