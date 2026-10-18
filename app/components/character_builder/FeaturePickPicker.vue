<template>
  <div class="rounded-xl border border-red-500/40 bg-(--ui-bg-elevated) p-4">
    <div class="flex items-center gap-2 mb-3">
      <p class="text-xs font-semibold text-red-400">
        {{ title }}
      </p>
      <span
        class="text-xs font-semibold"
        :class="picks.length === count ? 'text-green-400' : 'text-muted'"
      >
        {{ picks.length }}/{{ count }}
      </span>
    </div>

    <div v-if="!options.length" class="text-xs text-muted italic px-3 py-2">
      Chargement…
    </div>

    <div v-else class="flex flex-col gap-2">
      <button
        v-for="opt in visibleOptions"
        :key="opt.id"
        type="button"
        class="text-left px-3 py-2.5 rounded-xl border transition-all"
        :class="cardClass(opt.id)"
        @click="toggle(opt.id)"
      >
        <div class="font-semibold text-sm">
          {{ opt.name }}
        </div>
        <div
          v-if="opt.description"
          class="text-xs text-muted mt-1 leading-snug"
        >
          {{ opt.description }}
        </div>
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
// Choix d'une ou plusieurs options d'un groupe de features (2ᵉ style de combat, manœuvres). Les options viennent du point de
// choix (identifiants) ; leurs noms et descriptions, du catalogue. Une option déjà prise ailleurs (`excluded*`) est masquée.
const props = defineProps<{
  title: string
  count: number
  optionIds: number[]
  excludedIds?: number[]
  excludedNames?: string[]
}>()
const picks = defineModel<number[]>({ default: () => [] })

const { data } = useFetch<Array<{ id: number, name: string, description: string | null }>>('/api/catalog/feature-options', {
  query: { ids: computed(() => props.optionIds.join(',')) },
  default: () => [],
})
const options = computed(() => data.value ?? [])

const visibleOptions = computed(() => {
  const excludedIds = new Set(props.excludedIds ?? [])
  const excludedNames = new Set(props.excludedNames ?? [])
  return options.value.filter(o => !excludedIds.has(o.id) && !excludedNames.has(o.name))
})

// Une option devenue indisponible (le premier style choisi change) ne reste pas cochée.
watch(visibleOptions, (visible) => {
  if (!options.value.length) return
  const ids = new Set(visible.map(o => o.id))
  const kept = picks.value.filter(id => ids.has(id))
  if (kept.length !== picks.value.length) picks.value = kept
})

function cardClass(id: number): string {
  if (picks.value.includes(id)) return 'border-red-500/60 bg-red-500/10 text-red-400'
  if (picks.value.length >= props.count) return 'border-(--ui-border) bg-(--ui-bg-elevated) text-muted/60 cursor-not-allowed'
  return 'border-(--ui-border) bg-(--ui-bg-elevated) text-(--ui-text) hover:border-red-500/40 cursor-pointer'
}

function toggle(id: number) {
  if (picks.value.includes(id)) picks.value = picks.value.filter(x => x !== id)
  else if (picks.value.length < props.count) picks.value = [...picks.value, id]
}
</script>
