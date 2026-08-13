import { db, schema } from 'hub:db'
import { and, eq } from 'drizzle-orm'
import { upsertByName } from './lib/upsertByName'
import { rulesetOf } from './lib/rulesetOf'
import { seedBackgroundProficiencies } from './lib/seedBackgroundProficiencies'
import { backgroundsData } from './data/backgrounds'

export default async function seed() {
  // Keyé par (name, ruleset) : un historique 5.5 homonyme (« Sage », « Soldat ») est une ligne
  // DISTINCTE, pas un skip de la 2014 (D2). No-op sur le 2014 (tout est '5').
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

  // Volet B, étape 2 : porteurs de maîtrises d'outils/langues FIXES sur background_features
  // (dérivables par la fiche). S'exécute APRÈS l'upsert (les historiques doivent exister).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const proficiencies = await seedBackgroundProficiencies(db as any, backgroundsData)

  return { ...report, proficiencies }
}
