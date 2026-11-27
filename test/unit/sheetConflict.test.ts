import { describe, it, expect } from 'vitest'
import { conflictGroupOf, isSameValue, keepQueuedOps, mergeSheet, pendingGroups, splitSheetFields } from '../../app/utils/sheetConflict'

const base = { currentHp: 30, notes: 'Session 1', po: 10, exhaustionLevel: 0, preferences: { diceRolls: true, ammunition: false } }

describe('qui a modifié quel champ depuis la dernière synchronisation', () => {
  it('un champ modifié des deux côtés est un conflit ; d\'un seul côté, il passe tout seul', () => {
    const local = { ...base, currentHp: 22, notes: 'Session 2 (ici)', po: 15 }
    const server = { ...base, currentHp: 25, notes: 'Session 2 (là-bas)', exhaustionLevel: 1 }

    expect(splitSheetFields(base, local, server)).toEqual({ conflicts: ['currentHp', 'notes'], localOnly: ['po'] })
  })

  it('les deux côtés arrivés à la même valeur ne sont pas un conflit', () => {
    expect(splitSheetFields(base, { ...base, currentHp: 20 }, { ...base, currentHp: 20 })).toEqual({ conflicts: [], localOnly: [] })
  })

  it('sans copie du dernier état synchronisé, tout champ différent est un conflit', () => {
    const split = splitSheetFields(null, { ...base, po: 15 }, { ...base, exhaustionLevel: 1 })
    expect(split.conflicts).toEqual(['exhaustionLevel', 'po'])
    expect(split.localOnly).toEqual([])
  })

  it('l\'ordre des clés d\'une colonne JSON ne compte pas', () => {
    expect(isSameValue({ diceRolls: true, ammunition: false }, { ammunition: false, diceRolls: true })).toBe(true)
    const server = { ...base, preferences: { ammunition: false, diceRolls: true } }
    expect(splitSheetFields(base, base, server)).toEqual({ conflicts: [], localOnly: [] })
  })

  it('la fiche fusionnée part du serveur et reprend les champs gardés de l\'appareil', () => {
    expect(mergeSheet({ currentHp: 25, notes: 'là-bas', po: 10 }, { currentHp: 22, notes: 'ici', po: 15 }, ['notes', 'po']))
      .toEqual({ currentHp: 25, notes: 'ici', po: 15 })
  })
})

describe('les changements en attente, par groupe', () => {
  const ops = [
    { endpoint: '/api/character_sheets/12', body: { currentHp: 22 } },
    { endpoint: '/api/character_sheets/12/spell-slots', body: [] },
    { endpoint: '/api/character_sheets/12/inventory/5', body: { quantity: 2 } },
    { endpoint: '/api/character_sheets/12/inventory', body: { itemId: 3 } },
    { endpoint: '/api/character_sheets/12/mystery', body: {} },
  ]

  it('range chaque opération dans son groupe, la fiche à part', () => {
    expect(ops.map(conflictGroupOf)).toEqual(['sheet', 'spell-slots', 'inventory', 'inventory', 'other'])
    expect([...pendingGroups(ops)]).toEqual([['spell-slots', 1], ['inventory', 2], ['other', 1]])
  })

  it('garde la fiche fusionnée et les groupes gardés, abandonne les autres', () => {
    const kept = keepQueuedOps(ops, { sheetBody: { currentHp: 25 }, droppedGroups: ['inventory'] })
    expect(kept.map(op => op.endpoint)).toEqual(['/api/character_sheets/12', '/api/character_sheets/12/spell-slots', '/api/character_sheets/12/mystery'])
    expect(kept[0]!.body).toEqual({ currentHp: 25 })
  })
})
