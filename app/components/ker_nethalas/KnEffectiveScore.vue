<template>
  <UPopover v-if="hasDetail">
    <button
      type="button"
      class="flex items-center gap-1.5 text-sm tabular-nums"
      :aria-label="`${name} : score effectif ${check.effective}, détail du calcul`"
    >
      <span
        class="font-semibold"
        :class="effectiveClass"
      >
        {{ check.effective }}
      </span>
      <UBadge
        v-if="check.rollMode !== 'normal'"
        :color="check.rollMode === 'advantage' ? 'success' : check.rollMode === 'disadvantage' ? 'error' : 'warning'"
        variant="subtle"
        size="xs"
        :label="MODE_LABELS[check.rollMode]"
      />
    </button>

    <template #content>
      <div class="space-y-1 p-3 text-sm">
        <p class="font-medium">
          {{ name }}
        </p>
        <p class="flex justify-between gap-6">
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

  <span
    v-else
    class="text-sm tabular-nums text-muted"
  >
    {{ check.effective }}
  </span>
</template>

<script lang="ts" setup>
import type { KnResolvedCheck } from '~~/shared/ker-nethalas/resolve'

const props = defineProps<{
  check: KnResolvedCheck
  name: string
}>()

const { labelText, signed } = useKnLabels()

const MODE_LABELS = { advantage: 'Avantage', disadvantage: 'Désavantage', both: 'Av. + Dés.' } as const

const hasDetail = computed(() =>
  props.check.modifiers.length > 0 || props.check.advantages.length > 0 || props.check.disadvantages.length > 0,
)

const effectiveClass = computed(() => {
  if (props.check.effective < props.check.base) return 'text-error'
  if (props.check.effective > props.check.base) return 'text-success'
  return ''
})
</script>
