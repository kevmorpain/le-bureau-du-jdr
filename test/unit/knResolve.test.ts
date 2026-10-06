import { describe, it, expect } from 'vitest'
import { defaultKnSkills } from '../../shared/ker-nethalas/character'
import { resolveKnSheet, type KnResolveInput } from '../../shared/ker-nethalas/resolve'
import { emptyKnStatus, type KnStatus } from '../../shared/ker-nethalas/status'
import { KN_RESISTANCE_KEYS, KN_SKILL_KEYS, type KnSkillKey } from '../../shared/ker-nethalas/skills'

// Valeurs calculées à la main d'après Gravebound : conditions p. 88-89, Rot p. 87, Épuisement p. 90, Folie p. 91,
// Growing Darkness p. 120-122, arrondi vers le haut p. 70. Survivant de référence : Esquive 45, Armes tranchantes 70,
// Athlétisme 30, Acrobatie 30, Perception 40, Fouille 25, Raison 35 ; résistances 40 / 20 / 20.

function sheet(over: Partial<KnResolveInput> = {}, status: Partial<KnStatus> = {}): KnResolveInput {
  const skills = defaultKnSkills()
  Object.assign(skills, {
    dodge: { score: 45, marked: false },
    bladedWeapons: { score: 70, marked: false },
    athletics: { score: 30, marked: false },
    acrobatics: { score: 30, marked: false },
    perception: { score: 40, marked: false },
    scavenge: { score: 25, marked: false },
    reason: { score: 35, marked: false },
    stealth: { score: 20, marked: false },
  })

  return {
    skills,
    extraSkills: [],
    resistances: { endurance: 40, resolve: 20, spellward: 20 },
    exhaustion: 0,
    maxVitals: { health: 15, toughness: 25, aether: 12, sanity: 14 },
    status: { ...emptyKnStatus(), ...status },
    ...over,
  }
}

const withDisadvantage = (r: ReturnType<typeof resolveKnSheet>) =>
  KN_SKILL_KEYS.filter(k => r.skills[k].rollMode === 'disadvantage')

describe('survivant sans effet en cours', () => {
  it('garde ses scores de base, sans rappel', () => {
    const r = resolveKnSheet(sheet())

    for (const key of KN_SKILL_KEYS) {
      expect(r.skills[key].effective).toBe(r.skills[key].base)
      expect(r.skills[key].rollMode).toBe('normal')
      expect(r.skills[key].modifiers).toEqual([])
    }
    expect(r.resistances.endurance.effective).toBe(40)
    expect(r.maxVitals.toughness.effective).toBe(25)
    expect(r.reminders).toEqual([])
  })
})

