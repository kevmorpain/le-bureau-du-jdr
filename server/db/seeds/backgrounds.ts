import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { backgroundsData } from './data/backgrounds'

export default async function seed() {
  let inserted = 0
  let skipped = 0

  for (const bg of backgroundsData) {
    const existing = await db.query.backgrounds.findFirst({
      where: eq(schema.backgrounds.name, bg.name),
    })

    if (existing) {
      skipped++
      continue
    }

    await db.insert(schema.backgrounds).values({
      name: bg.name,
      description: bg.description,
      skillProficiencies: bg.skillProficiencies,
      toolProficiencies: bg.toolProficiencies,
      languageProficiencies: bg.languageProficiencies,
      featureName: bg.featureName,
      featureDescription: bg.featureDescription,
      characterSheetId: null,
    })
    inserted++
  }

  return { inserted, skipped }
}
