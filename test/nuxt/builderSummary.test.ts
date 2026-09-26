import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import BuilderSummary from '../../app/components/character_builder/BuilderSummary.vue'
import BuilderPreview from '../../app/components/character_builder/BuilderPreview.vue'
import { useCharacterBuilder, type BuilderState } from '../../app/composables/useCharacterBuilder'

// Le récapitulatif (et l'aperçu) doivent afficher ce que la fiche créée affichera : chaque source de
// maîtrise que la fiche dérive (expertise, espèce, historique perso, Humain variant, dons, manifestations)
// doit y être reflétée. Valeurs D&D vérifiées à la main ; effets recopiés du seed.

const FEAT = { vigilant: 901, doue: 902, observateur: 903, resilient: 904, robuste: 905 }
const BEGUILING_INFLUENCE = 950

registerEndpoint('/api/feats', () => [
  { id: FEAT.vigilant, name: 'Vigilant', description: null, effects: [{ type: 'initiative_bonus', value: { amount: 5 } }] },
  { id: FEAT.doue, name: 'Doué', description: null, effects: [{ type: 'other', value: { kind: 'skilled_choice' } }] },
  { id: FEAT.observateur, name: 'Observateur', description: null, effects: [
    { type: 'ability_increase_choice', value: { count: 1, amount: 1, abilities: ['int', 'wis'] } },
    { type: 'passive_skill_bonus', value: { skill: 'perception', amount: 5 } },
    { type: 'passive_skill_bonus', value: { skill: 'investigation', amount: 5 } },
  ] },
  { id: FEAT.resilient, name: 'Résilient', description: null, effects: [
    { type: 'ability_increase_choice', value: { count: 1, amount: 1 } },
    { type: 'saving_throw_proficiency_choice', value: { count: 1, from: 'all' } },
  ] },
  { id: FEAT.robuste, name: 'Robuste', description: null, effects: [{ type: 'hp_per_level', value: { amount: 2 } }] },
])
registerEndpoint('/api/invocations', () => [{
  id: BEGUILING_INFLUENCE,
  name: 'Présence captivante',
  description: null,
  levelRequired: 1,
  prerequisites: null,
  effects: [
    { type: 'skill_proficiency', value: { skill: 'deception' } },
    { type: 'skill_proficiency', value: { skill: 'persuasion' } },
  ],
}])
registerEndpoint('/api/character_species', () => [{ id: 10, name: 'Demi-orc' }, { id: 20, name: 'Elfe' }])
registerEndpoint('/api/catalog/species/10', () => ({
  id: 10,
  name: 'Demi-orc',
  speed: 9,
  size: 'M',
  effects: [
    { type: 'ability_increase', value: { ability: 'str', amount: 2 } },
    { type: 'ability_increase', value: { ability: 'con', amount: 1 } },
    { type: 'skill_proficiency', value: { skill: 'intimidation' } }, // Menaçant
  ],
  lineages: [],
}))
registerEndpoint('/api/catalog/species/20', () => ({
  id: 20,
  name: 'Elfe',
  speed: 9,
  size: 'M',
  effects: [
    { type: 'ability_increase', value: { ability: 'dex', amount: 2 } },
    { type: 'skill_proficiency', value: { skill: 'perception' } }, // Sens aiguisés (trait de la base)
  ],
  lineages: [{
    id: 201,
    name: 'Haut-elfe',
    description: null,
    abilityBonuses: { dex: 2, int: 1 },
    speed: 9,
    darkvision: 18,
    traits: [],
    effects: [{ type: 'ability_increase', value: { ability: 'int', amount: 1 } }],
  }],
}))

type Wrapper = { findAll: (selector: string) => Array<{ text: () => string }> }

const compact = (s: string) => s.replace(/\s+/g, '')

function rowText(wrapper: Wrapper, label: string): string | undefined {
  return wrapper.findAll('div.flex.items-center.gap-2')
    .map(r => compact(r.text()))
    .find(t => t.startsWith(compact(label)))
}

