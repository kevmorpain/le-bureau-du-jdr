import { describe, it, expect } from 'vitest'
import { ambroise, lixek, uka, blankFixture, mountAbilities, type AbilitiesFixture } from './fixtures/characters'

// ─────────────────────────────────────────────────────────────────────────────
// Contrat d'équivalence 2014 — useCharacterAbilities (cf. decisions.md D12,
// rules-engine.md §8). Assertions sur des valeurs D&D vérifiées à la main,
// PAS de snapshot : ce test doit révéler une régression, pas la figer.
//
// Cible : la couche de dérivation des caractéristiques, testée d'abord sur le
// sous-composable pur ; elle sera re-pointée sur les fonctions extraites en
// shared/rules/ sans changer ces attentes.
// ─────────────────────────────────────────────────────────────────────────────

describe('useCharacterAbilities — Ambroise (Nain des collines · Occultiste 10)', () => {
  const a = mountAbilities(ambroise)

  describe('Valeurs de caractéristiques (base + espèce, sans ASI ni don)', () => {
    it('décompose chaque score par source', () => {
      // base (seed) + espèce (Nain des collines : CON +2, SAG +1) ; feature/asi = 0
      expect(a.abilityScores.value.str).toEqual({ base: 12, species: 0, feature: 0, asi: 0, bonus: 0, total: 12 })
      expect(a.abilityScores.value.dex).toEqual({ base: 14, species: 0, feature: 0, asi: 0, bonus: 0, total: 14 })
      expect(a.abilityScores.value.con).toEqual({ base: 13, species: 2, feature: 0, asi: 0, bonus: 2, total: 15 })
      expect(a.abilityScores.value.int).toEqual({ base: 13, species: 0, feature: 0, asi: 0, bonus: 0, total: 13 })
      expect(a.abilityScores.value.wis).toEqual({ base: 15, species: 1, feature: 0, asi: 0, bonus: 1, total: 16 })
      expect(a.abilityScores.value.cha).toEqual({ base: 9, species: 0, feature: 0, asi: 0, bonus: 0, total: 9 })
    })

    it('agrège le bonus total par caractéristique', () => {
      expect(a.abilityScoreBonuses.value).toEqual({ str: 0, dex: 0, con: 2, int: 0, wis: 1, cha: 0 })
    })

    it('calcule les modificateurs avec arrondi plancher (dont CHA 9 → −1)', () => {
      // floor((total − 10) / 2) : STR 12→+1, DEX 14→+2, CON 15→+2, INT 13→+1,
      // SAG 16→+3, CHA 9→−1 (floor(−0,5) = −1, pas 0).
      expect(a.abilityModifiers.value).toEqual({ str: 1, dex: 2, con: 2, int: 1, wis: 3, cha: -1 })
    })
  })

  describe('Jets de sauvegarde (Occultiste : maîtrise SAG + CHA, PB +4)', () => {
    it('applique le bonus de maîtrise aux JS maîtrisés, y compris sur un modificateur négatif', () => {
      expect(a.savingThrows.value.str).toEqual({ modifier: 1, proficiency: 'none' })
      expect(a.savingThrows.value.dex).toEqual({ modifier: 2, proficiency: 'none' })
      expect(a.savingThrows.value.con).toEqual({ modifier: 2, proficiency: 'none' })
      expect(a.savingThrows.value.int).toEqual({ modifier: 1, proficiency: 'none' })
      expect(a.savingThrows.value.wis).toEqual({ modifier: 7, proficiency: 'proficient' }) // +3 mod + 4 PB
      expect(a.savingThrows.value.cha).toEqual({ modifier: 3, proficiency: 'proficient' }) // −1 mod + 4 PB
    })

    it('reconnaît la maîtrise via getEffectiveProficiency', () => {
      expect(a.getEffectiveProficiency('wis_save')).toBe('proficient')
      expect(a.getEffectiveProficiency('cha_save')).toBe('proficient')
      expect(a.getEffectiveProficiency('str_save')).toBe('none')
    })
  })

  describe('Compétences (aucune maîtrise seedée → modificateur brut)', () => {
    it('rend chaque compétence non maîtrisée', () => {
      expect(a.getEffectiveProficiency('arcana')).toBe('none')
      expect(a.getEffectiveProficiency('perception')).toBe('none')
    })

    it('renvoie le modificateur de caractéristique nu (une compétence par caractéristique)', () => {
      expect(a.getSkillModifier('str', 'athletics')).toBe(1)
      expect(a.getSkillModifier('dex', 'stealth')).toBe(2)
      expect(a.getSkillModifier('int', 'arcana')).toBe(1)
      expect(a.getSkillModifier('wis', 'perception')).toBe(3)
      expect(a.getSkillModifier('cha', 'intimidation')).toBe(-1) // CHA 9 → −1, sans maîtrise
    })
  })

  describe('Valeurs passives, initiative et PV', () => {
    it('perception passive = 10 + mod SAG (non maîtrisé) sans bonus de don', () => {
      expect(a.passivePerception.value).toBe(13) // 10 + 3
    })

    it('investigation passive = 10 + mod INT', () => {
      expect(a.passiveInvestigation.value).toBe(11) // 10 + 1
    })

    it('initiative = mod DEX (pas de bonus fixe)', () => {
      expect(a.initiativeBonus.value).toBe(2)
    })

    it('aucun bonus de PV : « Ténacité naine » n\'émet pas d\'effet et Ambroise n\'a pas de don', () => {
      expect(a.hpBonusFromFeats.value).toBe(0)
    })
  })
})

