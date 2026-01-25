import { db, schema } from 'hub:db'
import { characterSheets } from './data/character_sheets'
import { characterClasses } from './data/character_classes'
import { characterAbilityScores } from './data/character_ability_scores'

export default async function seed() {
  characterSheets.forEach(async (sheets) => {
    const [character] = await db.insert(schema.characterSheets).values(sheets).returning()

    if (character) {
      const classesToInsert = characterClasses
        .filter(cls => cls.characterSheetId === character.id)

      await db.insert(schema.characterClasses).values(classesToInsert)

      const abilityScoresToInsert = characterAbilityScores.filter(abs => abs.characterSheetId === character.id)

      await db.insert(schema.characterAbilityScores).values(abilityScoresToInsert)
    }
  })
}
