<template>
  <div class="counter">
    <span
      v-if="label"
      :id="labelId"
      class="ds-label"
    >{{ label }}</span>
    <span
      v-if="showCount"
      class="counter__count"
    >{{ $t('ds.count_of', { value: model, max }) }}</span>
    <div
      role="group"
      class="counter__cells"
      :aria-labelledby="label ? labelId : undefined"
      :aria-label="label ? undefined : ariaLabel"
    >
      <component
        :is="readonly ? 'span' : 'button'"
        v-for="index in max"
        :key="index"
        :type="readonly ? undefined : 'button'"
        class="counter__cell"
        :aria-label="readonly ? undefined : $t('ds.count_of', { value: index, max })"
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
import type { DsDiamondColor, DsDiamondState } from './DsDiamond.vue'

const {
  max,
  label,
  ariaLabel,
  showCount = false,
  readonly = false,
  regained = 0,
  possible = 0,
  color,
} = defineProps<{
  max: number
  label?: string
  ariaLabel?: string
  showCount?: boolean
  readonly?: boolean
  regained?: number
  possible?: number
  color?: DsDiamondColor
}>()

const model = defineModel<number>({ default: 0 })
const labelId = useId()

const stateOf = (index: number): DsDiamondState => {
  if (index <= model.value - regained) return 'filled'
  if (index <= model.value) return 'regained'
  if (index <= model.value + possible) return 'possible'
  return 'empty'
}

const toggle = (index: number) => {
  model.value = index === model.value ? index - 1 : index
}
</script>

<style scoped>
.counter {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 12px;
}

.counter__count {
  font-size: 12px;
  color: var(--color-ds-mute);
}

.counter__cells {
  display: flex;
  align-items: center;
}

.counter__cell {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

button.counter__cell { cursor: pointer; }
button.counter__cell:focus-visible { outline: 2px solid var(--color-ds-gold); }
</style>
