<template>
  <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
    <span
      v-if="label"
      :id="labelId"
      class="ds-label"
    >{{ label }}</span>
    <span
      v-if="showCount"
      class="text-xs text-ds-mute"
    >{{ model }} sur {{ max }}</span>
    <div
      role="group"
      class="flex items-center"
      :aria-labelledby="label ? labelId : undefined"
      :aria-label="label ? undefined : ariaLabel"
    >
      <component
        :is="readonly ? 'span' : 'button'"
        v-for="index in max"
        :key="index"
        :type="readonly ? undefined : 'button'"
        class="flex size-6 items-center justify-center"
        :class="{ 'cursor-pointer focus-visible:outline-2 focus-visible:outline-ds-gold': !readonly }"
        :aria-label="readonly ? undefined : `${index} sur ${max}`"
        :aria-pressed="readonly ? undefined : index <= model"
        @click="readonly ? undefined : toggle(index)"
      >
        <DsDiamond
          :state="stateOf(index)"
          :color="color"
        />
      </component>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { DsDiamondState } from './DsDiamond.vue'

const props = withDefaults(defineProps<{
  max: number
  label?: string
  ariaLabel?: string
  showCount?: boolean
  readonly?: boolean
  // Parmi les cases pleines, les dernières sont rendues (repos, aperçu) ; après elles, des cases possibles selon le jet.
  gained?: number
  possible?: number
  color?: 'gold' | 'gain' | 'bad'
}>(), {
  label: undefined,
  ariaLabel: undefined,
  showCount: false,
  readonly: false,
  gained: 0,
  possible: 0,
  color: undefined,
})

const model = defineModel<number>({ default: 0 })
const labelId = useId()

const stateOf = (index: number): DsDiamondState => {
  if (index <= model.value - props.gained) return 'full'
  if (index <= model.value) return 'gain'
  if (index <= model.value + props.possible) return 'maybe'
  return 'empty'
}

// Toucher la dernière case pleine la vide ; toucher une autre case remplit jusqu'à elle.
const toggle = (index: number) => {
  model.value = index === model.value ? index - 1 : index
}
</script>
