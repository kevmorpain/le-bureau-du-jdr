import type { ClassSlug } from './classSlugs'

// Rôdeur 2014 : sorts CONNUS (il ne prépare pas, contrairement au Rôdeur 2024).
export type SpellLearning = 'known' | 'prepared' | 'spellbook'

export const SPELL_LEARNING: Partial<Record<ClassSlug, SpellLearning>> = {
  bard: 'known',
  ranger: 'known',
  sorcerer: 'known',
  warlock: 'known',
  cleric: 'prepared',
  druid: 'prepared',
  paladin: 'prepared',
  wizard: 'spellbook',
}

// Index = niveau DE CLASSE − 1 (tables PHB 2014, vérifiées sur AideDD).
const CANTRIPS_KNOWN: Partial<Record<ClassSlug, number[]>> = {
  bard: [2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  cleric: [3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
  druid: [2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  sorcerer: [4, 4, 4, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
  warlock: [2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  wizard: [3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
}

const SPELLS_KNOWN: Partial<Record<ClassSlug, number[]>> = {
  bard: [4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 15, 16, 18, 19, 19, 20, 22, 22, 22],
  ranger: [0, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11],
  sorcerer: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 12, 13, 13, 14, 14, 15, 15, 15, 15],
  warlock: [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15],
}

// Grimoire du Magicien : six sorts de niveau 1 au niveau 1, puis deux par niveau de magicien.
const SPELLBOOK_AT_FIRST_LEVEL = 6
const SPELLBOOK_PER_LEVEL = 2

// Niveau 0 = classe pas encore prise (multiclassage) : rien de connu.
function atLevel(table: number[] | undefined, level: number): number {
  if (!table || level < 1) return 0
  return table[Math.min(level, 20) - 1] ?? 0
}

export function spellLearningOf(cls: string): SpellLearning | null {
  return SPELL_LEARNING[cls as ClassSlug] ?? null
}

export function cantripsKnownAt(cls: string, level: number): number {
  return atLevel(CANTRIPS_KNOWN[cls as ClassSlug], level)
}

/** Sorts connus (lanceur à sorts connus) ou contenus dans le grimoire ; 0 pour un lanceur à sorts préparés. */
export function spellsKnownAt(cls: string, level: number): number {
  const learning = spellLearningOf(cls)
  if (learning === 'known') return atLevel(SPELLS_KNOWN[cls as ClassSlug], level)
  if (learning === 'spellbook') return level < 1 ? 0 : SPELLBOOK_AT_FIRST_LEVEL + SPELLBOOK_PER_LEVEL * (Math.min(level, 20) - 1)
  return 0
}

// Multiclassage (PHB 2014 p.164) : sorts connus et préparés déterminés classe par classe, comme un
// personnage mono-classé — seul le niveau DANS la classe montée compte, jamais le niveau total.
export function spellsLearnedOnLevelUp(cls: string, fromLevel: number, toLevel: number): { cantrips: number, spells: number } {
  return {
    cantrips: Math.max(0, cantripsKnownAt(cls, toLevel) - cantripsKnownAt(cls, fromLevel)),
    spells: Math.max(0, spellsKnownAt(cls, toLevel) - spellsKnownAt(cls, fromLevel)),
  }
}
