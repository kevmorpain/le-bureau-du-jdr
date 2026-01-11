import { db, schema } from 'hub:db'
import { characterSheets } from './data/character_sheets'

export default async function seed() {
  characterSheets.forEach(async (sheets) => {
    await db.insert(schema.characterSheets).values(sheets)
  })
}
