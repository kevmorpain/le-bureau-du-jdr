import { describe, it, expect, beforeAll } from 'vitest'
import { ref } from 'vue'
import { eq } from 'drizzle-orm'
import * as schema from '../../server/db/schema'
import { createCharacter, createCharacterSchema } from '../../server/utils/characterCreate'
import { deriveClassSkills } from '../../server/utils/classProficiencyDerivation'
import { useLevelUp } from '../../app/composables/useLevelUp'
import { useCharacterSheet } from '../../app/composables/useCharacterSheet'
import { ABILITIES, SKILLS } from '../../app/data/character-builder'
import { bootstrapGoldenDb, OWNER, CLASS, SPECIES } from './fixtures/goldenMaster'

// Le level-up lit maîtrises et caractéristiques dans la même couche que la fiche. Le stocké ne suffit
// pas : `character_skills` ne porte que les overrides et l'expertise (le picker d'expertise d'un
// Roublard/Barde restait vide, étape bloquée), et les scores stockés n'incluent ni les bonus d'espèce
// fixes ni ceux des dons (PV gagnés, prérequis de multiclassage et plafond d'ASI faux).

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any

beforeAll(async () => {
  ;({ db } = await bootstrapGoldenDb())
}, 60000)

const ROGUE = CLASS.rogue

const effect = (e: Record<string, unknown>) => ({ effect: e })
const skill = (key: string) => ({ type: 'skill_proficiency', value: { skill: key } })