describe('conditions', () => {
  it('Entravé : −20 à Acrobatie, Athlétisme, Esquive et aux compétences d\'arme (p. 89)', () => {
    const r = resolveKnSheet(sheet({}, { conditions: [{ key: 'restrained' }] }))

    expect(r.skills.acrobatics.effective).toBe(10)
    expect(r.skills.athletics.effective).toBe(10)
    expect(r.skills.dodge.effective).toBe(25)
    expect(r.skills.bladedWeapons.effective).toBe(50)
    expect(r.skills.perception.effective).toBe(40)
    expect(r.resistances.endurance.effective).toBe(40)
    expect(r.skills.dodge.modifiers).toEqual([
      { source: { id: 'condition:restrained', label: expect.anything() }, amount: -20 },
    ])
  })

  it('Effrayé (30) : −30 aux compétences d\'arme seulement', () => {
    const r = resolveKnSheet(sheet({}, { conditions: [{ key: 'frightened', value: 30 }] }))

    expect(r.skills.bladedWeapons.effective).toBe(40)
    expect(r.skills.unarmedCombat.effective).toBe(0)
    expect(r.skills.dodge.effective).toBe(45)
  })

  it('Nauséeux (10) : −10 à tous les tests, résistances comprises', () => {
    const r = resolveKnSheet(sheet({}, { conditions: [{ key: 'sickened', value: 10 }] }))

    expect(r.skills.perception.effective).toBe(30)
    expect(r.resistances.endurance.effective).toBe(30)
    expect(r.resistances.resolve.effective).toBe(10)
  })

  it('Gelé : −10 à toutes les compétences, pas aux résistances', () => {
    const r = resolveKnSheet(sheet({}, { conditions: [{ key: 'freezing' }] }))

    expect(r.skills.perception.effective).toBe(30)
    expect(r.resistances.endurance.effective).toBe(40)
  })

  it('Hypothermie : −50 à tous les tests', () => {
    const r = resolveKnSheet(sheet({}, { conditions: [{ key: 'hypothermia' }] }))

    expect(r.skills.bladedWeapons.effective).toBe(20)
    expect(r.resistances.endurance.effective).toBe(0)
  })

  it('Aveuglé : Désavantage partout sauf en Raison', () => {
    const r = resolveKnSheet(sheet({}, { conditions: [{ key: 'blinded' }] }))

    expect(withDisadvantage(r)).toHaveLength(KN_SKILL_KEYS.length - 1)
    expect(r.skills.reason.rollMode).toBe('normal')
    expect(r.resistances.endurance.rollMode).toBe('normal')
  })

  it('À terre : Désavantage aux compétences d\'arme', () => {
    const r = resolveKnSheet(sheet({}, { conditions: [{ key: 'prone' }] }))

    expect(withDisadvantage(r).sort()).toEqual(
      ['bladedWeapons', 'bludgeoningWeapons', 'shaftedWeapons', 'unarmedCombat'],
    )
  })

  it('ne chiffre pas les conditions sans effet sur les scores, mais les rappelle', () => {
    const r = resolveKnSheet(sheet({}, { conditions: [{ key: 'bleeding', value: 3 }, { key: 'stunned', value: 2 }] }))

    expect(r.skills.dodge.effective).toBe(45)
    expect(r.reminders.map(x => x.source.id)).toEqual(['condition:bleeding', 'condition:stunned'])
    expect(r.reminders[0]!.label.params).toEqual({ value: 3 })
  })
})

describe('Épuisement (p. 90)', () => {
  it('aucun effet jusqu\'à 10', () => {
    const r = resolveKnSheet(sheet({ exhaustion: 10 }))

    expect(r.reminders).toEqual([])
    expect(withDisadvantage(r)).toEqual([])
  })

  it('11 à 15 : soins divisés par deux, sans Désavantage', () => {
    for (const exhaustion of [11, 15]) {
      const r = resolveKnSheet(sheet({ exhaustion }))

      expect(r.reminders.map(x => x.label.key)).toEqual(['ker_nethalas.reminders.exhaustionHalfHealing'])
      expect(withDisadvantage(r)).toEqual([])
    }
  })

  it('16 à 20 : Désavantage à tous les tests, résistances comprises, effets cumulés', () => {
    for (const exhaustion of [16, 20]) {
      const r = resolveKnSheet(sheet({ exhaustion }))

      expect(withDisadvantage(r)).toHaveLength(KN_SKILL_KEYS.length)
      for (const key of KN_RESISTANCE_KEYS) expect(r.resistances[key].rollMode).toBe('disadvantage')
      expect(r.reminders.map(x => x.label.key)).toEqual(['ker_nethalas.reminders.exhaustionHalfHealing'])
    }
  })

  it('21 et plus : alerte de mort', () => {
    const r = resolveKnSheet(sheet({ exhaustion: 21 }))

    expect(r.reminders.at(-1)).toMatchObject({ severity: 'danger', label: { key: 'ker_nethalas.reminders.exhaustionDeath' } })
  })

  it('la Rot au stade 7 rend immunisé à ses effets', () => {
    const r = resolveKnSheet(sheet({ exhaustion: 18 }, { rotStage: 7 }))

    expect(r.skills.perception.rollMode).toBe('normal')
    expect(r.resistances.endurance.rollMode).toBe('normal')
    expect(r.reminders.some(x => x.source.id === 'exhaustion')).toBe(false)
  })
})

