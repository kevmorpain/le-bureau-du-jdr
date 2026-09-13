import { describe, it, expect } from 'vitest'
import {
  FIGHTING_STYLE_DEFS,
  FIGHTING_STYLES_BY_CLASS,
  FIGHTING_STYLE_LEVEL_BY_CLASS,
  fightingStyleOptionFeatures,
  fightingStyleProgression,
  type FightingStyleKind,
} from '../../server/db/seeds/data/fightingStyles'

// ─────────────────────────────────────────────────────────────────────────────
// Contrat des données de STYLE DE COMBAT (F2, « décision → progression »). Verrouille la source
// unique `fightingStyles.ts` : les 6 styles PHB 2014, les sous-ensembles par classe, et la forme
// des features-options injectées par seedClass.
//
// Env `unit` : le module n'a aucune dépendance runtime `hub:db` (imports de type seuls).
// ─────────────────────────────────────────────────────────────────────────────

const ALL_KINDS: FightingStyleKind[] = ['archery', 'two_weapon', 'defense', 'dueling', 'great_weapon', 'protection']

describe('fightingStyles — contrat des données', () => {
  it('les 6 styles du PHB 2014, un `kind` unique chacun', () => {
    expect(FIGHTING_STYLE_DEFS.map(d => d.kind).sort()).toEqual([...ALL_KINDS].sort())
    for (const d of FIGHTING_STYLE_DEFS) {
      expect(d.name.length, `nom manquant pour ${d.kind}`).toBeGreaterThan(0)
      expect(d.description.length, `description manquante pour ${d.kind}`).toBeGreaterThan(0)
    }
  })

  it('sous-ensembles par classe (PHB 2014) : Guerrier 6, Paladin 4, Rôdeur 4 (Duel inclus)', () => {
    expect(FIGHTING_STYLES_BY_CLASS.Guerrier).toEqual(['archery', 'two_weapon', 'defense', 'dueling', 'great_weapon', 'protection'])
    expect(FIGHTING_STYLES_BY_CLASS.Paladin).toEqual(['defense', 'dueling', 'great_weapon', 'protection'])
    // Le Rôdeur inclut Duel — le blob front `app/data/character-builder.ts` l'omettait (bug).
    expect(FIGHTING_STYLES_BY_CLASS.Rôdeur).toEqual(['archery', 'two_weapon', 'defense', 'dueling'])
    // Toute clé référencée doit exister dans les définitions.
    for (const [cls, kinds] of Object.entries(FIGHTING_STYLES_BY_CLASS)) {
      for (const k of kinds) expect(ALL_KINDS, `${cls} référence un kind inconnu ${k}`).toContain(k)
    }
  })

  it('niveau d\'accès : Guerrier 1, Paladin 2, Rôdeur 2', () => {
    expect(FIGHTING_STYLE_LEVEL_BY_CLASS).toEqual({ Guerrier: 1, Paladin: 2, Rôdeur: 2 })
  })

  it('la progression owner est bien formée (fixed 1, feature_group fighting_style)', () => {
    expect(fightingStyleProgression).toEqual({
      kind: 'fighting_style',
      count: { op: 'fixed', value: 1 },
      optionSource: { type: 'feature_group', group: 'fighting_style' },
      replaceable: false,
    })
  })

  it('features-options : type `fighting_style`, tag, effet `fighting_style_modifier` par style', () => {
    const guerrier = fightingStyleOptionFeatures('Guerrier')
    expect(guerrier).toHaveLength(6)
    for (const f of guerrier) {
      expect(f.featureType).toBe('fighting_style')
      expect(f.tag).toBe('fighting_style')
      expect(f.effects, `effet manquant pour ${f.name}`).toHaveLength(1)
      const eff = f.effects![0]!
      expect(eff.type).toBe('fighting_style_modifier')
    }
    // Le kind de l'effet correspond au style de la classe (dans l'ordre).
    const kinds = guerrier.map(f => (f.effects![0]!.value as { kind: FightingStyleKind }).kind)
    expect(kinds).toEqual(FIGHTING_STYLES_BY_CLASS.Guerrier)

    // Paladin : 4 options, PAS Archerie.
    const paladin = fightingStyleOptionFeatures('Paladin')
    expect(paladin.map(f => f.name)).not.toContain('Archerie')
    expect(paladin).toHaveLength(4)

    // Classe sans style de combat → [].
    expect(fightingStyleOptionFeatures('Magicien')).toEqual([])
  })
})
