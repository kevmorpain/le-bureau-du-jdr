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
const props = defineProps<{
  characterSheetId: number
}>()

const emit = defineEmits<{
  resolved: []
}>()

const { conflicts, resolveConflict } = useOfflineSync()

const open = ref(false)
const loading = ref(false)
const resolving = ref(false)
const diffs = ref<Array<{ label: string, local: string, server: string }>>([])

type SlotState = { current: number, max: number }
type SnapshotSlots = { spellcasting: Record<number, SlotState>, pact_magic: Record<number, SlotState> }

const sumLevels = (sheet: { classes?: Array<{ level: number }> } | null): number =>
  (sheet?.classes ?? []).reduce((n, c) => n + (c.level ?? 0), 0)

const usedFromSnapshot = (slots: SnapshotSlots | null): number => {
  if (!slots) return 0
  let used = 0
  for (const type of ['spellcasting', 'pact_magic'] as const) {
    for (const lvl of Object.values(slots[type] ?? {})) used += Math.max(0, lvl.max - lvl.current)
  }
  return used
}

const usedFromServer = (sheet: { spellSlots?: Array<{ used: number }> } | null): number =>
  (sheet?.spellSlots ?? []).reduce((n, s) => n + (s.used ?? 0), 0)

function buildDiffs(local: Record<string, unknown>, server: Record<string, unknown>, localSlots: SnapshotSlots | null) {
  const rows: Array<{ label: string, local: string, server: string }> = []
  const yn = (v: unknown) => (v ? 'Oui' : 'Non')

  const scalars: Array<{ key: string, label: string, fmt?: (v: unknown) => string }> = [
    { key: 'currentHp', label: 'PV actuels' },
    { key: 'maxHp', label: 'PV max' },
    { key: 'temporaryHp', label: 'PV temporaires' },
    { key: 'exhaustionLevel', label: 'Épuisement' },
    { key: 'inspiration', label: 'Inspiration', fmt: yn },
    { key: 'concentratingSpellId', label: 'Concentration', fmt: v => (v ? 'En cours' : 'Aucune') },
  ]

  for (const { key, label, fmt } of scalars) {
    const l = local[key]
    const s = server[key]
    if (l === undefined) continue
    if (String(l) !== String(s)) {
      rows.push({ label, local: fmt ? fmt(l) : String(l), server: fmt ? fmt(s) : String(s) })
    }
  }

  const localLvl = sumLevels(local as { classes?: Array<{ level: number }> })
  const serverLvl = sumLevels(server as { classes?: Array<{ level: number }> })
  if (localLvl && localLvl !== serverLvl) rows.push({ label: 'Niveau total', local: String(localLvl), server: String(serverLvl) })

  const localUsed = usedFromSnapshot(localSlots)
  const serverUsed = usedFromServer(server as { spellSlots?: Array<{ used: number }> })
  if (localSlots && localUsed !== serverUsed) {
    rows.push({ label: 'Emplacements de sorts dépensés', local: String(localUsed), server: String(serverUsed) })
  }

  return rows
}

async function computeDiff() {
  loading.value = true
  diffs.value = []
  try {
    const server = await $fetch<Record<string, unknown>>(`/api/character_sheets/${props.characterSheetId}`)
    const local = readSnapshot<Record<string, unknown>>(props.characterSheetId) ?? {}
    const localSlots = readSnapshot<SnapshotSlots>(props.characterSheetId, 'slots')
    diffs.value = buildDiffs(local, server, localSlots)
  }
  catch {
    // Réseau de nouveau indisponible : on laisse le message générique.
  }
  finally {
    loading.value = false
  }
}

watch(
  () => conflicts.value.includes(props.characterSheetId),
  async (isConflict) => {
    if (isConflict) {
      open.value = true
      await computeDiff()
    }
    else {
      open.value = false
    }
  },
)

async function resolve(choice: 'local' | 'server') {
  resolving.value = true
  try {
    await resolveConflict(props.characterSheetId, choice)
    emit('resolved')
  }
  finally {
    resolving.value = false
    open.value = false
  }
}
</script>
