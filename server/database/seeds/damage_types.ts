import damageTypes from './data/damage_types.json'

export default async function seed() {
  await useDrizzle().insert(tables.damageTypes).values(damageTypes)
}
