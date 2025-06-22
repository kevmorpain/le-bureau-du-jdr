import { spells } from './data/spells'

export default async function seed() {
  spells.forEach(async (spell) => {
    await useDrizzle().insert(tables.spells).values(spell)
  })
}
