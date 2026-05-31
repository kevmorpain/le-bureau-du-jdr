import { describe, it, expect, beforeEach } from 'vitest'
import {
  enqueueMutation,
  readQueue,
  removeMutation,
  clearQueue,
  listQueuedCharacterIds,
  totalPending,
  hasPending,
  readSnapshot,
  writeSnapshot,
  type QueuedMutation,
} from '../../app/utils/offlineQueue'

// localStorage minimal pour l'environnement node du projet `unit`.
class LocalStorageMock {
  private store = new Map<string, string>()
  get length() { return this.store.size }
  clear() { this.store.clear() }
  getItem(k: string) { return this.store.has(k) ? this.store.get(k)! : null }
  setItem(k: string, v: string) { this.store.set(k, String(v)) }
  removeItem(k: string) { this.store.delete(k) }
  key(i: number) { return [...this.store.keys()][i] ?? null }
}

let counter = 0
const op = (over: Partial<QueuedMutation> = {}): QueuedMutation => ({
  id: over.id ?? `op-${++counter}`,
  ts: over.ts ?? Date.now(),
  characterId: over.characterId ?? 1,
  endpoint: over.endpoint ?? '/api/character_sheets/1',
  method: over.method ?? 'PUT',
  body: over.body,
  dedupeKey: over.dedupeKey,
  baseVersion: over.baseVersion,
  label: over.label,
})

describe('offlineQueue', () => {
  beforeEach(() => {
    globalThis.localStorage = new LocalStorageMock() as unknown as Storage
  })

  it('enfile et relit dans l\'ordre', () => {
    enqueueMutation(op({ id: 'a' }))
    enqueueMutation(op({ id: 'b' }))
    expect(readQueue(1).map(o => o.id)).toEqual(['a', 'b'])
  })

  it('dédoublonne les ops « remplacement complet » (même dedupeKey → dernière gagne)', () => {
    enqueueMutation(op({ id: '1', dedupeKey: 'sheet', body: { currentHp: 10 } }))
    enqueueMutation(op({ id: '2', dedupeKey: 'sheet', body: { currentHp: 20 } }))
    const q = readQueue(1)
    expect(q).toHaveLength(1)
    expect(q[0]!.id).toBe('2')
    expect((q[0]!.body as { currentHp: number }).currentHp).toBe(20)
  })

  it('garde les ops incrémentales distinctes (sans dedupeKey)', () => {
    enqueueMutation(op())
    enqueueMutation(op())
    expect(readQueue(1)).toHaveLength(2)
  })

  it('dedupeKey par entité : dernière action conservée, autres entités intactes', () => {
    enqueueMutation(op({ id: 's1', dedupeKey: 'spell:42', method: 'PUT' }))
    enqueueMutation(op({ id: 's2', dedupeKey: 'spell:99', method: 'PUT' }))
    enqueueMutation(op({ id: 's3', dedupeKey: 'spell:42', method: 'DELETE' }))
    const q = readQueue(1)
    expect(q.map(o => o.id)).toEqual(['s2', 's3'])
    expect(q.find(o => o.dedupeKey === 'spell:42')!.method).toBe('DELETE')
  })

  it('removeMutation retire par id', () => {
    enqueueMutation(op({ id: 'a' }))
    enqueueMutation(op({ id: 'b' }))
    removeMutation(1, 'a')
    expect(readQueue(1).map(o => o.id)).toEqual(['b'])
  })

  it('clearQueue vide la file d\'un perso', () => {
    enqueueMutation(op({ id: 'a' }))
    clearQueue(1)
    expect(readQueue(1)).toEqual([])
    expect(hasPending(1)).toBe(false)
  })

  it('listQueuedCharacterIds / totalPending / hasPending agrègent plusieurs persos', () => {
    enqueueMutation(op({ characterId: 1 }))
    enqueueMutation(op({ characterId: 1 }))
    enqueueMutation(op({ characterId: 7 }))
    expect(listQueuedCharacterIds().sort((a, b) => a - b)).toEqual([1, 7])
    expect(totalPending()).toBe(3)
    expect(hasPending(1)).toBe(true)
    expect(hasPending(2)).toBe(false)
  })

  it('conserve le baseVersion de la première op (garde-fou anti-écrasement)', () => {
    enqueueMutation(op({ id: '1', dedupeKey: 'sheet', baseVersion: 'v1' }))
    enqueueMutation(op({ id: '2', dedupeKey: 'sheet', baseVersion: 'v1' }))
    expect(readQueue(1)[0]!.baseVersion).toBe('v1')
  })

  it('snapshot : aller-retour + suffixes isolés, sans polluer la file', () => {
    writeSnapshot(1, { currentHp: 5 })
    writeSnapshot(1, { spellcasting: { 1: { max: 2, current: 1 } } }, 'slots')
    expect(readSnapshot<{ currentHp: number }>(1)!.currentHp).toBe(5)
    expect(readSnapshot<{ spellcasting: Record<number, { current: number }> }>(1, 'slots')!.spellcasting[1]!.current).toBe(1)
    expect(hasPending(1)).toBe(false)
  })
})