describe('la Rot (p. 87)', () => {
  it('stade 1 : un rappel, aucun effet chiffré', () => {
    const r = resolveKnSheet(sheet({}, { rotStage: 1 }))

    expect(r.reminders).toHaveLength(1)
    expect(r.maxVitals.toughness.effective).toBe(25)
  })

  it('stade 2 : Robustesse maximale réduite de moitié, arrondie vers le haut', () => {
    const r = resolveKnSheet(sheet({}, { rotStage: 2 }))

    expect(r.maxVitals.toughness.effective).toBe(13)
    expect(r.maxVitals.health.effective).toBe(15)
  })

  it('stade 6 : Désavantage aux armes, Esquive, Athlétisme, Acrobatie, et les effets précédents restent', () => {
    const r = resolveKnSheet(sheet({}, { rotStage: 6 }))

    expect(withDisadvantage(r).sort()).toEqual(
      ['acrobatics', 'athletics', 'bladedWeapons', 'bludgeoningWeapons', 'dodge', 'shaftedWeapons', 'unarmedCombat'],
    )
    expect(r.maxVitals.toughness.effective).toBe(13)
    expect(r.reminders).toHaveLength(6)
  })
})

describe('Folie (p. 91)', () => {
  it('cumule les retraits de Fouille, de Résolution et de Robustesse maximale', () => {
    const counters = { fragileMind: 0, physicalReactions: 3, darknessComing: 0, rushing: 2, darkResistance: 1, forgetfulness: 0 }
    const r = resolveKnSheet(sheet({}, { madness: { counters, lostSkills: [] } }))

    expect(r.skills.scavenge.effective).toBe(5)
    expect(r.resistances.resolve.effective).toBe(10)
    expect(r.maxVitals.toughness.effective).toBe(22)
  })

  it('retire 10 à chaque compétence perdue, cumulativement', () => {
    const lostSkills: { skill?: KnSkillKey }[] = [{ skill: 'reason' }, { skill: 'reason' }, { skill: 'dodge' }]
    const r = resolveKnSheet(sheet({}, { madness: { ...emptyKnStatus().madness, lostSkills } }))

    expect(r.skills.reason.effective).toBe(15)
    expect(r.skills.dodge.effective).toBe(35)
  })

  it('n\'applique rien tant que la compétence perdue n\'est pas choisie', () => {
    const r = resolveKnSheet(sheet({}, { madness: { ...emptyKnStatus().madness, lostSkills: [{}] } }))

    expect(KN_SKILL_KEYS.every(key => r.skills[key].effective === r.skills[key].base)).toBe(true)
  })
})

