import { describe, it, expect } from 'vitest'
import { resolveChoices, dueChoices } from '../../shared/rules/resolve'
import { warlockCatalog, WARLOCK_CLASS_ID } from '../fixtures/resolveCatalog'

// Premier test de `resolve()` du projet vitest `nuxt` (happy-dom) — attendu par
// rules-engine.md §8. La logique fine est couverte en `unit` (node) ; ici on prouve que
// le module PUR tourne aussi dans l'environnement nuxt, où le client (point 6) l'appellera
// pour l'UX (mêmes choix que ceux que le serveur valide, cf. decisions.md D10).

describe('resolveChoices (environnement nuxt)', () => {
  it('résout les choix dus d\'un Occultiste niveau 3 : faveur de pacte + manifestations', () => {
    const projection = { classLevels: { [WARLOCK_CLASS_ID]: 3 } }
    const due = dueChoices(resolveChoices(projection, warlockCatalog()))

    expect(due.map(c => c.kind).sort()).toEqual(['invocations', 'pact_boon'])

    const pact = due.find(c => c.kind === 'pact_boon')!
    expect(pact.remaining).toBe(1)
    expect(pact.options).toHaveLength(3)
  })
})
