<template>
  <UPopover>
    <button
      type="button"
      class="flex items-center gap-1.5 text-sm tabular-nums"
      :aria-label="`${name} : score effectif ${check.effective}${modeLabel ? `, ${modeLabel}` : ''}, détail du calcul`"
    >
      <span
        class="font-semibold"
        :class="effectiveClass"
      >
        {{ check.effective }}
      </span>
      <span
        v-if="check.rollMode !== 'normal'"
        class="text-xs"
        :class="MODES[check.rollMode].class"
        :title="modeLabel"
        aria-hidden="true"
      >
        {{ MODES[check.rollMode].symbol }}
      </span>
    </button>

    <template #content>
      <div class="space-y-1 p-3 text-sm">
        <p class="font-medium">
          {{ name }}
        </p>
        <KnNumberField
          v-if="base !== undefined"
          v-model="base"
          label="Score de base"
          :min="min ?? 0"
          :max="max ?? 100"
          class="w-32"
        />
        <p
          v-else
          class="flex justify-between gap-6"
        >
          <span class="text-muted">Base</span>
          <span class="tabular-nums">{{ check.base }}</span>
        </p>
        <p
          v-for="(modifier, index) in check.modifiers"
          :key="index"
          class="flex justify-between gap-6"
        >
          <span>{{ labelText(modifier.source.label) }}</span>
          <span
            class="tabular-nums"
            :class="modifier.amount < 0 ? 'text-error' : 'text-success'"
          >
            {{ signed(modifier.amount) }}
          </span>
        </p>
        <p class="flex justify-between gap-6 border-t border-default pt-1 font-semibold">
          <span>Effectif</span>
          <span class="tabular-nums">{{ check.effective }}</span>
        </p>
        <p
          v-if="check.advantages.length"
          class="text-success"
        >
          Avantage : {{ check.advantages.map(s => labelText(s.label)).join(', ') }}
        </p>
        <p
          v-if="check.disadvantages.length"
          class="text-error"
        >
          Désavantage : {{ check.disadvantages.map(s => labelText(s.label)).join(', ') }}
        </p>
        <p
          v-if="check.rollMode === 'both'"
          class="text-warning"
        >
          Les deux s'appliquent : le livre ne précise pas comment les combiner.
        </p>
      </div>
    </template>
  </UPopover>
</template>

<script lang="ts" setup>
import type { KnResolvedCheck } from '~~/shared/ker-nethalas/resolve'

const props = defineProps<{
  check: KnResolvedCheck
  name: string
  min?: number
  max?: number
}>()

const base = defineModel<number>('base')

const { labelText, signed } = useKnLabels()

const MODES = {
  advantage: { symbol: '▲', label: 'Avantage', class: 'text-success' },
  disadvantage: { symbol: '▼', label: 'Désavantage', class: 'text-error' },
  both: { symbol: '◆', label: 'Avantage et Désavantage', class: 'text-warning' },
} as const

const modeLabel = computed(() => props.check.rollMode === 'normal' ? '' : MODES[props.check.rollMode].label)

const effectiveClass = computed(() => {
  if (props.check.effective < props.check.base) return 'text-error'
  if (props.check.effective > props.check.base) return 'text-success'
  return ''
})
</script>
