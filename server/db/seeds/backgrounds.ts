import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { upsertByName } from './lib/upsertByName'
import { backgroundsData } from './data/backgrounds'

export default async function seed() {
  return upsertByName(
    name => db.query.backgrounds.findFirst({ where: eq(schema.backgrounds.name, name) }),
    bg => db.insert(schema.backgrounds).values({
      name: bg.name,
      description: bg.description,
      skillProficiencies: bg.skillProficiencies,
      toolProficiencies: bg.toolProficiencies,
      languageProficiencies: bg.languageProficiencies,
      featureName: bg.featureName,
      featureDescription: bg.featureDescription,
      characterSheetId: null,
    }),
    backgroundsData,
  )
}
