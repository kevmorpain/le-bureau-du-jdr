import type { D1Database, R2Bucket } from '@cloudflare/workers-types'

interface Bindings {
  DB: D1Database
  BLOB: R2Bucket
}

// `globalThis.__env__` est posé par Nitro : à chaque requête en prod (preset cloudflare_module), au
// démarrage en dev (émulation cloudflare-dev, Miniflare sur les bindings de wrangler.jsonc).
export function useBinding<K extends keyof Bindings>(name: K): Bindings[K] {
  const binding = (globalThis as { __env__?: Partial<Bindings> }).__env__?.[name]
  if (!binding) {
    throw new Error(`Binding Cloudflare \`${name}\` introuvable`)
  }
  return binding
}
