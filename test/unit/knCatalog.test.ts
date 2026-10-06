import { describe, it, expect } from 'vitest'
import fr from '../../i18n/locales/fr.json'
import { KN_CONDITION_KEYS } from '../../shared/ker-nethalas/catalog/conditions'
import {
  KN_GROWING_DARKNESS,
  KN_GROWING_DARKNESS_KEYS,
} from '../../shared/ker-nethalas/catalog/growingDarkness'
import { KN_MADNESS_COUNTER_KEYS } from '../../shared/ker-nethalas/catalog/madness'
import { KN_OVERSEER_INFLUENCE_KEYS } from '../../shared/ker-nethalas/catalog/overseerInfluence'
import { KN_ROT_MAX_STAGE } from '../../shared/ker-nethalas/catalog/rot'
import { createKnCharacterSchema, updateKnCharacterSchema } from '../../shared/ker-nethalas/character'
import { KN_TARGET_GROUPS } from '../../shared/ker-nethalas/effects'
import { emptyKnDomain, knDomainSchema } from '../../shared/ker-nethalas/run'
import { emptyKnStatus, knStatusSchema } from '../../shared/ker-nethalas/status'
import { KN_NON_COMBAT_SKILL_KEYS, KN_WEAPON_SKILL_KEYS } from '../../shared/ker-nethalas/skills'

const labels = fr.ker_nethalas as Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any

describe('tables du livre', () => {
  it('Growing Darkness : 35 entrées dont les plages couvrent exactement 1 à 100 (p. 120-122)', () => {
    const ranges = KN_GROWING_DARKNESS_KEYS.map(key => KN_GROWING_DARKNESS[key].range)

    expect(ranges).toHaveLength(35)
    expect(ranges[0]![0]).toBe(1)
    expect(ranges.at(-1)![1]).toBe(100)
    ranges.slice(1).forEach(([from], i) => expect(from).toBe(ranges[i]![1] + 1))
  })

  it('influence d\'Overseer : 10 entrées (D10, p. 100)', () => {
    expect(KN_OVERSEER_INFLUENCE_KEYS).toHaveLength(10)
  })

  it('conditions : 16 du livre plus l\'hypothermie du Gel (p. 88-89)', () => {
    expect(KN_CONDITION_KEYS).toHaveLength(17)
  })

  it('Rot : 8 stades (p. 87)', () => {
    expect(KN_ROT_MAX_STAGE).toBe(8)
  })

  it('compétences d\'arme : les quatre de l\'index (p. 253) ; hors combat : ni armes ni Esquive', () => {
    expect([...KN_WEAPON_SKILL_KEYS].sort()).toEqual(
      ['bladedWeapons', 'bludgeoningWeapons', 'shaftedWeapons', 'unarmedCombat'],
    )
    expect([...KN_NON_COMBAT_SKILL_KEYS].sort()).toEqual(
      ['acrobatics', 'athletics', 'medicine', 'perception', 'reason', 'scavenge', 'stealth', 'thievery'],
    )
  })
})

describe('libellés français', () => {
  it('chaque condition a un nom et un rappel', () => {
    for (const key of KN_CONDITION_KEYS) {
      expect(labels.conditions[key]?.name, key).toBeTruthy()
      expect(labels.conditions[key]?.reminder, key).toBeTruthy()
    }
  })

  it('chaque stade de la Rot, entrée de Folie, influence et événement a son texte', () => {
    for (let stage = 1; stage <= KN_ROT_MAX_STAGE; stage++) expect(labels.rot[`stage${stage}`], `stade ${stage}`).toBeTruthy()
    for (const key of KN_MADNESS_COUNTER_KEYS) expect(labels.madness[key], key).toBeTruthy()
    expect(labels.madness.lostSkill).toBeTruthy()
    for (const key of KN_OVERSEER_INFLUENCE_KEYS) expect(labels.overseer[key], key).toBeTruthy()
    for (const key of KN_GROWING_DARKNESS_KEYS) expect(labels.growing_darkness[key], key).toBeTruthy()
  })

  it('les éditeurs ont leurs noms courts, cibles et types de modificateur libre', () => {
    for (const key of KN_MADNESS_COUNTER_KEYS) expect(labels.madnessNames[key], key).toBeTruthy()
    expect(labels.madnessNames.lostSkill).toBeTruthy()
    for (const group of KN_TARGET_GROUPS) expect(labels.targets[group], group).toBeTruthy()
    for (const kind of ['modifier', 'advantage', 'disadvantage', 'maxVital']) expect(labels.customKinds[kind], kind).toBeTruthy()
  })

  it('n\'a pas de libellé orphelin pour Growing Darkness ni pour les conditions', () => {
    expect(Object.keys(labels.growing_darkness).sort()).toEqual([...KN_GROWING_DARKNESS_KEYS].sort())
    expect(Object.keys(labels.conditions).sort()).toEqual([...KN_CONDITION_KEYS].sort())
  })
})

