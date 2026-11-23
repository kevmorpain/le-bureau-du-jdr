<template>
  <div
    role="radiogroup"
    :aria-label="label"
    class="ds-shape-corner segmented"
  >
    <button
      v-for="(option, index) in options"
      :key="String(option.value)"
      ref="buttons"
      type="button"
      role="radio"
      :aria-checked="option.value === model"
      :tabindex="option.value === model || (model === undefined && index === 0) ? 0 : -1"
      class="segmented__option"
      :class="{ 'segmented__option--on': option.value === model }"
      @click="model = option.value"
      @keydown="onKeydown($event, index)"
    >
      <slot
        name="option"
        :option="option"
      >
        {{ option.label }}
      </slot>
    </button>
  </div>
</template>

<script lang="ts" setup generic="T extends string | number">
export interface DsOption<V> { value: V, label: string }

const { options, label } = defineProps<{ options: DsOption<T>[], label: string }>()
const model = defineModel<T>()
const buttons = useTemplateRef<HTMLButtonElement[]>('buttons')

const STEP: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }

const onKeydown = (event: KeyboardEvent, index: number) => {
  const step = STEP[event.key]
  if (!step) return
  event.preventDefault()
  const next = (index + step + options.length) % options.length
  model.value = options[next]!.value
  buttons.value?.[next]?.focus()
}
</script>

<style scoped>
/* Le premier et le dernier segment reprennent le coin du conteneur, rentré pour son bord de 1 px (cf. .ds-bevel). */
.segmented {
  --ds-cut: var(--ds-cut-control);
  --inner-cut: calc(var(--ds-cut) - 0.4142px);
  display: flex;
  gap: 1px;
  width: 100%;
  padding: 1px;
  background: var(--color-ds-gold-dim);
}

.segmented__option {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 10px;
  font-size: 12.5px;
  font-weight: 700;
  color: var(--color-ds-mute);
  background: var(--color-ds-panel-raised);
  cursor: pointer;
}

.segmented__option:first-child { clip-path: polygon(var(--inner-cut) 0, 100% 0, 100% 100%, 0 100%, 0 var(--inner-cut)); }
.segmented__option:last-child { clip-path: polygon(0 0, 100% 0, 100% calc(100% - var(--inner-cut)), calc(100% - var(--inner-cut)) 100%, 0 100%); }
.segmented__option:only-child { clip-path: polygon(var(--inner-cut) 0, 100% 0, 100% calc(100% - var(--inner-cut)), calc(100% - var(--inner-cut)) 100%, 0 100%, 0 var(--inner-cut)); }

.segmented__option:hover { color: var(--color-ds-ink); }
.segmented__option:focus-visible { outline: none; box-shadow: inset 0 0 0 2px var(--color-ds-gold); }

.segmented__option--on {
  color: var(--color-ds-ink);
  background: color-mix(in srgb, var(--color-ds-gold) 20%, var(--color-ds-panel-raised));
  box-shadow: inset 0 -2px 0 var(--color-ds-gold);
}
</style>
