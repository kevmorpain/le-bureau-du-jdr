import type { CasterType, SpellcastingType } from './spellcasting'

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

// Lanceur du tiers (Chevalier occulte, Escroc arcanique) — incantation à partir du niveau 3 (AideDD).
const THIRD_SLOTS: number[][] = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0], [2, 0, 0, 0, 0, 0, 0, 0, 0],
  [3, 0, 0, 0, 0, 0, 0, 0, 0], [3, 0, 0, 0, 0, 0, 0, 0, 0], [3, 0, 0, 0, 0, 0, 0, 0, 0],
  [4, 2, 0, 0, 0, 0, 0, 0, 0], [4, 2, 0, 0, 0, 0, 0, 0, 0], [4, 2, 0, 0, 0, 0, 0, 0, 0],
  [4, 3, 0, 0, 0, 0, 0, 0, 0], [4, 3, 0, 0, 0, 0, 0, 0, 0], [4, 3, 0, 0, 0, 0, 0, 0, 0],
  [4, 3, 2, 0, 0, 0, 0, 0, 0], [4, 3, 2, 0, 0, 0, 0, 0, 0], [4, 3, 2, 0, 0, 0, 0, 0, 0],
  [4, 3, 3, 0, 0, 0, 0, 0, 0], [4, 3, 3, 0, 0, 0, 0, 0, 0], [4, 3, 3, 0, 0, 0, 0, 0, 0],
  [4, 3, 3, 1, 0, 0, 0, 0, 0], [4, 3, 3, 1, 0, 0, 0, 0, 0],
]

// Magie de pacte (Occultiste) : tous les emplacements sont du MÊME niveau, qui monte avec le
// niveau d'occultiste, et leur nombre suit sa propre table.
const PACT_LEVEL = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5]
const PACT_COUNT = [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4]

/** Niveau borné à [1, 20]. */
export function slotsForLevel(type: CasterType, level: number): number[] {
  const idx = Math.max(0, Math.min(19, level - 1))
  if (type === 'full') return [...FULL_SLOTS[idx]!]
  if (type === 'half') return [...HALF_SLOTS[idx]!]
  if (type === 'third') return [...THIRD_SLOTS[idx]!]
  const row = [0, 0, 0, 0, 0, 0, 0, 0, 0]
  const sl = PACT_LEVEL[idx]!
  row[sl - 1] = PACT_COUNT[idx]!
  return row
}

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
 * moitié des niveaux de demi-lanceur (à partir du niveau 2 dans cette classe) et le tiers de ceux d'une
 * sous-classe lanceuse du tiers (à partir du niveau 3), agrégés, donnent la table de lanceur complet ; la
 * magie de pacte reste séparée (elle ne se combine pas). Une seule classe lanceuse (AideDD : « seulement
 * grâce à une de vos classes ») : on lit la table de cette classe.
 */
export function combinedSpellSlots(classes: Array<{ casterType: SpellcastingType, level: number }>) {
  let combined = 0
  let pactLvl = 0
  let hasPact = false
  const regularCasters: Array<{ casterType: CasterType, level: number }> = []
  const contribute = (casterType: CasterType, level: number, castingLevels: number) => {
    combined += castingLevels
    regularCasters.push({ casterType, level })
  }
  for (const { casterType: t, level } of classes) {
    if (t === 'full') contribute(t, level, level)
    else if (t === 'half' && level >= 2) contribute(t, level, Math.floor(level / 2))
    else if (t === 'third' && level >= 3) contribute(t, level, Math.floor(level / 3))
    else if (t === 'pact') {
      hasPact = true
      pactLvl += level
    }
  }
  const [only] = regularCasters
  const regular = regularCasters.length === 1
    ? slotsForLevel(only!.casterType, only!.level)
    : combined > 0 ? slotsForLevel('full', Math.max(1, Math.min(20, combined))) : null
  const pact = hasPact ? slotsForLevel('pact', Math.max(1, Math.min(20, pactLvl))) : null
  return { regular, pact }
}