describe('useCharacterAbilities — Lixek (Drakéide d\'or · Guerrier Champion 10)', () => {
  const l = mountAbilities(lixek)

  it('décompose les caractéristiques (base + espèce FOR+2/CHA+1 + ASI FOR+2/CON+2)', () => {
    expect(l.abilityScores.value.str).toEqual({ base: 15, species: 2, feature: 0, asi: 2, bonus: 4, total: 19 })
    expect(l.abilityScores.value.dex).toEqual({ base: 13, species: 0, feature: 0, asi: 0, bonus: 0, total: 13 })
    expect(l.abilityScores.value.con).toEqual({ base: 14, species: 0, feature: 0, asi: 2, bonus: 2, total: 16 })
    expect(l.abilityScores.value.int).toEqual({ base: 8, species: 0, feature: 0, asi: 0, bonus: 0, total: 8 })
    expect(l.abilityScores.value.wis).toEqual({ base: 12, species: 0, feature: 0, asi: 0, bonus: 0, total: 12 })
    expect(l.abilityScores.value.cha).toEqual({ base: 10, species: 1, feature: 0, asi: 0, bonus: 1, total: 11 })
  })

  it('calcule les modificateurs (dont INT 8 → −1)', () => {
    expect(l.abilityModifiers.value).toEqual({ str: 4, dex: 1, con: 3, int: -1, wis: 1, cha: 0 })
  })

  it('jets de sauvegarde : maîtrise Force + Constitution (PB +4)', () => {
    expect(l.savingThrows.value.str).toEqual({ modifier: 8, proficiency: 'proficient' }) // +4 + 4
    expect(l.savingThrows.value.dex).toEqual({ modifier: 1, proficiency: 'none' })
    expect(l.savingThrows.value.con).toEqual({ modifier: 7, proficiency: 'proficient' }) // +3 + 4
    expect(l.savingThrows.value.int).toEqual({ modifier: -1, proficiency: 'none' })
    expect(l.savingThrows.value.wis).toEqual({ modifier: 1, proficiency: 'none' })
    expect(l.savingThrows.value.cha).toEqual({ modifier: 0, proficiency: 'none' })
  })

  it('compétences : maîtrises de classe (Survie, Intuition) + historique (Athlétisme, Intimidation)', () => {
    expect(l.getSkillModifier('str', 'athletics')).toBe(8) // FOR +4, maîtrisé (+4)
    expect(l.getSkillModifier('wis', 'survival')).toBe(5) // SAG +1, maîtrisé (+4)
    expect(l.getSkillModifier('wis', 'insight')).toBe(5)
    expect(l.getSkillModifier('cha', 'intimidation')).toBe(4) // CHA +0, maîtrisé (+4)
    // Non maîtrisée → modificateur nu (Athlète remarquable non modélisé).
    expect(l.getEffectiveProficiency('acrobatics')).toBe('none')
    expect(l.getSkillModifier('dex', 'acrobatics')).toBe(1)
  })

  it('initiative avec le don Alerte (+5), passives et PV', () => {
    expect(l.initiativeBonus.value).toBe(6) // DEX +1 + 5 (Alerte)
    expect(l.passivePerception.value).toBe(11) // 10 + SAG +1 (non maîtrisé)
    expect(l.passiveInvestigation.value).toBe(9) // 10 + INT −1
    expect(l.hpBonusFromFeats.value).toBe(0) // Alerte n'accorde pas de PV
  })
})

