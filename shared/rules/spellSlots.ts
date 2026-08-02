import type { CasterType, SpellcastingType } from './spellcasting'

/**
 * Tables d'emplacements de sorts D&D 5e (2014) — **source unique** (cf. decisions.md D6,
 * rules-engine.md §1). Ces tables + `slotsForLevel` étaient recopiées à l'IDENTIQUE dans
 * `character_sheets/index.post.ts` ET `[id]/level-up.post.ts` (et une variante dans le front),
 * et `combinedSpellSlots` (multiclassage) vivait dans le level-up — cf. architecture-audit.md §7.
 *
 * Module PUR & node-safe (types uniquement en import, aucune valeur `~~`/`hub:db`) : importable
 * par le projet vitest `unit` et par le serveur. Le front (point 6) y pointera à son tour.
 */

// Lanceur complet (Barde, Clerc, Druide, Ensorceleur, Magicien). Index = niveau - 1 ; colonnes = niveaux de sort 1→9.
const FULL_SLOTS: number[][] = [
  [2, 0, 0, 0, 0, 0, 0, 0, 0], [3, 0, 0, 0, 0, 0, 0, 0, 0], [4, 2, 0, 0, 0, 0, 0, 0, 0],
  [4, 3, 0, 0, 0, 0, 0, 0, 0], [4, 3, 2, 0, 0, 0, 0, 0, 0], [4, 3, 3, 0, 0, 0, 0, 0, 0],
  [4, 3, 3, 1, 0, 0, 0, 0, 0], [4, 3, 3, 2, 0, 0, 0, 0, 0], [4, 3, 3, 3, 1, 0, 0, 0, 0],
  [4, 3, 3, 3, 2, 0, 0, 0, 0], [4, 3, 3, 3, 2, 1, 0, 0, 0], [4, 3, 3, 3, 2, 1, 0, 0, 0],
  [4, 3, 3, 3, 2, 1, 1, 0, 0], [4, 3, 3, 3, 2, 1, 1, 0, 0], [4, 3, 3, 3, 2, 1, 1, 1, 0],
  [4, 3, 3, 3, 2, 1, 1, 1, 0], [4, 3, 3, 3, 2, 1, 1, 1, 1], [4, 3, 3, 3, 3, 1, 1, 1, 1],
  [4, 3, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 3, 2, 2, 1, 1],
]

// Demi-lanceur (Paladin, Rôdeur) — incantation à partir du niveau 2.
const HALF_SLOTS: number[][] = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0], [2, 0, 0, 0, 0, 0, 0, 0, 0], [3, 0, 0, 0, 0, 0, 0, 0, 0],
  [3, 0, 0, 0, 0, 0, 0, 0, 0], [4, 2, 0, 0, 0, 0, 0, 0, 0], [4, 2, 0, 0, 0, 0, 0, 0, 0],
  [4, 3, 0, 0, 0, 0, 0, 0, 0], [4, 3, 0, 0, 0, 0, 0, 0, 0], [4, 3, 2, 0, 0, 0, 0, 0, 0],
  [4, 3, 2, 0, 0, 0, 0, 0, 0], [4, 3, 3, 0, 0, 0, 0, 0, 0], [4, 3, 3, 0, 0, 0, 0, 0, 0],
  [4, 3, 3, 1, 0, 0, 0, 0, 0], [4, 3, 3, 1, 0, 0, 0, 0, 0], [4, 3, 3, 2, 0, 0, 0, 0, 0],
  [4, 3, 3, 2, 0, 0, 0, 0, 0], [4, 3, 3, 3, 1, 0, 0, 0, 0], [4, 3, 3, 3, 1, 0, 0, 0, 0],
  [4, 3, 3, 3, 2, 0, 0, 0, 0], [4, 3, 3, 3, 2, 0, 0, 0, 0],
]

// Magie de pacte (Occultiste) : tous les emplacements sont du MÊME niveau, qui monte avec le
// niveau d'occultiste, et leur nombre suit sa propre table.
const PACT_LEVEL = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5]
const PACT_COUNT = [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4]

/**
 * Emplacements de sorts d'une classe seule à un niveau donné → tableau de 9 (niveaux de sort 1→9).
 * Le niveau est borné à [1, 20]. Pour `pact`, un seul niveau de sort porte tous les emplacements.
 */
export function slotsForLevel(type: CasterType, level: number): number[] {
  const idx = Math.max(0, Math.min(19, level - 1))
  if (type === 'full') return [...FULL_SLOTS[idx]!]
  if (type === 'half') return [...HALF_SLOTS[idx]!]
  const row = [0, 0, 0, 0, 0, 0, 0, 0, 0]
  const sl = PACT_LEVEL[idx]!
  row[sl - 1] = PACT_COUNT[idx]!
  return row
}

/** Niveau de sort MAXIMAL accessible (1→9) pour une classe seule à un niveau donné ; 0 si aucun. */
export function maxSpellLevelForLevel(type: CasterType, level: number): number {
  const slots = slotsForLevel(type, level)
  for (let i = 8; i >= 0; i--) {
    if ((slots[i] ?? 0) > 0) {
      return i + 1
    }
  }
  return 0
}

/**
 * Emplacements combinés du multiclassage (PHB 2014 p.164) : les niveaux de lanceur complet, la
 * moitié des niveaux de demi-lanceur (à partir du niveau 2 dans cette classe), agrégés, donnent
 * la table de lanceur complet ; la magie de pacte reste séparée (elle ne se combine pas).
 */
export function combinedSpellSlots(classes: Array<{ casterType: SpellcastingType, level: number }>) {
  let combined = 0
  let pactLvl = 0
  let hasPact = false
  for (const { casterType: t, level } of classes) {
    if (t === 'full') combined += level
    else if (t === 'half' && level >= 2) combined += Math.floor(level / 2)
    else if (t === 'pact') { hasPact = true; pactLvl += level }
  }
  const regular = combined > 0 ? slotsForLevel('full', Math.max(1, Math.min(20, combined))) : null
  const pact = hasPact ? slotsForLevel('pact', Math.max(1, Math.min(20, pactLvl))) : null
  return { regular, pact }
}
