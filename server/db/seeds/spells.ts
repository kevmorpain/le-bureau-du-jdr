import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { upsertByName } from './lib/upsertByName'
import { spells } from './data/spells'

export default async function seed() {
  return upsertByName(
    name => db.query.spells.findFirst({ where: eq(schema.spells.name, name) }),
    spell => db.insert(schema.spells).values(spell),
    spells,
  )
}
