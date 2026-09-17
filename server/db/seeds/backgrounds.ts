import { db, schema } from 'hub:db'
import { and, eq } from 'drizzle-orm'
import { upsertByName } from './lib/upsertByName'
import { rulesetOf } from './lib/rulesetOf'
import { seedBackgroundProficiencies } from './lib/seedBackgroundProficiencies'
import { backgroundsData } from './data/backgrounds'

export default async function seed() {
  // Keyé par (name, ruleset) : un homonyme 5.5 est une ligne DISTINCTE, pas une mise à jour (D2).
  const report = await upsertByName(
    (name, ruleset) => db.query.backgrounds.findFirst({
      where: and(eq(schema.backgrounds.name, name), eq(schema.backgrounds.ruleset, ruleset)),
    }),
    bg => db.insert(schema.backgrounds).values({
      name: bg.name,
      ruleset: rulesetOf(bg),
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const proficiencies = await seedBackgroundProficiencies(db as any, backgroundsData)

  return { ...report, proficiencies }
}
