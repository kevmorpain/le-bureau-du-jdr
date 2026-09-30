import { drizzle } from 'drizzle-orm/d1'
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import * as schema from '../db/schema'
import { useBinding } from './bindings'

type Database = ReturnType<typeof drizzle<typeof schema>>

let instance: Database | undefined

// Le binding D1 n'existe pas encore à l'import du module : le client est créé au premier accès.
export const db = new Proxy({} as Database, {
  get: (_, prop) => Reflect.get(instance ??= drizzle(useBinding('DB'), { schema }), prop),
})

export { schema }

// Contrat des utilitaires à `db` injecté : le client D1, comme un client libsql sans schéma (tests).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Db = BaseSQLiteDatabase<'async', any, any>
