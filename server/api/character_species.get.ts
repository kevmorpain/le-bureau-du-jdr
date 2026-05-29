import { db, schema } from 'hub:db'
import { asc } from 'drizzle-orm'

export default defineEventHandler(async () => {
  // Liste plate des espèces — le builder n'a besoin que de {id, name} pour la
  // résolution name → id. Les traits (effets) sont déjà appliqués côté serveur
  // via le lien species_id sur character_sheets, pas besoin de les renvoyer ici.
  return await db
    .select({ id: schema.characterSpecies.id, name: schema.characterSpecies.name })
    .from(schema.characterSpecies)
    .orderBy(asc(schema.characterSpecies.name))
})