function statText(wrapper: Wrapper, label: string): string | undefined {
  return wrapper.findAll('div.rounded-xl.p-3.text-center')
    .map(r => compact(r.text()))
    .find(t => t.endsWith(compact(label)))
}

function buildCharacter(partial: Partial<BuilderState>) {
  const { state, resetBuilder } = useCharacterBuilder()
  resetBuilder()
  Object.assign(state.value, { name: 'Test', level: 1, backgroundId: 'acolyte', alignment: 'N', ...partial })
}

describe('BuilderSummary — Humain Roublard 1 (Acolyte), expertise Discrétion + Perception', () => {
  beforeEach(() => buildCharacter({
    raceId: 'human',
    classId: 'rogue',
    // Humain : +1 partout → FOR 9 · DEX 16 · CON 15 · INT 13 · SAG 14 · CHA 11.
    abilities: { str: 8, dex: 15, con: 14, int: 12, wis: 13, cha: 10 },
    skills: ['stealth', 'perception', 'acrobatics', 'deception'],
    expertiseSkills: ['stealth', 'perception'],
  }))

  it('double le bonus de maîtrise des compétences d\'expertise (PB 2)', async () => {
    const wrapper = await mountSuspended(BuilderSummary)
    expect(rowText(wrapper, 'Discrétion')).toBe('Discrétion+7') // DEX +3 + 2×2
    expect(rowText(wrapper, 'Perception')).toBe('Perception+6') // SAG +2 + 2×2
    expect(rowText(wrapper, 'Acrobaties')).toBe('Acrobaties+5') // DEX +3 + 2
    expect(rowText(wrapper, 'Tromperie')).toBe('Tromperie+2') // CHA 0 + 2
    expect(rowText(wrapper, 'Intuition')).toBe('Intuition+4') // Acolyte : SAG +2 + 2
    expect(rowText(wrapper, 'Religion')).toBe('Religion+3') // Acolyte : INT +1 + 2
  })

  it('perception passive = 10 + modificateur de Perception avec expertise', async () => {
    const wrapper = await mountSuspended(BuilderSummary)
    expect(statText(wrapper, 'Perc. passive')).toBe('16Perc.passive') // 10 + 6
  })

  it('jets de sauvegarde du Roublard : DEX et INT maîtrisés', async () => {
    const wrapper = await mountSuspended(BuilderSummary)
    expect(rowText(wrapper, 'Dextérité')).toBe('Dextérité+5')
    expect(rowText(wrapper, 'Intelligence')).toBe('Intelligence+3')
    expect(rowText(wrapper, 'Sagesse')).toBe('Sagesse+2')
  })
})

