import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { eq } from 'drizzle-orm'
import * as schema from '../../server/db/schema'
import { seedBackgroundProficiencies } from '../../server/db/seeds/lib/seedBackgroundProficiencies'
import { deriveBackgroundProficiencies } from '../../server/utils/backgroundProficiencyDerivation'
import { backgroundsData } from '../../server/db/seeds/data/backgrounds'
import { backgroundChoices, fixedProficiencies } from '../../shared/rules/backgroundProficiencies'
import { replayMigrations } from '../fixtures/migrations'

// Seed des porteurs de maîtrises d'historique + dérivation, bout en bout : la fiche doit dériver
// exactement les maîtrises FIXES — compétences, outils, langues (== ce que createCharacter matérialisait).

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let orm: any
const bgIdByName = new Map<string, number>()

const fixedCount = (b: typeof backgroundsData[number]) =>
  fixedProficiencies(b.skillProficiencies).length
  + fixedProficiencies(b.toolProficiencies).length
  + fixedProficiencies(b.languageProficiencies).length

/** Historiques ayant ≥1 maîtrise fixe (compétences/outils/langues) → doivent avoir un porteur. */
const withFixed = backgroundsData.filter(b => fixedCount(b) > 0)

beforeAll(async () => {
  const client = createClient({ url: ':memory:' })
  await client.execute('PRAGMA foreign_keys = ON')
  await replayMigrations(client)
  orm = drizzle(client, { schema, casing: 'snake_case' })

  // Les historiques doivent exister avant le seed des porteurs (comme en prod).
  for (const bg of backgroundsData) {
    const row = await orm.insert(schema.backgrounds).values({
      name: bg.name,
      description: bg.description,
      skillProficiencies: bg.skillProficiencies,
      toolProficiencies: bg.toolProficiencies,
      languageProficiencies: bg.languageProficiencies,
      featureName: bg.featureName,
      featureDescription: bg.featureDescription,
      characterSheetId: null,
    }).returning().get()
    bgIdByName.set(bg.name, row.id)
  }
})

describe('seedBackgroundProficiencies — structure', () => {
  it('crée un porteur pour chaque historique à maîtrise fixe, et aucun sinon', async () => {
    const report = await seedBackgroundProficiencies(orm, backgroundsData)
    expect(report.carriersInserted).toBe(withFixed.length)
    // 1 effet lié par entrée fixe (compétences + outils + langues) sur l'ensemble des historiques.
    // NB : `effectsLinked` compte les LIENS ; un effet partagé (ex. 2 historiques donnant « insight »)
    // réutilise la même ligne `effects` mais crée bien un lien par porteur.
    const expectedEffects = backgroundsData.reduce((n, b) => n + fixedCount(b), 0)
    expect(report.effectsLinked).toBe(expectedEffects)
    // Les entrées « au choix » deviennent des points de choix sur le même porteur.
    expect(report.choicesInserted).toBe(backgroundsData.reduce((n, b) => n + backgroundChoices(b).length, 0))
  })

  it('le porteur est une feature proficiency_grant (jamais matérialisée ni affichée)', async () => {
    const carriers = await orm.select({ type: schema.features.featureType })
      .from(schema.features)
      .innerJoin(schema.backgroundFeatures, eq(schema.backgroundFeatures.featureId, schema.features.id))
    expect(carriers.length).toBe(withFixed.length)
    expect(carriers.every((c: { type: string }) => c.type === 'proficiency_grant')).toBe(true)
  })
})

describe('deriveBackgroundProficiencies — équivalence dérivé == fixe', () => {
  for (const bg of backgroundsData) {
    it(`${bg.name} : dérive exactement ses maîtrises fixes`, async () => {
      const effects = await deriveBackgroundProficiencies(orm, bgIdByName.get(bg.name)!)
      const derivedSkills = effects.filter(e => e.type === 'skill_proficiency').map(e => (e.value as { skill: string }).skill).sort()
      const derivedTools = effects.filter(e => e.type === 'tool_proficiency').map(e => e.value).sort()
      const derivedLangs = effects.filter(e => e.type === 'language_proficiency').map(e => e.value).sort()
      expect(derivedSkills).toEqual([...fixedProficiencies(bg.skillProficiencies)].sort())
      expect(derivedTools).toEqual([...fixedProficiencies(bg.toolProficiencies)].sort())
      expect(derivedLangs).toEqual([...fixedProficiencies(bg.languageProficiencies)].sort())
    })
  }

  it('rend [] pour un historique sans porteur (backgroundId inconnu)', async () => {
    expect(await deriveBackgroundProficiencies(orm, 999999)).toEqual([])
  })

  it('rend [] pour backgroundId null (historique custom / absent)', async () => {
    expect(await deriveBackgroundProficiencies(orm, null)).toEqual([])
  })
})

describe('seedBackgroundProficiencies — idempotence', () => {
  it('un second passage ne crée ni porteur ni lien, et la dérivation est inchangée', async () => {
    const report = await seedBackgroundProficiencies(orm, backgroundsData)
    expect(report).toEqual({ carriersInserted: 0, effectsLinked: 0, choicesInserted: 0 })

    // Exemple : Marin garde ses 2 outils fixes après re-seed.
    const marin = await deriveBackgroundProficiencies(orm, bgIdByName.get('Marin')!)
    expect(marin.filter(e => e.type === 'tool_proficiency').map(e => e.value).sort())
      .toEqual(['Outils de navigateur', 'Véhicules aquatiques'])
  })
})
