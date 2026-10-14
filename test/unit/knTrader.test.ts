import { describe, it, expect } from 'vitest'
import { emptyKnRun, knCurrentDomain, knNewDomain, knSetTrader, knStartVisit, knTraderHere, knRunSchema } from '../../shared/ker-nethalas/run'

const withVisits = () => knStartVisit(knStartVisit(emptyKnRun(), 'room'), 'corridor')

describe('marchand conservé dans le Domaine', () => {
  it('sans entrée, il n\'y a pas de marchand à marquer', () => {
    const run = emptyKnRun()

    expect(knTraderHere(run)).toBe(false)
    expect(knSetTrader(run, true)).toBe(run)
  })

  it('le marchand se marque dans l\'entrée courante et le Domaine s\'en souvient', () => {
    const run = knSetTrader(withVisits(), true)
    const domain = knCurrentDomain(run)

    expect(knTraderHere(run)).toBe(true)
    expect(domain.traderFound).toBe(true)
    expect(domain.visits.map(visit => visit.trader ?? false)).toEqual([false, true])
    expect(knRunSchema.safeParse(run).success).toBe(true)
  })

  it('une entrée de retour peut le revoir, une entrée ordinaire n\'a pas de marchand', () => {
    const found = knSetTrader(withVisits(), true)
    const elsewhere = knStartVisit(found, 'room')
    const back = knSetTrader(knStartVisit(found, 'revisit'), true)

    expect(knTraderHere(elsewhere)).toBe(false)
    expect(knCurrentDomain(elsewhere).traderFound).toBe(true)
    expect(knTraderHere(back)).toBe(true)
  })

  it('démarquer une entrée laisse le Domaine à sa mémoire tant qu\'une autre entrée l\'a', () => {
    const found = knSetTrader(withVisits(), true)
    const back = knSetTrader(knStartVisit(found, 'revisit'), true)
    const unmarkedBack = knSetTrader(back, false)
    const unmarkedAll = knSetTrader(knSetTrader(found, false), false)

    expect(knTraderHere(unmarkedBack)).toBe(false)
    expect(knCurrentDomain(unmarkedBack).traderFound).toBe(true)
    expect(knCurrentDomain(unmarkedAll).traderFound).toBe(false)
  })

  it('un nouveau Domaine n\'a pas de marchand', () => {
    const next = knNewDomain(knSetTrader(withVisits(), true))

    expect(knCurrentDomain(next).traderFound).toBeUndefined()
    expect(knTraderHere(next)).toBe(false)
  })
})