// Payload tel que le renvoie GET /api/character_sheets/[id], restreint aux champs lus. Sans `id` : le
// fetch des overrides d'outils n'est pas déclenché.
const payload = (over: Record<string, unknown> = {}) => ref({
  skills: [],
  features: [],
  abilityScoreImprovements: [],
  baseAbilityScores: [],
  backgroundEffects: [],
  classEffects: [],
  classSavingThrowEffects: [],
  classSkillEffects: [],
  species: null,
  classes: [{ classId: ROGUE, level: 5, isMain: true, class: { name: 'Roublard' }, subclass: null }],
  ...over,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any)

const keys = (skills: Array<{ key: string }>) => skills.map(s => s.key).sort()

const elf = {
  speciesFeatures: [{ feature: { id: 1, name: 'Sens aiguisés', featureType: 'species_trait', featureEffects: [effect(skill('perception'))] } }],
}
const beguilingInfluence = {
  feature: { id: 2, name: 'Présence captivante', featureType: 'eldritch_invocation', featureEffects: [effect(skill('deception')), effect(skill('persuasion'))] },
  choices: null,
}
const skilled = {
  feature: { id: 3, name: 'Doué', featureType: 'feat', featureEffects: [effect({ type: 'other', value: { kind: 'skilled_choice' } })] },
  choices: { skills: ['history', 'arcana'], tools: ['Luth'] },
}
// Aptitude de Roublard 9 sur un Roublard 5 : pas encore débloquée.
const lockedClassFeature = {
  feature: { id: 4, name: 'Verrouillée', featureType: 'class_feature', classId: ROGUE, levelRequired: 9, featureEffects: [effect(skill('insight'))] },
  choices: null,
}

describe('level-up — maîtrises de compétences lues comme la fiche', () => {
  it('Roublard 5 créé par le serveur : ses compétences de classe dérivées sont éligibles à l\'expertise', async () => {
    const { id } = await createCharacter(db, createCharacterSchema.parse({
      name: 'Sly', maxHp: 33, classId: ROGUE, level: 5, speciesId: SPECIES.human,
      abilityScores: { str: 10, dex: 16, con: 12, int: 13, wis: 11, cha: 14 },
      classSkills: ['stealth', 'perception', 'acrobatics', 'deception'], classSavingThrows: ['dex', 'int'],
      backgroundSkills: [], spellIds: [], expertiseSkills: ['stealth', 'perception'],
    }), OWNER)
    const skills = await db.select().from(schema.characterSkills).where(eq(schema.characterSkills.characterSheetId, id))
    const classSkillEffects = await deriveClassSkills(db, id)
    // Le stocké seul ne contient plus que les deux expertises.
    expect(skills.map((s: { skillKey: string }) => s.skillKey).sort()).toEqual(['perception', 'stealth'])

    const { expertSkills, proficientSkills, eligibleExpertiseSkills } = useLevelUp(payload({ skills, classSkillEffects }))

    expect([...expertSkills.value].sort()).toEqual(['perception', 'stealth'])
    expect([...proficientSkills.value].sort()).toEqual(['acrobatics', 'deception', 'perception', 'stealth'])
    expect(keys(eligibleExpertiseSkills.value)).toEqual(['acrobatics', 'deception'])
  })

  it('octrois d\'espèce, d\'invocation et de don : éligibles à l\'expertise ; aptitude non débloquée : rien', () => {
    const { eligibleExpertiseSkills, proficientSkills } = useLevelUp(payload({
      species: elf,
      features: [beguilingInfluence, skilled, lockedClassFeature],
    }))

    expect(keys(eligibleExpertiseSkills.value)).toEqual(['arcana', 'deception', 'history', 'perception', 'persuasion'])
    expect(proficientSkills.value).not.toContain('insight')
  })

  it('une compétence dérivée déjà experte n\'est plus éligible', () => {
    const { eligibleExpertiseSkills, expertSkills } = useLevelUp(payload({
      species: elf,
      skills: [{ skillKey: 'perception', proficiencyLevel: 'expert', source: 'class', isOverride: false }],
    }))

    expect(expertSkills.value).toEqual(['perception'])
    expect(keys(eligibleExpertiseSkills.value)).toEqual([])
  })

  it('équivalence : pour chaque compétence, le level-up voit le même niveau de maîtrise que la fiche', () => {
    const sheet = payload({
      id: 999,
      species: elf,
      features: [beguilingInfluence, skilled, lockedClassFeature],
      skills: [
        { skillKey: 'stealth', proficiencyLevel: 'expert', source: 'class', isOverride: false },
        { skillKey: 'survival', proficiencyLevel: 'proficient', source: 'class', isOverride: false },
      ],
      backgroundEffects: [skill('athletics'), skill('intimidation')],
      classSkillEffects: [skill('stealth'), skill('acrobatics')],
      classSavingThrowEffects: [{ type: 'saving_throw_proficiency', value: { ability: 'dex' } }],
    })
    const { getEffectiveProficiency } = useCharacterSheet(sheet)
    const { expertSkills, proficientSkills } = useLevelUp(sheet)

    const levelUpLevel = (key: string) =>
      expertSkills.value.includes(key) ? 'expert' : proficientSkills.value.includes(key) ? 'proficient' : 'none'
    for (const { key } of SKILLS) {
      expect(levelUpLevel(key), key).toBe(getEffectiveProficiency(key))
    }
    // Garde contre une équivalence vide : chaque source est bien exercée.
    expect([...proficientSkills.value].sort()).toEqual(
      ['acrobatics', 'arcana', 'athletics', 'deception', 'history', 'intimidation', 'perception', 'persuasion', 'stealth', 'survival'],
    )
  })

  it('don Doué : les outils déjà maîtrisés par espèce, don, historique ou classe sont exclus', () => {
    const { ownedTools } = useLevelUp(payload({
      species: { speciesFeatures: [{ feature: { id: 5, name: 'Outils', featureType: 'species_trait', featureEffects: [effect({ type: 'tool_proficiency', value: 'Outils de forgeron' })] } }] },
      features: [skilled],
      backgroundEffects: [{ type: 'tool_proficiency', value: 'Jeu de dés' }],
      classEffects: [{ type: 'tool_proficiency', value: 'Outils de voleur' }],
    }))

    expect([...ownedTools.value].sort()).toEqual(['Jeu de dés', 'Luth', 'Outils de forgeron', 'Outils de voleur'])
  })
})

const speciesWith = (ability: string, amount: number) => ({
  speciesFeatures: [{ feature: { id: 6, name: 'Augmentation de caractéristiques', featureType: 'species_trait', featureEffects: [effect({ type: 'ability_increase', value: { ability, amount } })] } }],
})

describe('level-up — caractéristiques lues comme la fiche', () => {
  it('bonus d\'espèce fixe : le nain des collines garde sa CON +2, PV moyens compris', () => {
    const lu = useLevelUp(payload({
      baseAbilityScores: [{ abilityId: 'con', value: 14 }],
      species: speciesWith('con', 2),
    }))
    lu.state.value.pickedClassId = 'rogue'
    try {
      expect(lu.finalAbilities.value.con).toBe(16)
      expect(lu.conMod.value).toBe(3)
      // Formule d'averageHpGain sur un d8 : ⌈8/2⌉ + 1 + mod CON.
      expect(lu.averageHpGain.value).toBe(8)
    } finally {
      lu.state.value.pickedClassId = null
    }
  })

  it('équivalence : les six caractéristiques valent celles de la fiche', () => {
    const halfFeat = {
      feature: { id: 7, name: 'Demi-don', featureType: 'feat', featureEffects: [effect({ type: 'ability_increase_choice', value: { count: 1, amount: 1 } })] },
      choices: { ability: 'wis' },
    }
    const lockedIncrease = {
      feature: { id: 8, name: 'Verrouillée', featureType: 'class_feature', classId: ROGUE, levelRequired: 9, featureEffects: [effect({ type: 'ability_increase', value: { ability: 'str', amount: 2 } })] },
      choices: null,
    }
    const sheet = payload({
      id: 998,
      baseAbilityScores: ['str', 'dex', 'con', 'int', 'wis', 'cha'].map((abilityId, i) => ({ abilityId, value: [8, 15, 14, 12, 13, 10][i] })),
      species: speciesWith('dex', 2),
      features: [halfFeat, lockedIncrease],
      abilityScoreImprovements: [
        { ability: 'dex', amount: 2, classId: ROGUE, classLevel: 4 },
        // Palier de Roublard 8 sur un Roublard 5 : pas encore atteint.
        { ability: 'int', amount: 1, classId: ROGUE, classLevel: 8 },
      ],
    })
    const { abilityScores } = useCharacterSheet(sheet)
    const { finalAbilities } = useLevelUp(sheet)

    for (const ab of ABILITIES) {
      expect(finalAbilities.value[ab], ab).toBe(abilityScores.value[ab]!.total)
    }
    // Garde contre une équivalence vide : chaque source est bien exercée.
    expect(finalAbilities.value).toEqual({ str: 8, dex: 19, con: 14, int: 12, wis: 14, cha: 10 })
  })
})