describe('Growing Darkness (p. 120-122)', () => {
  it('73-74 : −10 aux compétences hors combat, pas à l\'Esquive ni aux armes', () => {
    const r = resolveKnSheet(sheet({}, { domain: { overseerInfluences: [], growingDarkness: [{ key: 'gd_73_74' }] } }))

    expect(r.skills.perception.effective).toBe(30)
    expect(r.skills.athletics.effective).toBe(20)
    expect(r.skills.dodge.effective).toBe(45)
    expect(r.skills.bladedWeapons.effective).toBe(70)
    expect(r.resistances.resolve.effective).toBe(20)
  })

  it('21-22 : Résistance magique −5', () => {
    const r = resolveKnSheet(sheet({}, { domain: { overseerInfluences: [], growingDarkness: [{ key: 'gd_21_22' }] } }))

    expect(r.resistances.spellward.effective).toBe(15)
  })

  it('09-10 et 11-12 : retirent la valeur tirée à l\'Éther et à la Robustesse maximaux', () => {
    const growingDarkness = [{ key: 'gd_09_10' as const, value: 3 }, { key: 'gd_11_12' as const, value: 4 }]
    const r = resolveKnSheet(sheet({}, { domain: { overseerInfluences: [], growingDarkness } }))

    expect(r.maxVitals.aether.effective).toBe(9)
    expect(r.maxVitals.toughness.effective).toBe(21)
  })

  it('57-58 : −10 à la compétence choisie, rien tant qu\'elle n\'est pas choisie', () => {
    const chosen = resolveKnSheet(sheet({}, { domain: { overseerInfluences: [], growingDarkness: [{ key: 'gd_57_58', skill: 'stealth' }] } }))
    const pending = resolveKnSheet(sheet({}, { domain: { overseerInfluences: [], growingDarkness: [{ key: 'gd_57_58' }] } }))

    expect(chosen.skills.stealth.effective).toBe(10)
    expect(pending.skills.stealth.effective).toBe(20)
    expect(pending.reminders[0]!.label.params!.skill).toBe('ker_nethalas.reminders.noSkillChosen')
  })

  it('un même événement tiré deux fois cumule ses effets', () => {
    const growingDarkness = [{ key: 'gd_73_74' as const }, { key: 'gd_73_74' as const }]
    const r = resolveKnSheet(sheet({}, { domain: { overseerInfluences: [], growingDarkness } }))

    expect(r.skills.perception.effective).toBe(20)
    expect(r.skills.perception.modifiers).toHaveLength(2)
  })

  it('un événement immédiat reste listé, en avertissement', () => {
    const r = resolveKnSheet(sheet({}, { domain: { overseerInfluences: [], growingDarkness: [{ key: 'gd_03_04' }] } }))

    expect(r.reminders).toEqual([expect.objectContaining({ severity: 'warning' })])
  })
})

describe('influence d\'Overseer (p. 100)', () => {
  it('ne produit que des rappels : elle modifie les adversaires, pas le survivant', () => {
    const r = resolveKnSheet(sheet({}, { domain: { overseerInfluences: ['skilled'], growingDarkness: [] } }))

    expect(r.reminders).toEqual([expect.objectContaining({ label: { key: 'ker_nethalas.overseer.skilled' } })])
    expect(r.skills.dodge.effective).toBe(45)
  })

  it('garde chaque influence, doublons compris : un Overseer peut en cumuler plusieurs', () => {
    const overseerInfluences = ['skilled' as const, 'piercing' as const, 'piercing' as const]
    const r = resolveKnSheet(sheet({}, { domain: { overseerInfluences, growingDarkness: [] } }))

    expect(r.reminders.map(x => x.label.key)).toEqual([
      'ker_nethalas.overseer.skilled',
      'ker_nethalas.overseer.piercing',
      'ker_nethalas.overseer.piercing',
    ])
    expect(new Set(r.reminders.map(x => x.source.id))).toEqual(new Set(['overseer']))
  })
})

describe('combinaison des sources', () => {
  it('additionne les modificateurs dans l\'ordre des sources et plancher à 0', () => {
    const status = {
      conditions: [{ key: 'restrained' as const }, { key: 'sickened' as const, value: 10 }],
      domain: { overseerInfluences: [], growingDarkness: [{ key: 'gd_73_74' as const }] },
    }
    const r = resolveKnSheet(sheet({}, status))

    expect(r.skills.athletics.modifiers.map(m => [m.source.id, m.amount])).toEqual([
      ['condition:restrained', -20],
      ['condition:sickened', -10],
      ['growingDarkness:gd_73_74:0', -10],
    ])
    expect(r.skills.athletics.effective).toBe(0)
    expect(r.skills.athletics.base).toBe(30)
  })

  it('applique la moitié avant les retraits fixes sur un maximum', () => {
    const counters = { ...emptyKnStatus().madness.counters, physicalReactions: 3 }
    const r = resolveKnSheet(sheet({}, { rotStage: 2, madness: { counters, lostSkills: [] } }))

    expect(r.maxVitals.toughness.effective).toBe(10)
    expect(r.maxVitals.toughness.steps.map(s => [s.kind, s.result])).toEqual([['half', 13], ['delta', 10]])
  })

  it('ne descend jamais sous 0, y compris pour un maximum', () => {
    const counters = { ...emptyKnStatus().madness.counters, physicalReactions: 99 }
    const r = resolveKnSheet(sheet({}, { madness: { counters, lostSkills: [] } }))

    expect(r.maxVitals.toughness.effective).toBe(0)
  })
})

