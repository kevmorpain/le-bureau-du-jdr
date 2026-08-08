import { db } from 'hub:db'
import { migrateLineageSheets } from './lib/migrateLineageSheets'

// Wrapper de migration (registre `run.ts`, exposé en `?only=migrateLineages`) : câble le `db` de
// `hub:db` sur la logique injectable et testable `migrateLineageSheets` (chantier lignée, lot 4).
// Migre les fiches VIVANTES des anciennes espèces séparées (Haut-elfe…) vers base + lignée. À
// lancer APRÈS le seed de la structure (`?only=elfLineage`). Idempotent, rejouable. Échafaudage
// temporaire du rollout lignée (lots 4→6) — à retirer une fois toutes les espèces basculées.
export default function migrate() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return migrateLineageSheets(db as any)
}
