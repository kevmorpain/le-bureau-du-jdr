<template>
  <div class="rounded-xl border border-red-500/40 bg-(--ui-bg-elevated) p-4">
    <div class="flex items-center gap-2 mb-3">
      <p class="text-xs font-semibold text-red-400">
        {{ title }}
      </p>
      <span
        class="text-xs font-semibold"
        :class="picks.length === effectiveCount ? 'text-green-400' : 'text-muted'"
      >
        {{ picks.length }}/{{ effectiveCount }}
      </span>
    </div>

    <div
      v-if="replaceable.length"
      class="mb-3"
    >
      <p class="text-xs text-muted mb-2">
        Remplacer une option déjà prise (facultatif) :
      </p>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="opt in replaceable"
          :key="opt.id"
          type="button"
          class="px-3 py-1.5 rounded-lg border text-xs transition-all"
          :class="replaced === opt.id
            ? 'border-amber-500/60 bg-amber-500/10 text-amber-400 font-semibold line-through'
            : 'border-(--ui-border) bg-(--ui-bg-elevated) text-muted hover:border-amber-500/40 cursor-pointer'"
          @click="replaced = replaced === opt.id ? null : opt.id"
        >
          {{ opt.name }}
        </button>
      </div>
    </div>

    <div
      v-if="!options.length"
      class="text-xs text-muted italic px-3 py-2"
    >
      Chargement…
    </div>

    <div
      v-else
      class="flex flex-col gap-2"
    >
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
// `replaceableIds` : les options déjà prises que l'on peut échanger ; en échanger une ajoute une option à choisir.
const props = defineProps<{
  title: string
  count: number
  optionIds: number[]
  excludedIds?: number[]
  excludedNames?: string[]
  replaceableIds?: number[]
}>()
const picks = defineModel<number[]>({ default: () => [] })
const replaced = defineModel<number | null>('replaced', { default: null })

const { data } = useFetch<Array<{ id: number, name: string, description: string | null }>>('/api/catalog/feature-options', {
  query: { ids: computed(() => props.optionIds.join(',')) },
  default: () => [],
})
const options = computed(() => data.value ?? [])

const effectiveCount = computed(() => props.count + (replaced.value != null ? 1 : 0))

const visibleOptions = computed(() => {
  const excludedIds = new Set(props.excludedIds ?? [])
  const excludedNames = new Set(props.excludedNames ?? [])
  return options.value.filter(o => !excludedIds.has(o.id) && !excludedNames.has(o.name))
})
const replaceable = computed(() => options.value.filter(o => (props.replaceableIds ?? []).includes(o.id)))

// Une option devenue indisponible (le premier style choisi change) ne reste pas cochée ; ni un choix en trop.
watch([visibleOptions, effectiveCount], ([visible, max]) => {
  if (!options.value.length) return
  const ids = new Set(visible.map(o => o.id))
  const kept = picks.value.filter(id => ids.has(id)).slice(0, max)
  if (kept.length !== picks.value.length) picks.value = kept
})

function cardClass(id: number): string {
  if (picks.value.includes(id)) return 'border-red-500/60 bg-red-500/10 text-red-400'
  if (picks.value.length >= effectiveCount.value) return 'border-(--ui-border) bg-(--ui-bg-elevated) text-muted/60 cursor-not-allowed'
  return 'border-(--ui-border) bg-(--ui-bg-elevated) text-(--ui-text) hover:border-red-500/40 cursor-pointer'
}

function toggle(id: number) {
  if (picks.value.includes(id)) picks.value = picks.value.filter(x => x !== id)
  else if (picks.value.length < effectiveCount.value) picks.value = [...picks.value, id]
}
</script>
