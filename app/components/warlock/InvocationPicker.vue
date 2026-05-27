<template>
  <div class="flex flex-col gap-3">
    <!-- Compteur -->
    <div class="flex items-center justify-between text-xs">
      <p class="font-bold uppercase tracking-widest text-muted">
        {{ pickerLabel }}
      </p>
      <span
        class="font-semibold"
        :class="modelValue.length >= maxCount ? 'text-green-400' : 'text-amber-400'"
      >
        {{ modelValue.length }}/{{ maxCount }}
      </span>
    </div>

    <!-- Loading -->
    <div v-if="!invocations" class="text-xs text-muted italic px-3 py-2">
      Chargement…
    </div>

    <!-- Liste -->
    <div v-else class="flex flex-col gap-2 max-h-[480px] overflow-y-auto pr-1">
      <button
        v-for="inv in sortedInvocations"
        :key="inv.id"
        type="button"
        class="text-left px-3 py-2.5 rounded-xl border transition-all"
        :class="cardClass(inv)"
        :disabled="!isSelectable(inv) && !modelValue.includes(inv.id)"
        @click="toggle(inv)"
      >
        <div class="flex items-start gap-2">
          <div class="flex-1 min-w-0">
            <div class="font-semibold text-sm flex items-center gap-2 flex-wrap">
              <span>{{ inv.name }}</span>
              <span v-if="inv.levelRequired > 1" class="text-xs font-mono px-2 py-0.5 rounded-full bg-(--ui-bg) border border-(--ui-border) text-muted">
                niv. {{ inv.levelRequired }}+
              </span>
              <span v-if="inv.prerequisites?.requiredPactBoon" class="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/30">
                Pacte · {{ pactLabel(inv.prerequisites.requiredPactBoon) }}
              </span>
              <span v-if="inv.prerequisites?.requiredSpellName" class="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                Sort · {{ inv.prerequisites.requiredSpellName }}
              </span>
            </div>
            <div class="text-xs text-muted mt-1 leading-snug">{{ inv.description }}</div>
            <div v-if="!isSelectable(inv) && !modelValue.includes(inv.id)" class="text-xs text-rose-400/80 mt-1.5 italic">
              {{ unmetReason(inv) }}
            </div>
          </div>
        </div>
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Effect } from '~~/server/db/schema/effects'
import type { FeaturePrerequisite } from '~~/server/db/schema/features'

interface Invocation {
  id: number
  name: string
  description: string | null
  levelRequired: number
  prerequisites: FeaturePrerequisite | null
  effects: Effect[]
}

const props = defineProps<{
  modelValue: number[]
  maxCount: number
  currentLevel: number
  pactBoon: 'chain' | 'blade' | 'tome' | null
  knownSpellNames: string[]
  knownInvocationIds: number[]
  // IDs à masquer de la liste (typiquement les invocations déjà acquises lors d'un level-up)
  excludedInvocationIds?: number[]
  pickerLabel?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number[]]
}>()

const pickerLabel = computed(() => props.pickerLabel ?? `Manifestations occultes — choisissez ${props.maxCount}`)

const { data: invocations } = useFetch<Invocation[]>('/api/invocations', {
  default: () => [],
})

const sortedInvocations = computed(() => {
  if (!invocations.value) return []
  const excluded = new Set(props.excludedInvocationIds ?? [])
  return [...invocations.value]
    .filter(inv => !excluded.has(inv.id))
    .sort((a, b) => {
      if (a.levelRequired !== b.levelRequired) return a.levelRequired - b.levelRequired
      return a.name.localeCompare(b.name, 'fr')
    })
})

function isSelectable(inv: Invocation): boolean {
  if (inv.levelRequired > props.currentLevel) return false
  if (inv.prerequisites?.requiredPactBoon && inv.prerequisites.requiredPactBoon !== props.pactBoon) return false
  if (inv.prerequisites?.requiredSpellName && !props.knownSpellNames.includes(inv.prerequisites.requiredSpellName)) return false
  if (inv.prerequisites?.requiredInvocationName) {
    const ok = invocations.value?.some(i => i.name === inv.prerequisites!.requiredInvocationName && props.knownInvocationIds.includes(i.id))
    if (!ok) return false
  }
  return true
}

function unmetReason(inv: Invocation): string {
  if (inv.levelRequired > props.currentLevel) return `Niveau d'occultiste ${inv.levelRequired} requis`
  if (inv.prerequisites?.requiredPactBoon && inv.prerequisites.requiredPactBoon !== props.pactBoon) {
    return `Pacte de la ${pactLabel(inv.prerequisites.requiredPactBoon)} requis`
  }
  if (inv.prerequisites?.requiredSpellName) return `Sort « ${inv.prerequisites.requiredSpellName} » requis`
  if (inv.prerequisites?.requiredInvocationName) return `Manifestation « ${inv.prerequisites.requiredInvocationName} » requise`
  return 'Prérequis non remplis'
}

function pactLabel(p: 'chain' | 'blade' | 'tome'): string {
  return p === 'chain' ? 'Chaîne' : p === 'blade' ? 'Lame' : 'Tome'
}

function cardClass(inv: Invocation): string {
  const selected = props.modelValue.includes(inv.id)
  const selectable = isSelectable(inv)
  if (selected) return 'border-violet-500/60 bg-violet-500/10 text-violet-400'
  if (!selectable) return 'border-(--ui-border) bg-(--ui-bg) text-muted opacity-50 cursor-not-allowed'
  if (props.modelValue.length >= props.maxCount) return 'border-(--ui-border) bg-(--ui-bg-elevated) text-muted/60 cursor-not-allowed'
  return 'border-(--ui-border) bg-(--ui-bg-elevated) text-(--ui-text) hover:border-violet-500/40 cursor-pointer'
}

function toggle(inv: Invocation) {
  const list = [...props.modelValue]
  const idx = list.indexOf(inv.id)
  if (idx >= 0) {
    list.splice(idx, 1)
    emit('update:modelValue', list)
    return
  }
  if (!isSelectable(inv)) return
  if (list.length >= props.maxCount) return
  list.push(inv.id)
  emit('update:modelValue', list)
}
</script>
