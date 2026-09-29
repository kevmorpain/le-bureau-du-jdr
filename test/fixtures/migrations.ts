import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Client } from '@libsql/client'

// `process.cwd()` et non `import.meta.url`, qui n'est pas un file:// en env `nuxt`.
export const MIGRATIONS_DIR = join(process.cwd(), 'server', 'db', 'migrations')

export async function migrationFiles(): Promise<string[]> {
  return (await readdir(MIGRATIONS_DIR)).filter(f => f.endsWith('.sql')).sort()
}

export function readMigration(file: string): Promise<string> {
  return readFile(join(MIGRATIONS_DIR, file), 'utf8')
}

/** Un fichier = un seul bloc SQL, comme `wrangler d1 migrations apply`. */
export async function applyMigration(client: Client, file: string): Promise<void> {
  await client.executeMultiple(await readMigration(file))
}

/** Rejoue la chaîne dans l'ordre des noms ; `before` s'arrête juste avant ce fichier. */
export async function replayMigrations(client: Client, { before }: { before?: string } = {}): Promise<void> {
  for (const file of await migrationFiles()) {
    if (before && file >= before) break
    await applyMigration(client, file)
  }
}
