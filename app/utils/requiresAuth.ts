// App publique : tout est consultable par défaut ; seules la gestion des
// personnages et la création de contenu exigent un compte.
const PROTECTED_PREFIXES = ['/characters', '/spells/new']

export function requiresAuth(path: string): boolean {
  return PROTECTED_PREFIXES.some(
    prefix => path === prefix || path.startsWith(prefix + '/'),
  )
}
