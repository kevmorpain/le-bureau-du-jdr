import { db } from 'hub:db'
import { seedElfLineages } from './lib/seedElfLineages'

// Wrapper de seed (registre `run.ts`) : câble le `db` de `hub:db` sur la logique injectable
// et testable `seedElfLineages` (cf. lib/seedElfLineages.ts).
export default function seed() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return seedElfLineages(db as any)
}
