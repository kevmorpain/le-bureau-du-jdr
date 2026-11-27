<template>
  <UModal
    v-model:open="open"
    :dismissible="false"
  >
    <template #content>
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon
              name="i-heroicons:exclamation-triangle"
              class="size-5 text-warning"
            />
            <p class="font-semibold text-lg">
              Conflit de synchronisation
            </p>
          </div>
        </template>

        <div class="space-y-4">
          <p class="text-sm text-muted">
            Cette fiche a été modifiée ailleurs (un autre appareil) depuis ta dernière
            synchronisation. Choisis la version à conserver.
          </p>

          <div
            v-if="loading"
            class="text-sm text-muted text-center py-3"
          >
            Comparaison en cours…
          </div>

          <div
            v-else-if="diffs.length"
            class="rounded-lg border border-default overflow-hidden"
          >
            <div class="grid grid-cols-[1fr_auto_auto] text-xs font-semibold bg-elevated/50 px-3 py-1.5 gap-x-4">
              <span>Champ</span>
              <span class="text-right">Cet appareil</span>
              <span class="text-right">Serveur</span>
            </div>
            <div
              v-for="d in diffs"
              :key="d.label"
              class="grid grid-cols-[1fr_auto_auto] text-sm px-3 py-1.5 gap-x-4 border-t border-default"
            >
              <span class="text-muted">{{ d.label }}</span>
              <span class="text-right font-medium text-primary">{{ d.local }}</span>
              <span class="text-right font-medium">{{ d.server }}</span>
            </div>
          </div>

          <p
            v-else
            class="text-sm text-muted"
          >
            Les différences détaillées ne sont pas disponibles, mais l'état serveur diffère de
            tes modifications locales en attente.
          </p>
        </div>

        <template #footer>
          <div class="flex flex-col sm:flex-row justify-end gap-2">
            <UButton
              color="neutral"
              variant="outline"
              icon="i-heroicons:cloud-arrow-down"
              :loading="resolving"
              @click="resolve('server')"
            >
              Recharger le serveur
            </UButton>
            <UButton
              color="primary"
              icon="i-heroicons:cloud-arrow-up"
              :loading="resolving"
              @click="resolve('local')"
            >
              Garder mes modifs
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>

<script lang="ts" setup>
import { useSyncConflict } from '~/composables/useSyncConflict'

const props = defineProps<{
  characterSheetId: number
}>()

const emit = defineEmits<{
  resolved: []
}>()

const { conflicts, resolveConflict } = useOfflineSync()
const { status, fieldRows, groupRows, needsChoice, load, chooseAll, apply } = useSyncConflict(() => props.characterSheetId)

const open = defineModel<boolean>('open', { default: false })
const loading = computed(() => status.value === 'loading')
const resolving = ref(false)
const diffs = computed(() => [...fieldRows.value, ...groupRows.value])

async function resolve(choice: 'local' | 'server') {
  resolving.value = true
  try {
    if (choice === 'local') {
      chooseAll('local')
      await apply()
    } else {
      await resolveConflict(props.characterSheetId, 'server')
    }
    emit('resolved')
  } finally {
    resolving.value = false
    open.value = false
  }
}

// A change made on one side only goes through on its own: the window opens only when something needs a choice.
watch(
  () => conflicts.value.includes(props.characterSheetId),
  async (isConflict) => {
    if (!isConflict) return
    await load()
    if (status.value === 'ready' && !needsChoice.value) await resolve('local')
    else open.value = true
  },
)
</script>