describe('Avantage et Désavantage', () => {
  it('signale « both » quand les deux s\'appliquent, sans trancher', () => {
    const custom = [{ id: 'a', name: 'Bénédiction', active: true, entries: [{ kind: 'advantage' as const, target: 'bladedWeapons' as const }] }]
    const r = resolveKnSheet(sheet({}, { conditions: [{ key: 'prone' }], custom }))

    expect(r.skills.bladedWeapons.rollMode).toBe('both')
    expect(r.skills.bladedWeapons.advantages).toHaveLength(1)
    expect(r.skills.bladedWeapons.disadvantages).toHaveLength(1)
    expect(r.skills.unarmedCombat.rollMode).toBe('disadvantage')
  })
})

describe('plafond des Résistances (p. 20)', () => {
  it('ne dépasse jamais 80, même avec un bonus', () => {
    const custom = [{ id: 'a', name: 'Amulette', active: true, entries: [{ kind: 'modifier' as const, target: 'endurance' as const, amount: 30 }] }]
    const r = resolveKnSheet(sheet({ resistances: { endurance: 60, resolve: 20, spellward: 80 } }, { custom }))

    expect(r.resistances.endurance.effective).toBe(80)
    expect(r.resistances.spellward.effective).toBe(80)
  })

  it('une compétence peut dépasser 80 avec un bonus (p. 19)', () => {
    const custom = [{ id: 'a', name: 'Lame', active: true, entries: [{ kind: 'modifier' as const, target: 'bladedWeapons' as const, amount: 15 }] }]
    const r = resolveKnSheet(sheet({}, { custom }))

    expect(r.skills.bladedWeapons.effective).toBe(85)
  })
})

describe('modificateurs libres', () => {
  it('ignore ceux qui sont désactivés', () => {
    const custom = [{ id: 'a', name: 'Éteint', active: false, entries: [{ kind: 'modifier' as const, target: 'dodge' as const, amount: 20 }] }]

    expect(resolveKnSheet(sheet({}, { custom })).skills.dodge.effective).toBe(45)
  })

  it('applique un retrait de maximum et rappelle la note', () => {
    const custom = [{
      id: 'a',
      name: 'Pacte démoniaque',
      active: true,
      entries: [{ kind: 'maxVital' as const, vital: 'sanity' as const, amount: -5 }],
      note: 'Immunisé à Effrayé et Empoisonné',
    }]
    const r = resolveKnSheet(sheet({}, { custom }))

    expect(r.maxVitals.sanity.effective).toBe(9)
    expect(r.reminders).toEqual([expect.objectContaining({ label: { text: 'Immunisé à Effrayé et Empoisonné' } })])
    expect(r.maxVitals.sanity.steps[0]!.source.label).toEqual({ text: 'Pacte démoniaque' })
  })
})

describe('compétences supplémentaires', () => {
  const extraSkills = [{ name: 'Chant', score: 30, marked: false }]

  it('subissent les effets qui visent toutes les compétences', () => {
    const r = resolveKnSheet(sheet({ extraSkills }, { conditions: [{ key: 'sickened', value: 10 }] }))

    expect(r.extraSkills[0]!.effective).toBe(20)
  })

  it('échappent aux effets ciblés sur une compétence ou un groupe précis', () => {
    const r = resolveKnSheet(sheet({ extraSkills }, { conditions: [{ key: 'frightened', value: 30 }, { key: 'restrained' }] }))

    expect(r.extraSkills[0]!.effective).toBe(30)
  })
})