describe('BuilderSummary — compétences d\'espèce (effets du catalogue)', () => {
  it('Demi-orc Guerrier : Menaçant donne Intimidation, sans rejouer les bonus de carac. de l\'espèce', async () => {
    buildCharacter({
      raceId: 'half-orc',
      classId: 'fighter',
      // Demi-orc : FOR +2, CON +1 → FOR 17 · DEX 13 · CON 15 · INT 8 · SAG 12 · CHA 10.
      abilities: { str: 15, dex: 13, con: 14, int: 8, wis: 12, cha: 10 },
      skills: ['athletics', 'perception'],
    })
    const wrapper = await mountSuspended(BuilderSummary)
    await vi.waitFor(() => expect(rowText(wrapper, 'Intimidation')).toBe('Intimidation+2')) // CHA 0 + 2
    expect(rowText(wrapper, 'Athlétisme')).toBe('Athlétisme+5') // FOR +3 + 2 (pas +4 : le +2 d'espèce n'est compté qu'une fois)
    expect(rowText(wrapper, 'Perception')).toBe('Perception+3')
    expect(rowText(wrapper, 'Religion')).toBe('Religion+1') // INT −1 + 2
    expect(statText(wrapper, 'Perc. passive')).toBe('13Perc.passive')
    expect(rowText(wrapper, 'Force')).toBe('Force+5')
    expect(rowText(wrapper, 'Constitution')).toBe('Constitution+4')
  })

  it('Haut-elfe Magicien : Perception vient du trait de la base, pas de la lignée', async () => {
    buildCharacter({
      raceId: 'elf',
      subraceId: '201',
      classId: 'wizard',
      // Haut-elfe : DEX +2, INT +1 → DEX 16 · INT 16 · SAG 12.
      abilities: { str: 8, dex: 14, con: 13, int: 15, wis: 12, cha: 10 },
      skills: ['arcana', 'investigation'],
    })
    const wrapper = await mountSuspended(BuilderSummary)
    await vi.waitFor(() => expect(rowText(wrapper, 'Perception')).toBe('Perception+3')) // SAG +1 + 2
    expect(rowText(wrapper, 'Arcanes')).toBe('Arcanes+5') // INT +3 + 2
    expect(statText(wrapper, 'Perc. passive')).toBe('13Perc.passive')
    expect(rowText(wrapper, 'Intelligence')).toBe('Intelligence+5')
    expect(rowText(wrapper, 'Sagesse')).toBe('Sagesse+3')
  })
})

describe('BuilderSummary — compétences matérialisées (Humain variant, historique personnalisé)', () => {
  it('liste la compétence de variante et les deux compétences d\'historique personnalisé', async () => {
    buildCharacter({
      raceId: 'human',
      isVariantHuman: true,
      variantHumanBonuses: ['dex', 'wis'],
      variantHumanSkill: 'athletics',
      classId: 'fighter',
      // Variante : DEX +1, SAG +1 → FOR 15 · DEX 15 · CON 13 · INT 12 · SAG 11 · CHA 8.
      abilities: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 },
      skills: ['perception', 'survival'],
      backgroundId: 'custom',
      customBackgroundName: 'Ermite des brumes',
      customBackgroundSkills: ['history', 'arcana'],
    })
    const wrapper = await mountSuspended(BuilderSummary)
    expect(rowText(wrapper, 'Athlétisme')).toBe('Athlétisme+4') // FOR +2 + 2
    expect(rowText(wrapper, 'Histoire')).toBe('Histoire+3') // INT +1 + 2
    expect(rowText(wrapper, 'Arcanes')).toBe('Arcanes+3')
    expect(rowText(wrapper, 'Perception')).toBe('Perception+2') // SAG 0 + 2
    expect(rowText(wrapper, 'Survie')).toBe('Survie+2')
    expect(statText(wrapper, 'Perc. passive')).toBe('12Perc.passive')
  })
})

