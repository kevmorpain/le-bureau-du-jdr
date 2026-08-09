import { db } from 'hub:db'
import { seedLineages } from './lib/seedLineages'
import { LINEAGE_SPECIES } from './data/lineageSpecies'

/**
 * Wrapper de seed GÉNÉRIQUE base+lignées (registre `run.ts`, exposé `?only=lineages`). Câble le
 * `db` de `hub:db` sur `seedLineages` pour CHAQUE espèce du registre `LINEAGE_SPECIES` (chantier
 * lignée, D17). Séquentiel (limite de requêtes D1 + éviter les locks du parallélisme). Idempotent,
 * additif. Remplace l'ancien `?only=elfLineage` (conservé en compat pour l'elfe seul).
 */
export default async function seed() {
  const summary: Record<string, unknown> = {}
  for (const s of LINEAGE_SPECIES) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    summary[s.name] = await seedLineages(db as any, s)
  }
  return summary
}
