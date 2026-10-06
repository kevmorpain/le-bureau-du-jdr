import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import SyncStatus from '../../app/components/character_sheet/SyncStatus.vue'
import { autoSaveStatusKey, type AutoSaveStatus } from '../../app/composables/useAutoSave'

const mountWith = (status: AutoSaveStatus) =>
  mountSuspended(SyncStatus, { global: { provide: { [autoSaveStatusKey as symbol]: ref(status) } } })

describe('SyncStatus — état de la sauvegarde de la fiche', () => {
  it('« À jour » quand rien n\'est en cours', async () => {
    expect((await mountWith('idle')).text()).toContain('À jour')
  })

  it('« Enregistrement… » pendant le debounce et le PUT', async () => {
    expect((await mountWith('saving')).text()).toContain('Enregistrement…')
  })

  it('« Enregistré » juste après un PUT réussi', async () => {
    expect((await mountWith('saved')).text()).toContain('Enregistré')
  })

  it('signale l\'échec d\'un PUT refusé par le serveur', async () => {
    expect((await mountWith('error')).text()).toContain('Échec de l\'enregistrement')
  })
})
