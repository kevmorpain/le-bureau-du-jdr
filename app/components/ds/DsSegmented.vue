<template>
  <div
    role="radiogroup"
    :aria-label="label"
    class="ds-cut-corner box-border flex w-full gap-px bg-ds-gold-dim p-px [--ds-cut:7px]"
  >
    <button
      v-for="(option, index) in options"
      :key="String(option.value)"
      ref="buttons"
      type="button"
      role="radio"
      :aria-checked="option.value === model"
      :tabindex="option.value === model || (model === undefined && index === 0) ? 0 : -1"
      class="flex flex-1 cursor-pointer items-center justify-center px-2.5 py-2 text-[12.5px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ds-gold"
      :class="option.value === model
        ? 'bg-[color-mix(in_srgb,var(--color-ds-gold)_20%,var(--color-ds-panel-raised))] text-ds-ink shadow-[inset_0_-2px_0_var(--color-ds-gold)]'
        : 'bg-ds-panel-raised text-ds-mute hover:text-ds-ink'"
      :style="clipOf(index)"
      @click="model = option.value"
      @keydown="onKeydown($event, index)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<script lang="ts" setup generic="T extends string | number">
export interface DsOption<V> { value: V, label: string }

const props = defineProps<{ options: DsOption<T>[], label: string }>()
const model = defineModel<T>()
const buttons = useTemplateRef<HTMLButtonElement[]>('buttons')

const INNER_CUT = '6.6px'
const clipOf = (index: number) => {
  const last = props.options.length - 1
  if (index === 0 && index === last) return { clipPath: `polygon(${INNER_CUT} 0, 100% 0, 100% calc(100% - ${INNER_CUT}), calc(100% - ${INNER_CUT}) 100%, 0 100%, 0 ${INNER_CUT})` }
  if (index === 0) return { clipPath: `polygon(${INNER_CUT} 0, 100% 0, 100% 100%, 0 100%, 0 ${INNER_CUT})` }
  if (index === last) return { clipPath: `polygon(0 0, 100% 0, 100% calc(100% - ${INNER_CUT}), calc(100% - ${INNER_CUT}) 100%, 0 100%)` }
  return undefined
}

const STEP: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }

const onKeydown = (event: KeyboardEvent, index: number) => {
  const step = STEP[event.key]
  if (!step) return
  event.preventDefault()
  const next = (index + step + props.options.length) % props.options.length
  model.value = props.options[next]!.value
  buttons.value?.[next]?.focus()
}
</script>
