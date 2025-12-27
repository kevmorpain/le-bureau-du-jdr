import { db, schema } from 'hub:db'
import { spells } from './data/spells'

export default async function seed() {
  spells.forEach(async (spell) => {
    await db.insert(schema.spells).values(spell)
  })
}
