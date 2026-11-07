import { describe, it, expect } from 'vitest'
import { resolveRollMode } from '../../shared/rules/rolls'
import { baseScores, inventoryEntry as entry, mountSheet as mount } from './fixtures/mountSheet'

// Poids porté et variante d'encombrement lus par la fiche. Force 10 : capacité 75 kg, encombré au-delà de 25 kg,
// fortement encombré au-delà de 50 kg.

const FIGHTER = 3

const chainMail = { armor_type: 'heavy', base_ac: 16, dex_limit: 0, strength_requirement: 13, stealth_disadvantage: true }

const weighing = (e: ReturnType<typeof entry>, weightG: number | null, over: { quantity?: number, lotSize?: number } = {}) => ({
  ...e,
  quantity: over.quantity ?? 1,
  item: { ...e.item, weightG, costCp: null, lotSize: over.lotSize ?? 1 },
})

const modeOf = (policy: { sources: Parameters<typeof resolveRollMode>[0] }) => resolveRollMode(policy.sources).mode

const scenario = (worn: Parameters<typeof mount>[0]['worn'], preferences: { encumbrance?: boolean } | null = null) => ({
  scores: baseScores(10, 14, 12, 10),
  classes: [{ classId: FIGHTER, level: 3 }],
  preferences,
  worn,
})

const crate = (id: number, kg: number) => weighing(entry(id, 1, 'Coffre plein', 'equipment', { category: 'Conteneur' }), kg * 1000)

describe('fiche — poids porté', () => {
  it('additionne objets, quantités et pièces', async () => {
    const s = await mount({
      ...scenario(id => [
        weighing(entry(id, 1, 'Cotte de mailles', 'armor', chainMail), 27500),
        weighing(entry(id, 2, 'Torche', 'equipment', { category: 'Éclairage' }), 500, { quantity: 10 }),
        weighing(entry(id, 3, 'Carreau d\'arbalète', 'equipment', { category: 'Munition' }), 750, { quantity: 20, lotSize: 20 }),
      ]),
    })
    expect(s.carriedWeight.value).toBe(27500 + 5000 + 750)
    expect(s.encumbrance.value).toMatchObject({ capacityG: 75000, level: 'encumbered' })
  })

  it('une monture et un véhicule ne comptent pas', async () => {
    const s = await mount(scenario(id => [
      weighing(entry(id, 1, 'Charrette', 'equipment', { category: 'Véhicule' }), 100000),
      weighing(entry(id, 2, 'Mule', 'equipment', { category: 'Monture' }), null),
      weighing(entry(id, 3, 'Dague', 'weapon', {}), 500),
    ]))
    expect(s.carriedWeight.value).toBe(500)
  })

  it('un objet d\'avant les poids (colonnes absentes) compte pour rien', async () => {
    const s = await mount(scenario(id => [entry(id, 1, 'Ancien objet', 'equipment', { category: 'Divers' })]))
    expect(s.carriedWeight.value).toBe(0)
  })
})

describe('fiche — variante d\'encombrement', () => {
  it('désactivée par défaut : le poids s\'affiche, rien ne change', async () => {
    const s = await mount(scenario(id => [crate(id, 55)]))
    expect(s.encumbrance.value.level).toBe('heavily')
    expect(s.encumbranceVariant.value).toBe(false)
    expect(s.effectiveSpeed.value).toBe(9)
    expect(modeOf(s.rollEngine.policy({ type: 'save', ability: 'con' }, []))).toBe('normal')
  })

  it('encombré : vitesse -3 m, sans désavantage', async () => {
    const s = await mount(scenario(id => [crate(id, 30)], { encumbrance: true }))
    expect(s.encumbrance.value.level).toBe('encumbered')
    expect(s.effectiveSpeed.value).toBe(6)
    expect(s.speedDetail.value).toContain('-3 m Encombré')
    expect(modeOf(s.rollEngine.policy({ type: 'save', ability: 'con' }, []))).toBe('normal')
  })

  it('fortement encombré : vitesse -6 m et désavantage aux jets de Force, Dextérité et Constitution', async () => {
    const s = await mount(scenario(id => [crate(id, 55)], { encumbrance: true }))
    expect(s.encumbrance.value.level).toBe('heavily')
    expect(s.effectiveSpeed.value).toBe(3)
    expect(modeOf(s.rollEngine.policy({ type: 'save', ability: 'con' }, []))).toBe('disadvantage')
    expect(modeOf(s.rollEngine.policy({ type: 'check', ability: 'str', skill: 'athletics' }, []))).toBe('disadvantage')
    expect(modeOf(s.rollEngine.policy({ type: 'attack', weapon: true }, []))).toBe('disadvantage')
    expect(modeOf(s.rollEngine.policy({ type: 'check', ability: 'wis', skill: 'perception' }, []))).toBe('normal')
  })

  it('le compte qui l\'active vaut pour la fiche qui n\'a rien tranché', async () => {
    const s = await mount({ ...scenario(id => [crate(id, 30)]), ownerPreferences: { encumbrance: true } })
    expect(s.effectiveSpeed.value).toBe(6)
  })

  it('ignore la colonne Force des armures, la vitesse ne baisse que du poids', async () => {
    const armored = (variant: boolean) => mount(scenario(id => [weighing(entry(id, 1, 'Cotte de mailles', 'armor', chainMail), 0)], { encumbrance: variant }))
    expect((await armored(false)).effectiveSpeed.value).toBe(6)
    expect((await armored(true)).effectiveSpeed.value).toBe(9)
  })
})
