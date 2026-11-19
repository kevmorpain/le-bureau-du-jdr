import type { ClassSlug } from './classSlugs'
import type { Ruleset } from './ruleset'
import type { SubclassCasterSlug } from './subclassCasting'

// Une classe, ou une sous-classe lanceuse du tiers (Chevalier occulte, Escroc arcanique) dont les tables lui sont propres.
type CasterSlug = ClassSlug | SubclassCasterSlug

// Rôdeur 2014 : sorts CONNUS (il ne prépare pas, contrairement au Rôdeur 2024).
export type SpellLearning = 'known' | 'prepared' | 'spellbook'

type ByCaster<T> = Record<Ruleset, Partial<Record<CasterSlug, T>>>

const SPELL_LEARNING: ByCaster<SpellLearning> = {
  5: {
    bard: 'known',
    ranger: 'known',
    sorcerer: 'known',
    warlock: 'known',
    cleric: 'prepared',
    druid: 'prepared',
    paladin: 'prepared',
    wizard: 'spellbook',
    eldritch_knight: 'known',
    arcane_trickster: 'known',
  },
  5.5: {},
}

// Index = niveau DE CLASSE − 1 (tables PHB 2014).
const CANTRIPS_KNOWN: ByCaster<number[]> = {
  5: {
    bard: [2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
    cleric: [3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
    druid: [2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
    sorcerer: [4, 4, 4, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
    warlock: [2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
    wizard: [3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
    eldritch_knight: [0, 0, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
    arcane_trickster: [0, 0, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  },
  5.5: {},
}

const SPELLS_KNOWN: ByCaster<number[]> = {
  5: {
    bard: [4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 15, 16, 18, 19, 19, 20, 22, 22, 22],
    ranger: [0, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11],
    sorcerer: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 12, 13, 13, 14, 14, 15, 15, 15, 15],
    warlock: [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15],
    eldritch_knight: [0, 0, 3, 4, 4, 4, 5, 6, 6, 7, 8, 8, 9, 10, 10, 11, 11, 11, 12, 13],
    arcane_trickster: [0, 0, 3, 4, 4, 4, 5, 6, 6, 7, 8, 8, 9, 10, 10, 11, 11, 11, 12, 13],
  },
  5.5: {},
}

// Grimoire du Magicien : six sorts de niveau 1 au niveau 1, puis deux par niveau de magicien.
const SPELLBOOK_AT_FIRST_LEVEL = 6
const SPELLBOOK_PER_LEVEL = 2

// Niveau 0 = classe pas encore prise (multiclassage) : rien de connu.
function atLevel(table: number[] | undefined, level: number): number {
  if (!table || level < 1) return 0
  return table[Math.min(level, 20) - 1] ?? 0
}

/** Une édition sans tables n'est pas contrôlée : rien n'y dit ce qu'un lanceur apprend. */
export function hasSpellTables(ruleset: Ruleset): boolean {
  return Object.keys(SPELL_LEARNING[ruleset]).length > 0
}

export function spellLearningOf(ruleset: Ruleset, cls: string): SpellLearning | null {
  return SPELL_LEARNING[ruleset][cls as CasterSlug] ?? null
}

export function cantripsKnownAt(ruleset: Ruleset, cls: string, level: number): number {
  return atLevel(CANTRIPS_KNOWN[ruleset][cls as CasterSlug], level)
}

/** Sorts connus (lanceur à sorts connus) ou contenus dans le grimoire ; 0 pour un lanceur à sorts préparés. */
export function spellsKnownAt(ruleset: Ruleset, cls: string, level: number): number {
  const learning = spellLearningOf(ruleset, cls)
  if (learning === 'known') return atLevel(SPELLS_KNOWN[ruleset][cls as CasterSlug], level)
  if (learning === 'spellbook') return level < 1 ? 0 : SPELLBOOK_AT_FIRST_LEVEL + SPELLBOOK_PER_LEVEL * (Math.min(level, 20) - 1)
  return 0
}

// Sorts préparés par jour : modificateur d'incantation + niveau de classe (Clerc, Druide, Magicien),
// ou + la moitié du niveau arrondie à l'inférieur (Paladin) ; minimum un sort.
const PREPARED_LEVEL_DIVISOR: Record<Ruleset, Partial<Record<ClassSlug, number>>> = {
  5: { cleric: 1, druid: 1, wizard: 1, paladin: 2 },
  5.5: {},
}

/** `null` pour une classe qui ne prépare pas (sorts connus, ou pas d'incantation). */
export function preparedSpellsLimit(ruleset: Ruleset, cls: string, level: number, spellcastingMod: number): number | null {
  const divisor = PREPARED_LEVEL_DIVISOR[ruleset][cls as ClassSlug]
  if (!divisor || level < 1) return null
  return Math.max(1, spellcastingMod + Math.floor(level / divisor))
}

// Multiclassage (PHB 2014 p.164) : sorts connus et préparés déterminés classe par classe, comme un
// personnage mono-classé — seul le niveau DANS la classe montée compte, jamais le niveau total.
export function spellsLearnedOnLevelUp(ruleset: Ruleset, cls: string, fromLevel: number, toLevel: number): { cantrips: number, spells: number } {
  return {
    cantrips: Math.max(0, cantripsKnownAt(ruleset, cls, toLevel) - cantripsKnownAt(ruleset, cls, fromLevel)),
    spells: Math.max(0, spellsKnownAt(ruleset, cls, toLevel) - spellsKnownAt(ruleset, cls, fromLevel)),
  }
}

// Barde. « Secrets magiques » (niveaux 10, 14, 18) : deux sorts de n'importe quelle classe, qui comptent comme
// des sorts de barde et sont déjà dans la colonne « sorts connus » de la table. Collège du savoir, « Secrets magiques
// supplémentaires » (niveau 6) : deux de plus, de n'importe quelle classe, HORS de ce décompte. Dans les deux cas : un
// niveau de sort qu'on peut lancer (ou un sort mineur).
export const LORE_COLLEGE_NAME = 'Collège du savoir'
const BARD_SECRETS_LEVELS = [10, 14, 18]
const LORE_EXTRA_SECRETS_LEVEL = 6
const SECRETS_PER_GAIN = 2

/**
 * `anyList` : sorts gagnés dans le décompte normal qui peuvent venir de n'importe quelle liste ; `extra` : sorts
 * supplémentaires hors décompte, eux aussi de n'importe quelle liste.
 */
export function magicalSecretsGained(ruleset: Ruleset, cls: string, fromLevel: number, toLevel: number, subclassName?: string | null): { anyList: number, extra: number } {
  if (ruleset !== '5' || cls !== 'bard') return { anyList: 0, extra: 0 }
  const crossed = (level: number) => fromLevel < level && level <= toLevel
  return {
    anyList: BARD_SECRETS_LEVELS.filter(crossed).length * SECRETS_PER_GAIN,
    extra: subclassName === LORE_COLLEGE_NAME && crossed(LORE_EXTRA_SECRETS_LEVEL) ? SECRETS_PER_GAIN : 0,
  }
}

export interface PreparedSpellRow {
  isPrepared: boolean
  alwaysPrepared?: boolean
  source?: string | null
  classId?: number | null
  level: number
}

/** Sorts qui consomment la limite quotidienne : les sorts de la classe qu'on a préparés, hors sorts mineurs et sorts toujours préparés. */
export function countPreparedSpells(spells: PreparedSpellRow[], classId: number): number {
  return spells.filter(s => s.isPrepared && !s.alwaysPrepared && s.source == null && s.level >= 1 && (s.classId ?? classId) === classId).length
}
