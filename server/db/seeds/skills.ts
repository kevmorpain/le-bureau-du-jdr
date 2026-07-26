import { db } from 'hub:db'
// Table neuve → schéma importé de la source (le cache de `hub:db` peut être périmé au
// démarrage, cf. CLAUDE.md « hub:db schema cache »).
import * as srcSchema from '~~/server/db/schema'
import { SKILLS } from '~~/shared/rules/skills'

// Seede la table de référence `skills` depuis la const canonique (cf. decisions.md D6/D7).
// Idempotent (onConflictDoNothing sur la PK `id`).
export default async function seed() {
  const rows = Object.entries(SKILLS).map(([id, def]) => ({ id, ability: def.ability }))
  const inserted = await db.insert(srcSchema.skills).values(rows).onConflictDoNothing().returning()
  return { inserted: inserted.length, skipped: rows.length - inserted.length }
}