describe('schéma de l\'état en cours', () => {
  it('accepte l\'état vide', () => {
    expect(knStatusSchema.safeParse(emptyKnStatus()).success).toBe(true)
  })

  it('refuse une condition en double, inconnue, ou une Rot au-delà du stade 8', () => {
    const status = emptyKnStatus()

    expect(knStatusSchema.safeParse({ ...status, conditions: [{ key: 'prone' }, { key: 'prone' }] }).success).toBe(false)
    expect(knStatusSchema.safeParse({ ...status, conditions: [{ key: 'confused' }] }).success).toBe(false)
    expect(knStatusSchema.safeParse({ ...status, rotStage: 9 }).success).toBe(false)
    expect(knStatusSchema.safeParse({ ...status, rotStage: 8 }).success).toBe(true)
  })

  it('refuse une cible de modificateur libre inconnue', () => {
    const badTarget = {
      ...emptyKnStatus(),
      custom: [{ id: 'a', name: 'X', active: true, entries: [{ kind: 'modifier', target: 'luck', amount: 5 }] }],
    }

    expect(knStatusSchema.safeParse(badTarget).success).toBe(false)
  })

  it('refuse un événement Growing Darkness inconnu', () => {
    const badEvent = { ...emptyKnDomain(1), growingDarkness: [{ key: 'gd_00_00' }] }

    expect(knDomainSchema.safeParse(badEvent).success).toBe(false)
    expect(knDomainSchema.safeParse({ ...emptyKnDomain(1), growingDarkness: [{ key: 'gd_73_74' }] }).success).toBe(true)
  })

  it('accepte plusieurs influences d\'Overseer, doublons compris, mais pas une influence inconnue', () => {
    const withInfluences = (overseerInfluences: string[]) => ({ ...emptyKnDomain(1), overseerInfluences })

    expect(knDomainSchema.safeParse(withInfluences(['skilled', 'piercing', 'piercing'])).success).toBe(true)
    expect(knDomainSchema.safeParse(withInfluences(['invincible'])).success).toBe(false)
  })

  it('accepte une compétence perdue pas encore choisie, mais pas une compétence inconnue', () => {
    const status = emptyKnStatus()
    const withLost = (lostSkills: unknown[]) => ({ ...status, madness: { ...status.madness, lostSkills } })

    expect(knStatusSchema.safeParse(withLost([{}, { skill: 'dodge' }])).success).toBe(true)
    expect(knStatusSchema.safeParse(withLost([{ skill: 'luck' }])).success).toBe(false)
  })

  it('accepte les groupes de cibles et les retraits de maximum dans un modificateur libre', () => {
    const custom = [{
      id: 'a',
      name: 'Pacte',
      active: true,
      entries: [
        { kind: 'modifier', target: 'weaponSkills', amount: 10 },
        { kind: 'maxVital', vital: 'sanity', amount: -5 },
      ],
    }]

    expect(knStatusSchema.safeParse({ ...emptyKnStatus(), custom }).success).toBe(true)
  })

  it('est accepté par la mise à jour d\'un survivant', () => {
    expect(updateKnCharacterSchema.safeParse({ status: emptyKnStatus() }).success).toBe(true)
    expect(updateKnCharacterSchema.safeParse({ status: { ...emptyKnStatus(), rotStage: 12 } }).success).toBe(false)
    expect(updateKnCharacterSchema.safeParse({ weapons: 'Épée longue', damageAffinities: 'Résiste au Feu', equipment: 'Lampe' }).success).toBe(true)
    expect(createKnCharacterSchema.safeParse({ name: 'X' }).success).toBe(true)
  })
})
