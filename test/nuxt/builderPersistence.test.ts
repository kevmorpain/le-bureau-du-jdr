import { describe, it, expect, beforeEach } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { flushPromises } from '@vue/test-utils'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { clearNuxtState } from '#app'
import { useCharacterBuilder } from '../../app/composables/useCharacterBuilder'

const LS_KEY = 'character-builder-state'

const mounted: { unmount: () => void }[] = []

async function mountBuilder() {
  let builder!: ReturnType<typeof useCharacterBuilder>
  const Host = defineComponent({
    setup() {
      builder = useCharacterBuilder()
      return () => h('div')
    },
  })
  mounted.push(await mountSuspended(Host))
  return builder
}

// Chargement complet de la page (rendue côté client, cf. routeRules) : la page précédente est
// démontée et l'état n'existe pas encore.
function freshPageLoad() {
  mounted.splice(0).forEach(w => w.unmount())
  clearNuxtState(['character-builder', 'character-builder-step'], { reset: false })
}

const stored = () => JSON.parse(localStorage.getItem(LS_KEY) ?? 'null')

beforeEach(() => {
  localStorage.clear()
  freshPageLoad()
})

describe('Builder — brouillon persisté en localStorage', () => {
  it('restaure le brouillon au chargement de la page, sans l\'écraser', async () => {
    // Brouillon d'une version antérieure : `featChoices` n'existait pas encore.
    localStorage.setItem(LS_KEY, JSON.stringify({ raceId: 'elf', classId: 'rogue', name: 'Brouillon', selectedLanguages: ['Elfique'] }))

    const { state, currentStepId } = await mountBuilder()

    expect(state.value).toMatchObject({ raceId: 'elf', classId: 'rogue', name: 'Brouillon', selectedLanguages: ['Elfique'] })
    expect(state.value.featChoices).toEqual({})
    expect(currentStepId.value).toBe('race')

    await flushPromises()
    expect(stored()).toMatchObject({ raceId: 'elf', classId: 'rogue', name: 'Brouillon' })

    state.value.name = 'Renommé'
    await nextTick()
    expect(stored()).toMatchObject({ raceId: 'elf', classId: 'rogue', name: 'Renommé' })
  })

  it('un brouillon illisible est ignoré', async () => {
    localStorage.setItem(LS_KEY, '{pas du json')

    const { state } = await mountBuilder()

    expect(state.value.raceId).toBeNull()
  })

  it('resetBuilder repart d\'un état vierge, même après des modifications en place', async () => {
    const builder = await mountBuilder()
    builder.resetBuilder()
    builder.state.value.selectedLanguages.push('Elfique')
    builder.state.value.customBackgroundSkills.push('athletics')
    builder.state.value.selectedToolProficiencies['Instrument de musique'] = 'Luth'
    builder.state.value.abilities.str = 15
    builder.state.value.pbScores.dex = 14

    builder.resetBuilder()

    expect(builder.state.value.selectedLanguages).toEqual([])
    expect(builder.state.value.customBackgroundSkills).toEqual([])
    expect(builder.state.value.selectedToolProficiencies).toEqual({})
    expect(builder.state.value.abilities.str).toBeNull()
    expect(builder.state.value.pbScores.dex).toBe(10)

    localStorage.clear()
    freshPageLoad()
    const { state } = await mountBuilder()
    expect(state.value.selectedLanguages).toEqual([])
    expect(state.value.abilities.str).toBeNull()
  })
})
