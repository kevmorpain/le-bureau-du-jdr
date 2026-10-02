import { describe, it, expect } from 'vitest'
import { reactive } from 'vue'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import HitPointsSection from '../../app/components/character_sheet/HitPointsSection.vue'
import DeathSavingThrowSection from '../../app/components/character_sheet/DeathSavingThrowSection.vue'
import ConcentrationSection from '../../app/components/character_sheet/ConcentrationSection.vue'

// Câblage de la fiche sur shared/rules/damage : la section PV applique soins et dégâts, les jets contre la mort et la concentration
// vivent sur la fiche (colonnes persistées) et non plus en localStorage.

const SHEET_ID = 9301

registerEndpoint(`/api/character_sheets/${SHEET_ID}/inventory`, () => [])
registerEndpoint(`/api/character_sheets/${SHEET_ID}/proficiency-overrides`, () => [])
registerEndpoint(`/api/character_sheets/${SHEET_ID}/spells`, () => [])
registerEndpoint('/api/backgrounds', () => [])

// Niveau 1, CON 10 : maximum de 20 PV.
const sheet = (over: Record<string, unknown> = {}) => reactive({
  id: SHEET_ID,
  hpBase: 20,
  currentHp: 20,
  temporaryHp: 0,
  exhaustionLevel: 0,
  deathSaveSuccesses: 0,
  deathSaveFailures: 0,
  concentratingSpellId: null,
  concentratingOn: null,
  baseAbilityScores: [],
  classes: [{ classId: 1, level: 1 }],
  features: [],
  skills: [],
  abilityScoreImprovements: [],
  species: null,
  ...over,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any) as any

const damage = async (wrapper: Awaited<ReturnType<typeof mountSuspended>>, amount: number, { critical = false } = {}) => {
  await wrapper.findAll('button').find(b => b.text().includes('Dégâts'))!.trigger('click')
  await wrapper.find('input[placeholder="Dégâts bruts"]').setValue(String(amount))
  if (critical) await wrapper.find('button[role="checkbox"]').trigger('click')
  await wrapper.findAll('button').find(b => b.text() === 'OK')!.trigger('click')
}

describe('HitPointsSection — dégâts', () => {
  it('retire les dégâts aux PV, après les PV temporaires', async () => {
    const s = sheet({ temporaryHp: 5 })
    const wrapper = await mountSuspended(HitPointsSection, { props: { characterSheet: s } })

    await damage(wrapper, 8)

    expect(s).toMatchObject({ temporaryHp: 0, currentHp: 17 })
  })

  it('à 0 PV, des dégâts valent un échec aux jets contre la mort, deux sur un coup critique', async () => {
    const s = sheet({ currentHp: 0 })
    const wrapper = await mountSuspended(HitPointsSection, { props: { characterSheet: s } })

    await damage(wrapper, 3)
    expect(s.deathSaveFailures).toBe(1)

    await damage(wrapper, 3, { critical: true })
    expect(s.deathSaveFailures).toBe(3)
  })

  it('mort instantanée quand les dégâts restants atteignent le maximum', async () => {
    const s = sheet({ currentHp: 6 })
    const wrapper = await mountSuspended(HitPointsSection, { props: { characterSheet: s } })

    await damage(wrapper, 26) // 6 PV, puis 20 restants : le maximum

    expect(s).toMatchObject({ currentHp: 0, deathSaveFailures: 3 })
  })

  it('un soin remet les jets contre la mort à zéro', async () => {
    const s = sheet({ currentHp: 0, deathSaveSuccesses: 2, deathSaveFailures: 1 })
    const wrapper = await mountSuspended(HitPointsSection, { props: { characterSheet: s } })

    await wrapper.findAll('button').find(b => b.text().includes('Soins'))!.trigger('click')
    await wrapper.find('input[placeholder="PV récupérés"]').setValue('4')
    await wrapper.findAll('button').find(b => b.text() === 'OK')!.trigger('click')

    expect(s).toMatchObject({ currentHp: 4, deathSaveSuccesses: 0, deathSaveFailures: 0 })
  })

  it('à 0 PV, la concentration s\'arrête d\'elle-même', async () => {
    const s = sheet({ currentHp: 5, concentratingOn: 'Ténèbres' })
    const wrapper = await mountSuspended(HitPointsSection, { props: { characterSheet: s } })

    await damage(wrapper, 9)

    expect(s.currentHp).toBe(0)
    expect(s.concentratingOn).toBeNull()
  })

  it('au-dessus de 0 PV, la concentration reste en attente du jet de Constitution', async () => {
    const s = sheet({ concentratingOn: 'Ténèbres' })
    const wrapper = await mountSuspended(HitPointsSection, { props: { characterSheet: s } })

    await damage(wrapper, 4)

    expect(s.concentratingOn).toBe('Ténèbres')
    expect(document.body.textContent).toContain('Vérification de concentration')
  })
})

describe('DeathSavingThrowSection', () => {
  it('apparaît à 0 PV, lit et écrit les jets sur la fiche', async () => {
    const s = sheet({ currentHp: 0, deathSaveSuccesses: 1 })
    const wrapper = await mountSuspended(DeathSavingThrowSection, {
      props: { characterSheet: s, roll: () => 1 }, // 1 naturel : deux échecs
    })

    expect(wrapper.text()).toContain('JdS contre la mort')
    await wrapper.findAll('button').find(b => b.text().includes('Lancer un jet de mort'))!.trigger('click')

    expect(s.deathSaveFailures).toBe(2)
    expect(s.deathSaveSuccesses).toBe(1)
  })

  it('20 naturel : la fiche revient à 1 PV, jets remis à zéro', async () => {
    const s = sheet({ currentHp: 0, deathSaveFailures: 2 })
    const wrapper = await mountSuspended(DeathSavingThrowSection, { props: { characterSheet: s, roll: () => 20 } })

    await wrapper.findAll('button').find(b => b.text().includes('Lancer un jet de mort'))!.trigger('click')

    expect(s).toMatchObject({ currentHp: 1, deathSaveFailures: 0, deathSaveSuccesses: 0 })
  })

  it('n\'apparaît pas au-dessus de 0 PV', async () => {
    const wrapper = await mountSuspended(DeathSavingThrowSection, { props: { characterSheet: sheet() } })
    expect(wrapper.text()).not.toContain('JdS contre la mort')
  })

  it('épuisement de niveau 6 : mort, même avec des PV', async () => {
    const wrapper = await mountSuspended(DeathSavingThrowSection, { props: { characterSheet: sheet({ exhaustionLevel: 6 }) } })
    expect(wrapper.text()).toContain('Mort')
    expect(wrapper.text()).toContain('épuisement de niveau 6')
  })
})

describe('ConcentrationSection — concentration libre', () => {
  it('propose de se concentrer quand rien n\'est en cours, puis enregistre un libellé libre', async () => {
    const s = sheet()
    const wrapper = await mountSuspended(ConcentrationSection, { props: { characterSheet: s } })

    expect(wrapper.text()).toContain('Aucune')
    await wrapper.findAll('button').find(b => b.text().includes('Se concentrer'))!.trigger('click')
    await wrapper.find('input').setValue('Aura du monstre')
    await wrapper.find('form').trigger('submit')

    expect(s).toMatchObject({ concentratingOn: 'Aura du monstre', concentratingSpellId: null })
    expect(wrapper.text()).toContain('Aura du monstre')
  })

  it('rompre efface le libellé libre', async () => {
    const s = sheet({ concentratingOn: 'Aura du monstre' })
    const wrapper = await mountSuspended(ConcentrationSection, { props: { characterSheet: s } })

    await wrapper.findAll('button').find(b => b.text().includes('Rompre'))!.trigger('click')

    expect(s.concentratingOn).toBeNull()
  })
})
