export const CLASS_DB_NAMES = {
  barbarian: 'Barbare',
  bard: 'Barde',
  cleric: 'Clerc',
  druid: 'Druide',
  fighter: 'Guerrier',
  monk: 'Moine',
  paladin: 'Paladin',
  ranger: 'Rôdeur',
  rogue: 'Roublard',
  sorcerer: 'Ensorceleur',
  warlock: 'Occultiste',
  wizard: 'Magicien',
} as const satisfies Record<string, string>

export type ClassSlug = keyof typeof CLASS_DB_NAMES

export function classNameFromSlug(slug: string): string | undefined {
  return (CLASS_DB_NAMES as Record<string, string>)[slug]
}