describe('BuilderSummary — dons (Humain Guerrier 1, don bonus)', () => {
  // Humain : +1 partout → FOR 16 · DEX 14 · CON 15 · INT 11 · SAG 13 · CHA 9. PV : d10 + CON +2 = 12.
  const humanFighter = (partial: Partial<BuilderState>) => buildCharacter({
    raceId: 'human',
    classId: 'fighter',
    abilities: { str: 15, dex: 13, con: 14, int: 10, wis: 12, cha: 8 },
    skills: ['athletics', 'perception'],
    ...partial,
  })

  it('Vigilant : +5 à l\'initiative', async () => {
    humanFighter({ bonusFeatureId: FEAT.vigilant })
    const wrapper = await mountSuspended(BuilderSummary)
    await vi.waitFor(() => expect(statText(wrapper, 'Initiative')).toBe('+7Initiative')) // DEX +2 + 5
  })

  it('Observateur (SAG) : +1 SAG et +5 à la perception passive', async () => {
    humanFighter({ bonusFeatureId: FEAT.observateur, featChoices: { [FEAT.observateur]: { ability: 'wis' } } })
    const wrapper = await mountSuspended(BuilderSummary)
    await vi.waitFor(() => expect(statText(wrapper, 'Perc. passive')).toBe('19Perc.passive')) // 10 + (SAG 14 → +2) + 2 + 5
    expect(rowText(wrapper, 'Perception')).toBe('Perception+4')
  })

  it('Robuste : +2 PV par niveau', async () => {
    humanFighter({ bonusFeatureId: FEAT.robuste })
    const wrapper = await mountSuspended(BuilderSummary)
    await vi.waitFor(() => expect(statText(wrapper, 'PV max')).toBe('14PVmax')) // 12 + 2×1
  })

  it('Résilient (SAG) : maîtrise du jet de sauvegarde de Sagesse', async () => {
    humanFighter({ bonusFeatureId: FEAT.resilient, featChoices: { [FEAT.resilient]: { ability: 'wis' } } })
    const wrapper = await mountSuspended(BuilderSummary)
    await vi.waitFor(() => expect(rowText(wrapper, 'Sagesse')).toBe('Sagesse+4')) // SAG 14 → +2, + 2
  })

  it('Doué : les compétences choisies sont maîtrisées', async () => {
    humanFighter({ bonusFeatureId: FEAT.doue, featChoices: { [FEAT.doue]: { skills: ['stealth', 'arcana'], tools: ['Outils de voleur'] } } })
    const wrapper = await mountSuspended(BuilderSummary)
    await vi.waitFor(() => expect(rowText(wrapper, 'Discrétion')).toBe('Discrétion+4')) // DEX +2 + 2
    expect(rowText(wrapper, 'Arcanes')).toBe('Arcanes+2') // INT 0 + 2
  })

  it('un don resté sur un palier d\'ASI non atteint n\'est pas compté (la création ne l\'envoie pas)', async () => {
    humanFighter({ asiChoice: { 4: 'feat' }, asiFeats: { 4: FEAT.vigilant } })
    const wrapper = await mountSuspended(BuilderSummary)
    await vi.waitFor(() => expect(useCharacterBuilder().getFeatById(FEAT.vigilant)).not.toBeNull())
    expect(statText(wrapper, 'Initiative')).toBe('+2Initiative')
  })
})

describe('BuilderSummary — manifestations occultes', () => {
  it('Présence captivante (Occultiste 2) : maîtrise de Tromperie et Persuasion', async () => {
    buildCharacter({
      raceId: 'human',
      classId: 'warlock',
      level: 2,
      // Humain : +1 partout → INT 13 · SAG 11 · CHA 16.
      abilities: { str: 8, dex: 14, con: 13, int: 12, wis: 10, cha: 15 },
      skills: ['arcana', 'intimidation'],
      invocationIds: [BEGUILING_INFLUENCE],
    })
    const wrapper = await mountSuspended(BuilderSummary)
    await vi.waitFor(() => expect(rowText(wrapper, 'Tromperie')).toBe('Tromperie+5')) // CHA +3 + 2
    expect(rowText(wrapper, 'Persuasion')).toBe('Persuasion+5')
    expect(wrapper.text()).toContain('Présence captivante')
    expect(rowText(wrapper, 'Charisme')).toBe('Charisme+5')
  })
})

describe('BuilderPreview — même projection que le récapitulatif', () => {
  it('liste la compétence d\'espèce et la perception passive de la fiche', async () => {
    buildCharacter({
      raceId: 'half-orc',
      classId: 'fighter',
      abilities: { str: 15, dex: 13, con: 14, int: 8, wis: 12, cha: 10 },
      skills: ['athletics', 'perception'],
    })
    const wrapper = await mountSuspended(BuilderPreview)
    await vi.waitFor(() => expect(wrapper.text()).toContain('Intimidation'))
    const stats = wrapper.findAll('div.text-center').map(s => compact(s.text()))
    expect(stats).toContain('13Perc.')
  })
})