describe('useCharacterAbilities — Uka (Demi-orc · Barde Collège du savoir 10)', () => {
  const u = mountAbilities(uka)

  it('décompose les caractéristiques (base + espèce FOR+2/CON+1 + ASI CHA+2)', () => {
    expect(u.abilityScores.value.str).toEqual({ base: 10, species: 2, feature: 0, asi: 0, bonus: 2, total: 12 })
    expect(u.abilityScores.value.dex).toEqual({ base: 14, species: 0, feature: 0, asi: 0, bonus: 0, total: 14 })
    expect(u.abilityScores.value.con).toEqual({ base: 13, species: 1, feature: 0, asi: 0, bonus: 1, total: 14 })
    expect(u.abilityScores.value.int).toEqual({ base: 8, species: 0, feature: 0, asi: 0, bonus: 0, total: 8 })
    expect(u.abilityScores.value.wis).toEqual({ base: 12, species: 0, feature: 0, asi: 0, bonus: 0, total: 12 })
    expect(u.abilityScores.value.cha).toEqual({ base: 15, species: 0, feature: 0, asi: 2, bonus: 2, total: 17 })
  })

  it('calcule les modificateurs', () => {
    expect(u.abilityModifiers.value).toEqual({ str: 1, dex: 2, con: 2, int: -1, wis: 1, cha: 3 })
  })

  it('jets de sauvegarde : maîtrise Dextérité + Charisme (PB +4)', () => {
    expect(u.savingThrows.value.dex).toEqual({ modifier: 6, proficiency: 'proficient' }) // +2 + 4
    expect(u.savingThrows.value.cha).toEqual({ modifier: 7, proficiency: 'proficient' }) // +3 + 4
    expect(u.savingThrows.value.str).toEqual({ modifier: 1, proficiency: 'none' })
    expect(u.savingThrows.value.con).toEqual({ modifier: 2, proficiency: 'none' })
  })

  it('expertise : double le bonus de maîtrise sur les compétences expertes', () => {
    expect(u.getEffectiveProficiency('acrobatics')).toBe('expert')
    expect(u.getSkillModifier('dex', 'acrobatics')).toBe(10) // DEX +2 + 4×2
    expect(u.getSkillModifier('cha', 'performance')).toBe(11) // CHA +3 + 4×2
    expect(u.getSkillModifier('cha', 'deception')).toBe(11)
  })

  it('l\'expertise d\'Intimidation prime sur la maîtrise d\'espèce (Menaçant)', () => {
    // Menaçant accorde la maîtrise via un effet ; l'expertise (skills) ne doit pas être dégradée.
    expect(u.getEffectiveProficiency('intimidation')).toBe('expert')
    expect(u.getSkillModifier('cha', 'intimidation')).toBe(11) // CHA +3 + 4×2
  })

  it('maîtrises simples (classe + Doué) au bonus simple', () => {
    expect(u.getSkillModifier('int', 'arcana')).toBe(3) // INT −1 + 4
    expect(u.getSkillModifier('dex', 'sleight_of_hand')).toBe(6) // DEX +2 + 4 (Doué)
    expect(u.getSkillModifier('wis', 'perception')).toBe(5) // SAG +1 + 4 (Doué)
    expect(u.getEffectiveProficiency('athletics')).toBe('none')
    expect(u.getSkillModifier('str', 'athletics')).toBe(1)
  })

  it('passives et initiative (Touche-à-tout non modélisé)', () => {
    expect(u.passivePerception.value).toBe(15) // 10 + Perception maîtrisée (SAG +1 + 4)
    expect(u.passiveInvestigation.value).toBe(9) // 10 + INT −1 (non maîtrisée)
    expect(u.initiativeBonus.value).toBe(2) // DEX +2 seul — pas de +½PB de Touche-à-tout
    expect(u.hpBonusFromFeats.value).toBe(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Branches non exercées par la fiche seedée d'Ambroise (expertise, effets de
// maîtrise, canaux feature/ASI, effets de dons). Cas ciblés et minimaux — ils
// complètent le filet avant l'extraction vers shared/rules/. Les futures fixtures
// « martial » et « caster » (D12) les couvriront de façon réaliste.
// ─────────────────────────────────────────────────────────────────────────────

describe('useCharacterAbilities — dérivation par canal', () => {
  it('empile base + espèce + feature + ASI, et applique 10 par défaut aux caracs absentes', () => {
    const f: AbilitiesFixture = {
      ...blankFixture,
      baseAbilityScores: [{ abilityId: 'wis', value: 13 }],
      speciesEffects: [{ type: 'ability_increase', value: { ability: 'wis', amount: 2 } }],
      featureEffects: [{ type: 'ability_increase', value: { ability: 'wis', amount: 2 } }],
      asiEffects: [{ type: 'ability_increase', value: { ability: 'wis', amount: 2 } }],
    }
    const { abilityScores, abilityModifiers } = mountAbilities(f)

    expect(abilityScores.value.wis).toEqual({ base: 13, species: 2, feature: 2, asi: 2, bonus: 6, total: 19 })
    expect(abilityModifiers.value.wis).toBe(4)
    // Caractéristique jamais renseignée → base 10 par défaut, aucun bonus.
    expect(abilityScores.value.str).toEqual({ base: 10, species: 0, feature: 0, asi: 0, bonus: 0, total: 10 })
    expect(abilityModifiers.value.str).toBe(0)
  })

  it('l\'expertise double le bonus de maîtrise', () => {
    const f: AbilitiesFixture = {
      ...blankFixture,
      baseAbilityScores: [{ abilityId: 'dex', value: 14 }], // mod +2
      skills: [{ skillKey: 'stealth', proficiencyLevel: 'expert' }],
      proficiencyBonus: 4,
    }
    const { getEffectiveProficiency, getSkillModifier } = mountAbilities(f)

    expect(getEffectiveProficiency('stealth')).toBe('expert')
    expect(getSkillModifier('dex', 'stealth')).toBe(10) // 2 + 4 × 2
  })

  it('un effet skill_proficiency (ex. Nain/Demi-orc) accorde la maîtrise', () => {
    const f: AbilitiesFixture = {
      ...blankFixture,
      baseAbilityScores: [{ abilityId: 'cha', value: 14 }], // mod +2
      speciesEffects: [{ type: 'skill_proficiency', value: { skill: 'intimidation' } }],
      proficiencyBonus: 3,
    }
    const { getEffectiveProficiency, getSkillModifier } = mountAbilities(f)

    expect(getEffectiveProficiency('intimidation')).toBe('proficient')
    expect(getSkillModifier('cha', 'intimidation')).toBe(5) // 2 + 3
  })

  it('un effet saving_throw_proficiency (don Résilient résolu) accorde la maîtrise du JS', () => {
    const f: AbilitiesFixture = {
      ...blankFixture,
      baseAbilityScores: [{ abilityId: 'con', value: 14 }], // mod +2
      featureEffects: [{ type: 'saving_throw_proficiency', value: { ability: 'con' } }],
      proficiencyBonus: 3,
    }
    const { savingThrows, getEffectiveProficiency } = mountAbilities(f)

    expect(savingThrows.value.con).toEqual({ modifier: 5, proficiency: 'proficient' }) // 2 + 3
    expect(getEffectiveProficiency('con_save')).toBe('proficient')
    // Ciblé : les autres JS restent nus et la maîtrise ne déborde pas sur les compétences.
    expect(savingThrows.value.wis).toEqual({ modifier: 0, proficiency: 'none' })
    expect(getEffectiveProficiency('athletics')).toBe('none')
  })

  it('les JS d\'effet cohabitent avec ceux stockés en `<carac>_save` (JS de classe)', () => {
    const f: AbilitiesFixture = {
      ...blankFixture,
      baseAbilityScores: [
        { abilityId: 'wis', value: 16 }, // mod +3
        { abilityId: 'con', value: 12 }, // mod +1
      ],
      skills: [{ skillKey: 'wis_save', proficiencyLevel: 'proficient' }], // classe (character_skills)
      featureEffects: [{ type: 'saving_throw_proficiency', value: { ability: 'con' } }], // don
      proficiencyBonus: 4,
    }
    const { savingThrows } = mountAbilities(f)

    expect(savingThrows.value.wis).toEqual({ modifier: 7, proficiency: 'proficient' }) // 3 + 4
    expect(savingThrows.value.con).toEqual({ modifier: 5, proficiency: 'proficient' }) // 1 + 4
  })

  it('priorité de maîtrise : expert > proficient, et un effet ne dégrade pas une expertise', () => {
    const f: AbilitiesFixture = {
      ...blankFixture,
      baseAbilityScores: [{ abilityId: 'dex', value: 14 }],
      skills: [
        { skillKey: 'stealth', proficiencyLevel: 'proficient' },
        { skillKey: 'stealth', proficiencyLevel: 'expert' },
      ],
      speciesEffects: [{ type: 'skill_proficiency', value: { skill: 'stealth' } }],
      proficiencyBonus: 4,
    }
    const { getEffectiveProficiency, getSkillModifier } = mountAbilities(f)

    expect(getEffectiveProficiency('stealth')).toBe('expert')
    expect(getSkillModifier('dex', 'stealth')).toBe(10) // 2 + 4 × 2
  })

  it('applique les effets de dons : passives (Observateur), initiative (Alerte), PV/niveau (Robuste)', () => {
    const f: AbilitiesFixture = {
      ...blankFixture,
      baseAbilityScores: [
        { abilityId: 'wis', value: 14 }, // mod +2
        { abilityId: 'int', value: 12 }, // mod +1
        { abilityId: 'dex', value: 16 }, // mod +3
      ],
      classes: [{ level: 6 }, { level: 4 }], // total 10 niveaux
      featureEffects: [
        { type: 'passive_skill_bonus', value: { skill: 'perception', amount: 5 } },
        { type: 'passive_skill_bonus', value: { skill: 'investigation', amount: 5 } },
        { type: 'initiative_bonus', value: { amount: 5 } },
        { type: 'hp_per_level', value: { amount: 2 } },
      ],
      proficiencyBonus: 4,
    }
    const { passivePerception, passiveInvestigation, initiativeBonus, hpBonusFromFeats } = mountAbilities(f)

    expect(passivePerception.value).toBe(17) // 10 + mod SAG 2 + 5
    expect(passiveInvestigation.value).toBe(16) // 10 + mod INT 1 + 5
    expect(initiativeBonus.value).toBe(8) // mod DEX 3 + 5
    expect(hpBonusFromFeats.value).toBe(20) // 2 × 10 niveaux
  })
})
