import type { DamageEntry, HealEntry, MultiAttack } from '~~/server/db/schema/spells'

/**
 * Montée en puissance d'un sort — **source unique** de la résolution « quelle valeur à quel
 * niveau » (cf. decisions.md D6, même esprit que `shared/rules/math.ts`).
 *
 * Les tables `damage_at_*` / `heal_at_*` / `count_at_*` sont des progressions creuses : la clé est
 * un niveau, la valeur s'applique **jusqu'au palier suivant** (Arme spirituelle : `{2, 4, 6, 8}`).
 * Deux axes INDÉPENDANTS, à ne jamais confondre :
 * - `*_at_character_level` → niveau du PERSONNAGE (tours de magie, qui n'ont pas d'emplacement) ;
 * - `*_at_slot_level` → niveau de l'EMPLACEMENT réellement dépensé (montée en puissance).
 *
 * Ce module existe parce que cette résolution était réimplémentée **quatre fois** (MagicSection
 * pour le jet, CharacterSpellRow, DamageSection/HealSection, SpellCardBuilder) avec des
 * comportements divergents — d'où l'écart « affiché ≠ jeté » de U10
 * (`docs/fonctionnalites-manquantes.md`) : le jet appliquait le niveau choisi, l'affichage restait
 * figé au niveau de base.
 *
 * Module pur (imports de TYPES uniquement) : testable dans le projet vitest `unit`, consommable
 * par le serveur comme par le front.
 */

/** Les deux niveaux de référence d'une incantation. */
export type CastLevels = {
  characterLevel: number
  /** Niveau de l'emplacement dépensé (= niveau du sort quand il est lancé sans montée en puissance). */
  slotLevel: number
}

/** Niveau d'emplacement d'un sort lancé SANS montée en puissance (plancher à 1 pour les tours de magie). */
export const baseSlotLevel = (spell: { level: number }): number => Math.max(1, spell.level)

/** Niveaux de référence d'un sort lancé sans montée en puissance. */
export const baseCastLevels = (spell: { level: number }, characterLevel: number): CastLevels => ({
  characterLevel,
  slotLevel: baseSlotLevel(spell),
})

/**
 * Valeur d'une progression creuse au niveau demandé : le palier le plus haut **≤ niveau**.
 * `undefined` si aucun palier n'est atteint (sort pas encore actif à ce niveau).
 */
export function resolveAtLevel<T>(
  table: Record<string, T> | Record<number, T> | null | undefined,
  level: number,
): T | undefined {
  if (!table) return undefined
  let bestKey: number | undefined
  let bestValue: T | undefined
  for (const [key, value] of Object.entries(table)) {
    const at = Number(key)
    if (!Number.isFinite(at) || at > level) continue
    if (bestKey === undefined || at > bestKey) {
      bestKey = at
      bestValue = value as T
    }
  }
  return bestValue
}

/** Dé d'une composante de dégâts aux niveaux donnés (l'axe est choisi par la forme de l'entrée). */
export function resolveDamageDie(entry: DamageEntry, levels: CastLevels): string | undefined {
  return 'damage_at_character_level' in entry
    ? resolveAtLevel(entry.damage_at_character_level, levels.characterLevel)
    : resolveAtLevel(entry.damage_at_slot_level, levels.slotLevel)
}

/** Dé de soin aux niveaux donnés (même règle d'axe que `resolveDamageDie`). */
export function resolveHealDie(heal: HealEntry, levels: CastLevels): string | undefined {
  return 'heal_at_character_level' in heal
    ? resolveAtLevel(heal.heal_at_character_level, levels.characterLevel)
    : resolveAtLevel(heal.heal_at_slot_level, levels.slotLevel)
}

/**
 * Nombre d'attaques d'un sort multi-cible aux niveaux donnés, `null` si le sort n'est pas
 * multi-attaque ou n'en fait qu'une (rien à distinguer d'un jet simple).
 */
export function resolveAttackCount(
  multiAttack: MultiAttack | null | undefined,
  levels: CastLevels,
): { count: number, label: string } | null {
  if (!multiAttack) return null
  const byCharacter = multiAttack.count_at_character_level
  const table = byCharacter ?? multiAttack.count_at_slot_level
  if (!table) return null
  const count = resolveAtLevel(table, byCharacter ? levels.characterLevel : levels.slotLevel)
  if (count === undefined || count <= 1) return null
  return { count, label: multiAttack.label ?? 'Attaque' }
}

