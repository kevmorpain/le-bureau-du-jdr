import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { upsertByName } from './lib/upsertByName'
import { seedBackgroundProficiencies } from './lib/seedBackgroundProficiencies'
import { backgroundsData } from './data/backgrounds'

export default async function seed() {
  const report = await upsertByName(
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

  // Volet B, étape 2 : porteurs de maîtrises d'outils/langues FIXES sur background_features
  // (dérivables par la fiche). S'exécute APRÈS l'upsert (les historiques doivent exister).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const proficiencies = await seedBackgroundProficiencies(db as any, backgroundsData)

  return { ...report, proficiencies }
}
