import { asc, eq } from 'drizzle-orm'
import * as schema from '~~/server/db/schema'
import type { Db } from '~~/server/utils/db'
import {
  defaultKnResistances,
  defaultKnSkills,
  type CreateKnCharacterInput,
  type UpdateKnCharacterInput,
} from '~~/shared/ker-nethalas/character'
import { emptyKnRun } from '~~/shared/ker-nethalas/run'
import { emptyKnStatus } from '~~/shared/ker-nethalas/status'

const { knCharacters } = schema

export async function listKnCharacters(db: Db, ownerId: number) {
  return await db.select().from(knCharacters).where(eq(knCharacters.ownerId, ownerId)).orderBy(asc(knCharacters.id))
}

export async function createKnCharacter(db: Db, ownerId: number, input: CreateKnCharacterInput): Promise<{ id: number }> {
  const [created] = await db
    .insert(knCharacters)
    .values({
      ownerId,
      name: input.name,
      skills: defaultKnSkills(),
      resistances: defaultKnResistances(),
      status: emptyKnStatus(),
      run: emptyKnRun(),
    })
    .returning({ id: knCharacters.id })

  return created!
}

export async function getKnCharacter(db: Db, id: number) {
  const [character] = await db.select().from(knCharacters).where(eq(knCharacters.id, id)).limit(1)
  return character ?? null
}

export async function updateKnCharacter(db: Db, id: number, patch: UpdateKnCharacterInput) {
  const [updated] = await db
    .update(knCharacters)
    .set({ ...patch, updatedAt: new Date().toISOString() })
    .where(eq(knCharacters.id, id))
    .returning()

  return updated ?? null
}

export async function deleteKnCharacter(db: Db, id: number): Promise<void> {
  await db.delete(knCharacters).where(eq(knCharacters.id, id))
}
