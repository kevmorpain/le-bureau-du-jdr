import { describe, it, expect } from 'vitest'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import MagicItemMeta from '../../app/components/character_sheet/MagicItemMeta.vue'
import { baseScores, inventoryEntry as entry, mountSheet as mount } from './fixtures/mountSheet'

// O1 : un personnage ne s'harmonise pas à plus de trois objets. La limite se garde côté fiche : un refus du serveur au
// rejeu resterait en tête de la file hors-ligne.

const puts: number[] = []

const ring = (sheetId: number, id: number, attuned: boolean) =>
  entry(sheetId, id, `Anneau ${id}`, 'equipment', {}, [], { attuned, requiresAttunement: true })

const scenario = (attunedIds: number[]) => ({
  scores: baseScores(10, 10, 10, 10),
  worn: (sheetId: number) => {
    for (const id of [1, 2, 3, 4]) {
      registerEndpoint(`/api/character_sheets/${sheetId}/inventory/${id}`, {
        method: 'PUT',
        handler: () => {
          puts.push(id)
          return {}
        },
      })
    }
    return [1, 2, 3, 4].map(id => ring(sheetId, id, attunedIds.includes(id)))
  },
})

const attunedOf = (s: Awaited<ReturnType<typeof mount>>, id: number) => s.inventory.value.find(e => e.id === id)!.attuned

describe('fiche — limite d\'harmonisation', () => {
  it('un quatrième objet ne s\'harmonise pas : rien ne change, rien n\'est envoyé', async () => {
    puts.length = 0
    const s = await mount(scenario([1, 2, 3]))
    expect(s.attunedCount.value).toBe(3)
    await s.toggleAttuned(4)
    expect(attunedOf(s, 4)).toBe(false)
    expect(puts).toEqual([])
  })

  it('retirer l\'harmonisation d\'un objet libère la place d\'un autre', async () => {
    puts.length = 0
    const s = await mount(scenario([1, 2, 3]))
    await s.toggleAttuned(1)
    expect(attunedOf(s, 1)).toBe(false)
    await s.toggleAttuned(4)
    expect(attunedOf(s, 4)).toBe(true)
    expect(puts).toEqual([1, 4])
  })

  it('sous la limite, on s\'harmonise librement', async () => {
    puts.length = 0
    const s = await mount(scenario([1, 2]))
    await s.toggleAttuned(3)
    expect(s.attunedCount.value).toBe(3)
    expect(puts).toEqual([3])
  })

  it('une fiche déjà au-dessus de la limite peut seulement retirer des harmonisations', async () => {
    puts.length = 0
    const s = await mount({ ...scenario([1, 2, 3, 4]), worn: (sheetId: number) => scenario([1, 2, 3, 4]).worn(sheetId) })
    await s.toggleAttuned(4)
    expect(attunedOf(s, 4)).toBe(false)
    await s.toggleAttuned(4)
    expect(attunedOf(s, 4)).toBe(false)
    expect(puts).toEqual([4])
  })
})

describe('interrupteur d\'harmonisation', () => {
  const mountMeta = (attuned: boolean, attunementFull: boolean) =>
    mountSuspended(MagicItemMeta, {
      props: { entry: ring(1, 1, attuned) as never, attunementFull },
      global: { stubs: { UTooltip: { template: '<div><slot /></div>' } } },
    })

  it('limite atteinte : un objet non harmonisé ne peut plus l\'être', async () => {
    const wrapper = await mountMeta(false, true)
    expect(wrapper.find('[role="switch"]').attributes('disabled')).toBeDefined()
  })

  it('limite atteinte : un objet harmonisé peut toujours être libéré', async () => {
    const wrapper = await mountMeta(true, true)
    expect(wrapper.find('[role="switch"]').attributes('disabled')).toBeUndefined()
  })

  it('sous la limite, l\'interrupteur est libre', async () => {
    const wrapper = await mountMeta(false, false)
    expect(wrapper.find('[role="switch"]').attributes('disabled')).toBeUndefined()
  })
})
