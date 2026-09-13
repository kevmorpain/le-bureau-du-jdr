<template>
  <div class="flex flex-col gap-3">
    <!-- Compteur -->
    <div class="flex items-center justify-between text-xs">
      <p class="font-bold uppercase tracking-widest text-muted">
        {{ pickerLabel ?? `Métamagie — choisissez ${maxCount}` }}
      </p>
      <span
        class="font-semibold"
        :class="modelValue.length >= maxCount ? 'text-green-400' : 'text-amber-400'"
      >
        {{ modelValue.length }}/{{ maxCount }}
      </span>
    </div>

    <div v-if="!options" class="text-xs text-muted italic px-3 py-2">
      Chargement…
    </div>

    <div v-else class="flex flex-col gap-2 max-h-[480px] overflow-y-auto pr-1">
      <button
        v-for="opt in visibleOptions"
        :key="opt.id"
        type="button"
        class="text-left px-3 py-2.5 rounded-xl border transition-all"
        :class="cardClass(opt.id)"
        @click="toggle(opt.id)"
      >
        <div class="font-semibold text-sm">{{ opt.name }}</div>
        <div class="text-xs text-muted mt-1 leading-snug">{{ opt.description }}</div>
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
interface MetamagicOption {
  id: number
  name: string
  description: string | null
}

const props = defineProps<{
  modelValue: number[]
  maxCount: number
  // Options à masquer (typiquement les métamagies déjà connues lors d'un level-up).
  excludedIds?: number[]
  pickerLabel?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number[]]
}>()

const { data: options } = useFetch<MetamagicOption[]>('/api/catalog/metamagic', {
  default: () => [],
})

const visibleOptions = computed(() => {
  const excluded = new Set(props.excludedIds ?? [])
  return (options.value ?? []).filter(o => !excluded.has(o.id))
})

function cardClass(id: number): string {
  const selected = props.modelValue.includes(id)
  if (selected) return 'border-violet-500/60 bg-violet-500/10 text-violet-400'
  if (props.modelValue.length >= props.maxCount) return 'border-(--ui-border) bg-(--ui-bg-elevated) text-muted/60 cursor-not-allowed'
  return 'border-(--ui-border) bg-(--ui-bg-elevated) text-(--ui-text) hover:border-violet-500/40 cursor-pointer'
}

function toggle(id: number) {
  const list = [...props.modelValue]
  const idx = list.indexOf(id)
  if (idx >= 0) {
    list.splice(idx, 1)
    emit('update:modelValue', list)
    return
  }
  if (list.length >= props.maxCount) return
  list.push(id)
  emit('update:modelValue', list)
}
</script>
