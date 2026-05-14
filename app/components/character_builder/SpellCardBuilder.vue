<template>
  <div
    class="rounded-lg border transition-all overflow-hidden cursor-pointer"
    :class="selected
      ? 'border-amber-500 bg-amber-500/10'
      : 'border-(--ui-border) bg-(--ui-bg-elevated) hover:border-amber-500/40'"
    @click="$emit('click')"
  >
    <!-- Ligne principale -->
    <div class="flex items-center gap-2 px-2.5 py-2">
      <!-- Dot sélection -->
      <span
        class="w-2.5 h-2.5 rounded-full shrink-0 border-1.5 transition-colors"
        :class="selected ? 'bg-amber-500 border-amber-500' : 'bg-transparent border-muted'"
      />

      <div class="flex-1 min-w-0">
        <div class="font-semibold text-xs text-(--ui-text)">{{ spell.name }}</div>
        <div class="flex gap-2 mt-0.5 flex-wrap">
          <span class="text-xs" :style="`color: ${schoolColor}`">{{ spell.school?.name ?? '' }}</span>
          <span class="text-xs text-muted">{{ rangeDisplay }}</span>
          <span v-if="spell.concentration" class="text-xs text-amber-400">Conc.</span>
          <span v-if="spell.ritual" class="text-xs text-emerald-400">Rituel</span>
        </div>
      </div>

      <!-- Toggle description -->
      <button
        class="text-muted text-xs px-1 shrink-0 transition-transform"
        :class="expanded ? 'rotate-180' : ''"
        @click.stop="expanded = !expanded"
      >▾</button>
    </div>

    <!-- Description -->
    <div v-if="expanded" class="px-7 pb-2.5 text-xs text-muted leading-relaxed">
      {{ spell.description ?? 'Aucune description.' }}
    </div>
  </div>
</template>

<script lang="ts" setup>
const SCHOOL_COLORS: Record<string, string> = {
  'Abjuration': '#60a5fa',
  'Invocation': '#34d399',
  'Divination': '#a78bfa',
  'Enchantement': '#f472b6',
  'Évocation': '#f97316',
  'Illusion': '#818cf8',
  'Nécromancie': '#6b7280',
  'Transmutation': '#fbbf24',
}

const props = defineProps<{
  spell: {
    id: number
    name: string
    level: number
    range: number | null
    concentration: boolean
    ritual: boolean
    description: string | null
    school: { name: string } | null
  }
  selected: boolean
}>()

defineEmits<{ click: [] }>()

const expanded = ref(false)

const schoolColor = computed(() =>
  SCHOOL_COLORS[props.spell.school?.name ?? ''] ?? '#9ca3af',
)

const rangeDisplay = computed(() => {
  const r = props.spell.range
  if (r == null) return ''
  if (r === 0) return 'contact'
  return `${r}m`
})
</script>
