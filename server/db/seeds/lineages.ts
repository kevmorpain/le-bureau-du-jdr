import { db } from '~~/server/utils/db'
import { seedLineages } from './lib/seedLineages'
import { LINEAGE_SPECIES } from './data/lineageSpecies'

// Séquentiel : limite de requêtes D1 et locks du parallélisme. Idempotent, additif.
export default async function seed() {
  const summary: Record<string, unknown> = {}
  for (const s of LINEAGE_SPECIES) {
    summary[s.name] = await seedLineages(db, s)
  }
  return summary
}
