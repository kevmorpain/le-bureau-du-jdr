import { db } from 'hub:db'
import { migrateDragonbornLineage } from './lib/migrateDragonbornLineage'

// Wrapper de migration BESPOKE Drakéide (registre `run.ts`, exposé `?only=migrateDragonborn`) : câble
// le `db` de `hub:db` sur `migrateDragonbornLineage` (chantier lignée, D17 — lot 6). Migre les fiches
// Drakéide vivantes (colonne dragonbornAncestry → lignée « Dragon <couleur> »). À lancer APRÈS le seed
// de la structure (`?only=lineages`). Idempotent, rejouable. Échafaudage temporaire du rollout.
export default function migrate() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return migrateDragonbornLineage(db as any)
}
