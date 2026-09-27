import { db, schema } from 'hub:db'
import { eq, and, lte, notInArray } from 'drizzle-orm'
import { characterSheets } from './data/character_sheets'

export default async function seed() {
  for (const { classes, abilityScores, skills, className, subclassName, classLevel, ...sheetData } of characterSheets) {
    const existing = await db.query.characterSheets.findFirst({
      where: eq(schema.characterSheets.name, sheetData.name),
    })
    if (existing) continue

    const character = await db
      .insert(schema.characterSheets)
      .values(sheetData)
      .returning()
      .get()

    if (classes?.length) {
      await db.insert(schema.characterClasses).values(
        classes.map(cls => ({ ...cls, characterSheetId: character.id })),
      )
    }

    if (abilityScores?.length) {
      await db.insert(schema.characterAbilityScores).values(
        abilityScores.map(abs => ({ ...abs, characterSheetId: character.id })),
      )
    }

    if (skills?.length) {
      await db.insert(schema.characterSkills).values(
        skills.map(skill => ({ ...skill, characterSheetId: character.id })),
      )
    }

    if (className) {
      const cls = await db.query.classes.findFirst({
        where: eq(schema.classes.name, className),
      })

      if (cls) {
        const classFeatures = await db.query.features.findMany({
          where: and(
            eq(schema.features.classId, cls.id),
            lte(schema.features.levelRequired, classLevel ?? 20),
            // Les features porteuses des maîtrises (volet B) ne sont JAMAIS matérialisées : la fiche les
            // dérive de l'origine (sinon elles apparaîtraient comme des aptitudes vides sur les démos).
            notInArray(schema.features.featureType, ['proficiency_grant', 'multiclass_proficiency_grant']),
          ),
        })

        if (classFeatures.length) {
          await db.insert(schema.characterFeatures).values(
            classFeatures.map(f => ({ characterSheetId: character.id, featureId: f.id, currentUses: 0 })),
          ).onConflictDoNothing()
        }
      }
    }

    if (subclassName) {
      const subclass = await db.query.subclasses.findFirst({
        where: eq(schema.subclasses.name, subclassName),
      })

      if (subclass) {
        const subclassFeatures = await db.query.features.findMany({
          where: and(
            eq(schema.features.subclassId, subclass.id),
            lte(schema.features.levelRequired, classLevel ?? 20),
          ),
        })

        if (subclassFeatures.length) {
          await db.insert(schema.characterFeatures).values(
            subclassFeatures.map(f => ({ characterSheetId: character.id, featureId: f.id, currentUses: 0 })),
          ).onConflictDoNothing()
        }
      }
    }
  }
}
