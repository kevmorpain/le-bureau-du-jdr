import { db, schema } from 'hub:db'
import { characterSpecies } from './data/character_species'

export default async function seed() {
  characterSpecies.forEach(async (species) => {
    await db.insert(schema.characterSpecies).values(species)
  })
}
