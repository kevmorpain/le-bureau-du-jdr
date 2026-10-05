import { describe, it, expect } from 'vitest'
import { canCastAsRitual } from '../../shared/rules/ritualCasting'
import type { ClassSlug } from '../../shared/rules/classSlugs'

const ritual = { ritual: true }
const ctx = (classSlug: ClassSlug | undefined, isPrepared: boolean, source: string | null = null) => ({ classSlug, isPrepared, source })

describe('canCastAsRitual', () => {
  it('un sort sans l\'étiquette rituel ne se lance jamais en rituel', () => {
    expect(canCastAsRitual({ ritual: false }, ctx('wizard', true))).toBe(false)
  })

  it('le magicien et le barde lancent en rituel sans avoir préparé le sort', () => {
    expect(canCastAsRitual(ritual, ctx('wizard', false))).toBe(true)
    expect(canCastAsRitual(ritual, ctx('bard', false))).toBe(true)
  })

  it('le clerc et le druide doivent avoir préparé le sort', () => {
    expect(canCastAsRitual(ritual, ctx('cleric', false))).toBe(false)
    expect(canCastAsRitual(ritual, ctx('cleric', true))).toBe(true)
    expect(canCastAsRitual(ritual, ctx('druid', false))).toBe(false)
    expect(canCastAsRitual(ritual, ctx('druid', true))).toBe(true)
  })

  it.each<ClassSlug>(['sorcerer', 'ranger', 'rogue', 'paladin', 'warlock'])('%s n\'a pas la capacité Rituel', (slug) => {
    expect(canCastAsRitual(ritual, ctx(slug, true))).toBe(false)
  })

  it('l\'occultiste lance en rituel les sorts du Livre des Ombres et l\'Appel de familier du pacte de la chaîne', () => {
    expect(canCastAsRitual(ritual, ctx('warlock', false, 'book_of_ancient_secrets'))).toBe(true)
    expect(canCastAsRitual(ritual, ctx('warlock', false, 'pact_chain'))).toBe(true)
  })

  it('sans classe lanceuse identifiée (sort d\'espèce ou de don), pas de rituel', () => {
    expect(canCastAsRitual(ritual, ctx(undefined, true, 'species'))).toBe(false)
  })
})