/**
 * Découpe une notation de dés : `"3d6"`, `"10d6+40"` (bonus fixe inclus dans la table) ou une
 * valeur plate `"5"` (Aide). `null` si la chaîne n'est pas une notation reconnue.
 */
export function parseDiceNotation(die: string): { count: number, sides: number, flat: number } | null {
  const dice = die.match(/^(\d+)d(\d+)(?:\s*\+\s*(\d+))?$/)
  if (dice) {
    return { count: Number(dice[1]), sides: Number(dice[2]), flat: dice[3] ? Number(dice[3]) : 0 }
  }
  const flat = die.match(/^(\d+)$/)
  if (flat) return { count: 0, sides: 0, flat: Number(flat[1]) }
  return null
}

/** Fourchette min~max d'une notation de dés, bonus compris. `null` si la notation est inconnue. */
export function diceRange(die: string, bonus = 0): { min: number, max: number } | null {
  const parsed = parseDiceNotation(die)
  if (!parsed) return null
  return {
    min: parsed.count + parsed.flat + bonus,
    max: parsed.count * parsed.sides + parsed.flat + bonus,
  }
}

// ─── Montée en puissance (encart « Aux niveaux supérieurs ») ──────────────────
//
// Ne concernent QUE les progressions par niveau d'emplacement : une progression par niveau de
// personnage ne change pas selon l'emplacement dépensé, elle n'a rien à faire dans l'encart.

/** Sort réduit à ce dont la montée en puissance a besoin (évite de dépendre du type `Spell` complet). */
export type ScalableSpell = {
  level: number
  damages?: DamageEntry[] | null
  heal?: HealEntry | null
  multiAttack?: MultiAttack | null
}

export type ScalingEntry =
  | { kind: 'damage', damageType: string, label?: string, die: string }
  | { kind: 'heal', healType: string, die: string }
  | { kind: 'attacks', label: string, count: number }

/** Une ligne de l'encart : ce que donne le sort lancé avec un emplacement de ce niveau. */
export type ScalingRow = { level: number, entries: ScalingEntry[] }

/** Niveau d'emplacement maximum (PHB 2014). */
const MAX_SLOT_LEVEL = 9

/** Ce que donne le sort à ce niveau d'emplacement — progressions par emplacement uniquement. */
export function slotScalingEntries(spell: ScalableSpell, slotLevel: number): ScalingEntry[] {
  const entries: ScalingEntry[] = []

  for (const damage of spell.damages ?? []) {
    if ('damage_at_character_level' in damage) continue
    const die = resolveAtLevel(damage.damage_at_slot_level, slotLevel)
    if (die) entries.push({ kind: 'damage', damageType: damage.damage_type, label: damage.label, die })
  }

  const heal = spell.heal
  if (heal && !('heal_at_character_level' in heal)) {
    const die = resolveAtLevel(heal.heal_at_slot_level, slotLevel)
    if (die) entries.push({ kind: 'heal', healType: heal.heal_type, die })
  }

  const counts = spell.multiAttack?.count_at_slot_level
  if (counts) {
    const count = resolveAtLevel(counts, slotLevel)
    if (count !== undefined && count > 1) {
      entries.push({ kind: 'attacks', label: spell.multiAttack?.label ?? 'Attaque', count })
    }
  }

  return entries
}

/** Signature d'une ligne, pour ne garder que les niveaux où quelque chose CHANGE réellement. */
const signature = (entries: ScalingEntry[]): string => JSON.stringify(entries)

/**
 * Paliers de montée en puissance au-dessus du niveau de base du sort : un palier par niveau
 * d'emplacement où la valeur change. Liste vide quand le sort ne monte pas en puissance.
 */
export function upcastRows(spell: ScalableSpell): ScalingRow[] {
  const base = baseSlotLevel(spell)
  let previous = signature(slotScalingEntries(spell, base))
  const rows: ScalingRow[] = []

  for (let level = base + 1; level <= MAX_SLOT_LEVEL; level++) {
    const entries = slotScalingEntries(spell, level)
    const current = signature(entries)
    if (current === previous) continue
    rows.push({ level, entries })
    previous = current
  }

  return rows
}
