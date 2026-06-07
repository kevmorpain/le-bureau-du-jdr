import { db } from 'hub:db'
import * as schema from '~~/server/db/schema'
import type { AuthProvider } from '~~/server/db/schema/users'

interface UpsertUserInput {
  provider: AuthProvider
  providerUserId: string
  email?: string | null
  name: string
  avatar?: string | null
}

/**
 * Crée (ou met à jour) le compte correspondant à l'identité OAuth `(provider, providerUserId)`
 * et renvoie les données publiques à stocker en session. On importe le schéma depuis la source
 * (`~~/server/db/schema`) car la table `users` est récente et absente du cache schéma de `hub:db`
 * (cf. CLAUDE.md). On ne renvoie ni l'email ni le token du provider — seul l'id sert d'owner.
 */
export async function upsertUser(input: UpsertUserInput): Promise<{ id: number, name: string, avatar: string | null }> {
  const row = await db
    .insert(schema.users)
    .values({
      provider: input.provider,
      providerUserId: input.providerUserId,
      email: input.email ?? null,
      name: input.name,
      avatar: input.avatar ?? null,
    })
    .onConflictDoUpdate({
      target: [schema.users.provider, schema.users.providerUserId],
      set: {
        email: input.email ?? null,
        name: input.name,
        avatar: input.avatar ?? null,
      },
    })
    .returning()
    .get()

  return { id: row.id, name: row.name, avatar: row.avatar }
}
