<template>
  <UPopover v-if="vital.steps.length">
    <button
      type="button"
      class="flex items-center gap-1 text-sm tabular-nums"
      :aria-label="`${name} : maximum effectif ${vital.effective}, détail du calcul`"
    >
      <span class="text-muted">→</span>
      <span
        class="font-semibold"
        :class="vital.effective < vital.base ? 'text-error' : 'text-success'"
      >
        {{ vital.effective }}
      </span>
    </button>

    <template #content>
      <div class="space-y-1 p-3 text-sm">
        <p class="font-medium">
          {{ name }} maximal
        </p>
        <p class="flex justify-between gap-6">
          <span class="text-muted">Base</span>
          <span class="tabular-nums">{{ vital.base }}</span>
        </p>
        <p
          v-for="(step, index) in vital.steps"
          :key="index"
          class="flex justify-between gap-6"
        >
          <span>{{ labelText(step.source.label) }}{{ step.kind === 'half' ? ' (moitié, arrondie vers le haut)' : '' }}</span>
          <span class="tabular-nums text-error">{{ signed(step.amount) }}</span>
        </p>
        <p class="flex justify-between gap-6 border-t border-default pt-1 font-semibold">
          <span>Effectif</span>
          <span class="tabular-nums">{{ vital.effective }}</span>
        </p>
      </div>
    </template>
  </UPopover>

  <span v-else />
</template>

<script lang="ts" setup>
import type { KnResolvedVital } from '~~/shared/ker-nethalas/resolve'

defineProps<{
  vital: KnResolvedVital
  name: string
}>()

const { labelText, signed } = useKnLabels()
</script>
